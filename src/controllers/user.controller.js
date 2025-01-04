import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/Apiresponse.js";

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

const registerUser = asyncHandler(async (req, res, next) => {
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
        throw new ApiError(500, "Avatar not uploaded");
    }

    const user = await User.create({
        avatar: avatarCloudinary.url,
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

const loginUSer = asyncHandler(async (req, res) => {
    //   get user data(email/username) from frontend(req.body)
    //   check if user exists in database
    //   check if password is correct
    //   generate access token and refresh token
    //   send response to frontend (send cookies)
    const {username,email,password}=req.body;
    if(!username && !email){
        throw new ApiError(400,"Username or email required!");
    }

    const loggedUser=User.findOne(
        {
            $or:[{username},{email}]
        }
    )
    if(!loggedUser){
        throw new ApiError(404,"User not registered")
    }

    const isPasswordValid = await loggedUser.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User Credential")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(loggedUser._id)

    //now updateuser with not accepting password
    const updatedLoggedUser=User.findById(loggedUser._id).select(
        "-password -refreshToken"
    )

    //now send cookies

    const options ={
        httpOnly: true,
        secure : true
    }//this ensures that cookie is not modifiable from frontend

    res.
    status(200)
    .cookie("accessToken",accessToken)
    .cookie("refreshToken",refreshToken)
    .json(
        new Apiresponse(
            200,
            {
                user:updatedLoggedUser,accessToken,refreshToken
            },
            "User logged in Successfully"
        )
    )
})

const logoutUSer = asyncHandler(async(req,res)=>{
    
})
export { registerUser, loginUSer }