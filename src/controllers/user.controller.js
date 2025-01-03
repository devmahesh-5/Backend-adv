import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/Apiresponse.js";
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

export { registerUser }