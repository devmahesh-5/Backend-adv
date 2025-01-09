import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary, { deleteFromCloudinary } from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { options } from "../constants.js";
import { Subscription } from "../models/subscription.models.js";
const generateAccessAndRefreshToken = async (userId) => {
    try {
        //console.log("userId",userId);
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();//see
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        //console.log(refreshToken);

        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
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
    const { username, email, password } = req.body;
    //console.log("Body:",req.body);

    if (!username && !email) {
        throw new ApiError(400, "Username or email required!");
    }

    const loggedUser = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )

    if (!loggedUser) {
        throw new ApiError(404, "User not registered")
    }

    // console.log(loggedUser instanceof mongoose.Document); // Should log `true`
    // console.log(loggedUser)
    const isPasswordValid = await loggedUser.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credential")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(loggedUser._id);
    //console.log("Access Token ",accessToken,refreshToken);

    //now updateuser with not accepting password
    const updatedLoggedUser = User.findById(loggedUser._id).select(
        "-password -refreshToken"
    )

    //now send cookies

    // const options ={
    //     httpOnly: true,
    //     secure : true
    // }//this ensures that cookie is not modifiable from frontend

    res.
        status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new Apiresponse(
                200,
                {
                    user: { accessToken, refreshToken }
                },
                "User logged in Successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    const user = req.user;
    //if user? delete refresh token from database
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    await User.findByIdAndUpdate(
        user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    //now clear the cookies 

    res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new Apiresponse(
                200,
                {},
                "user logged out successfully"
            )

        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const receivedRefreshToken = await req.cookies?.refreshToken || req.body.refreshToken;
    //console.log("Refresh Token: ", receivedRefreshToken);

    if (!receivedRefreshToken) {
        throw new ApiError(401, "Refresh token not found");
    }

    try {
        const decodedToken = jwt.verify(
            receivedRefreshToken,
            process.env.REFRESH_TOKEN_SCERET
        );
        //console.log("Decoded Token: ", decodedToken);
        if (!decodedToken) {
            throw new ApiError(500, "Could not decode refresh token");
        }


        const user = await User.findById(decodedToken?._id);
        //console.log("User: ", user);

        if (!user) {
            throw new ApiError(500, "cannot fetch User");
        }
        // console.log(user.refreshToken);
        // console.log("received",receivedRefreshToken);

        if (receivedRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token Expired or used");
        }
        //console.log("User id: ", user._id);
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
        const newRefreshToken = refreshToken;
        // console.log("Access Token: ", accessToken);
        // console.log("New Refresh Token: ", newRefreshToken);

        if (!accessToken || !newRefreshToken) {
            throw new ApiError(500, "Something went wrong while generating access and refresh token");
        }
        // console.log("options:",options);

        res
            .status(200, "User Session Refrshed Sucessfully")
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new Apiresponse(200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "User Session Refrshed Sucessfully"
                ))
    } catch (error) {
        throw new ApiError(400, "Something went wrong while getting refresh token")
    }
})

const updateUserPassword = asyncHandler(async (req, res) => {
    //get old and new Password
    //get user using cookies
    //run user.isPasswordCorrect methd to check for oldPassword
    //if true change password using moongoose.findByIdAndUpdate
    const { oldPassword, newPassword } = req.body;
    // console.log("Body:", req.body);
    // console.log(oldPassword, newPassword);

    if (!oldPassword || !newPassword) {
        throw new ApiError(401, "old Password and new Password Required")
    }
    const user = await User.findById(req.user._id);
    const isPasswordValid = user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
        throw new ApiError(400, "incorrect Password");
    }

    // await User.findByIdAndUpdate(user._id, {
    //     $set: {
    //         password: newPassword
    //     }
    // },
    //     {
    //         new: true
    //     }
    // )    //this does not trigger the pre post so user another syntax

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    // const { accessToken, refreshToken } = await user.generateAccessAndRefreshToken(user._id);

    res
        .status(200)
        // .cookie("accessToken",accessToken, options)
        // .cookies("refreshToken",refreshToken, options)
        .json(
            new Apiresponse(
                200,
                {},
                "Password Changed Sucessfully"
            )
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(500, "cannot fetch User");
    }

    res.status(200).json(
        new Apiresponse(
            200,
            {
                user
            },
            "User fetched Successfully"
        )
    )

})

