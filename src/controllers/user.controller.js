import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { options } from "../constants.js";
const generateAccessAndRefreshToken =async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();//see
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false})
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get data
    const { username, password, fullName, email } = req.body;
    // console.log("Email:", email);
    //validate user data
    // console.log("Body:",req.body);

    if ([username, password, fullName, email].some((field) => {
        field?.trim() === "";
    })) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existingUser) {
        throw new ApiError(400, "User already exists");
    }

    // console.log("files:",req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatarCloudinary = await uploadOnCloudinary(avatarLocalPath);
    const coverImageCloudinary = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatarCloudinary) {
        throw new ApiError(401, "Avatar not uploaded");
    }

    const user = await User.create({
        avatar: avatarCloudinary?.url,
        coverImage: coverImageCloudinary?.url || "",
        username: username.toLowerCase(),
        password,
        fullName,
        email
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"//dont accept password and refreshToken
    );
    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new Apiresponse(200, createdUser, "User Registered sucessfully")
    )



})

const loginUser = asyncHandler(async (req, res) => {
    //   get user data(email/username) from frontend(req.body)
    //   check if user exists in database
    //   check if password is correct
    //   generate access token and refresh token
    //   send response to frontend (send cookies)
    const {username,email,password}=req.body;
    //console.log("Body:",req.body);
    
    if(!username && !email){
        throw new ApiError(400,"Username or email required!");
    }

    const loggedUser=await User.findOne(
        {
            $or:[{username},{email}]
        }
    )

    if(!loggedUser){
        throw new ApiError(404,"User not registered")
    }

   // console.log(loggedUser instanceof mongoose.Document); // Should log `true`
    // console.log(loggedUser)
    const isPasswordValid = await loggedUser.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User Credential")
    }
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(loggedUser._id);
    //console.log("Access Token ",accessToken,refreshToken);
    
    //now updateuser with not accepting password
    const updatedLoggedUser=User.findById(loggedUser._id).select(
        "-password -refreshToken"
    )

    //now send cookies

    // const options ={
    //     httpOnly: true,
    //     secure : true
    // }//this ensures that cookie is not modifiable from frontend

    res.
    status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new Apiresponse(
            200,
            {
                user: {accessToken,refreshToken}
            },
            "User logged in Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res)=>{
    const user = req.user;
    //if user? delete refresh token from database
    if(!user){
        throw new ApiError(404,"User not found");  
    }

    await User.findByIdAndUpdate(
        user._id,
        {
           $set: {
            refreshToken: undefined
           }
        },
        {
            new : true
        }
    )
    //now clear the cookies 
   
    res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new Apiresponse(
            200,
            {},
            "user logged out successfully"
        )
        
    )
})

const refreshAccessToken =asyncHandler(async(req,res)=>{
    const receivedRefreshToken = await req.cookies?.refreshToken || req.body.refreshToken;
    if(!receivedRefreshToken){
        throw new ApiError(401,"Refresh token not found");
    }

    try {
        const decodedToken = jwt.verify(
            receivedRefreshToken,
            REFRESH_TOKEN_SCERET
        );
        if (!decodedToken) {
            throw new ApiError(500,"Could not decode refresh token");
        }
    
        const user = await User.findById(decodedToken?._id);
    
        if (!user) {
            throw new ApiError(500, "cannot fetch User");
        }
    
        if (receivedRefreshToken !== user.refreshToken){
            throw new ApiError(401, "Refresh Token Expired or used");
        }
        const {accessToken,newRefreshToken} = await user.generateAccessAndRefreshToken(user._id)
    
        res
        .status(200,"User Session Refrshed Sucessfully")
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken",newRefreshToken, options)
        .json(
            new Apiresponse(200,
                {
                    accessToken,
                    refreshToken:newRefreshToken
            },
            "User Session Refrshed Sucessfully"
        ) )
    } catch (error) {
        throw new ApiError(400,"Something went wrong while getting refresh token")
    }
})
export { registerUser, loginUser,logoutUser,refreshAccessToken }