const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!(fullName && email)) {
        throw new ApiError(400, "All field are Required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email
            },
        },
        {
            new: true
        }
    ).select("-password")

    res.status(200)
        .json(
            new Apiresponse(
                200,
                user,
                "User updated Sucessfully"
            )
        )

})

const updateAvatar = asyncHandler(async (req, res) => {
    //get files from multer local dir
    //validate
    //upload on cloudinary
    //update cloudinaryurl on database

    const oldUser = await User.findById(req.user?._id).select("-password");
    const oldUserAvatar = oldUser.avatar;
    const avatarPublicId = oldUserAvatar.split('/').pop().split('.')[0];
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //console.log(avatarLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar image is required")
    }
    const avatarCloudinary = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarCloudinary) {
        throw new ApiError(500, "Error Uploading Avatar in cloudinary")
    }
    deleteFromCloudinary(avatarPublicId);
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatarCloudinary?.url,
            }
        },
        {
            new: true
        }
    ).select("-password")

    res
        .status(200)
        .json(
            new Apiresponse(200, user, "User Avatar Updated Sucessfuly")
        )
})

const updateCoverImage = asyncHandler(async (req, res) => {
    //get files from multer local dir
    //validate
    //upload on cloudinary
    //update cloudinaryurl on database
    const oldUser = await User.findById(req.user?._id).select("-password");
    const oldUsercoverImage = oldUser.coverImage;
    const coverImagePublicId = oldUsercoverImage.split('/').pop().split('.')[0];
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files?.coverImage) && req.files?.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0].path;
    }
    const coverImageCloudinary = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImageCloudinary) {
        throw new ApiError(500, "Error Uploading CoverImage in cloudinary")
    }

    deleteFromCloudinary(coverImagePublicId);

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                coverImage: coverImageCloudinary?.url,
            }
        },
        {
            new: true
        }
    ).select("-password")

    res
        .status(200)
        .json(
            new Apiresponse(200, user, "User coverImage Updated Sucessfuly")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    // we get channel from url req.params (not req.body or obiously not from cookies)
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(401, "Username is missing");
    }

    //use aggregation pipeline directly on User model and search for specific username 
    //lookup subscription model and user model for subscriber and subscribed count
    //

    const channel = User.aggregate(//will have additional field to username matched dataset with 1. subscribers (subscription models having channel as id of matched username)  2. ...  3. subscriberCount and 4. subscribedCount
        [
            {
                $match: { username: username?.toLowerCase() }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: " _id",
                    foreignField: "channel",
                    as: "subscribers"
                },
                $lookup: {
                    from: "subscriptions",
                    localField: " _id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                },
                $addFields: {
                    subscriberCount: {
                        $size: "$subscribers"
                    },
                    subscribedCount: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                            then: true,
                            else: false
                        }
                    },
                    $project: {
                        fullName: 1,
                        username: 1,
                        email: 1,
                        subscriberCount: 1,
                        subscribedCount: 1,
                        isSubscribed: 1,
                        avatar: 1,
                        coverImage: 1
                    }
                }

            }
        ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel doesnot exist");
    }

    res.status(200)
        .json(
            new Apiresponse(200, channel[0], "Channel Fetched Sucessfully")
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = User.aggregate([
        {
            $match: {
                id: new mongoose.Types.ObjectId(
                    req.user?._id
                )
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",//this is initially array of objectIds
                foreignField: "_id",
                as: "WatchHistory",
                pipeline: [//nested pipeline
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",//id of one user among User documents across the database
                            foreignField: "_id",
                            as: "owner",
                            //you may need to add another pipeline for project if this code not work
                        },
                        $project : {
                            fullName : 1,
                            username : 1,
                            avatar : 1
                        },
                        $addFields:{
                            $first : "$owner"//first element of owner
                        }

                    }
                ]
            }

        }

    ])

    res
    .status(200)
    .json(
        new Apiresponse(200,user[0]?.watchHistory, "Watch History Fetch Successfully")
    )

})

export { registerUser, loginUser, logoutUser, refreshAccessToken, updateUserPassword, updateUserDetails, getCurrentUser, updateAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory }