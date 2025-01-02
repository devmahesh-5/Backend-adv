import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
const registerUser = asyncHandler(async (req, res) => {
    const { username, password, fullName, email } = req.body;
    console.log("Email:", email);
    //validate user data
    if ([username, password, fullName, email].some((field) => {
        field?.trim() === "";
    })) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = User.findOne({
        $or: [{ username }, { email }]
    })
    if (existingUser) {
        throw new ApiError(400, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatarCloudnary = await uploadOnCloudinary(avatarLocalPath);
    const coverImageCloudinary = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatarCloudnary || !coverImageCloudinary) {
        throw new ApiError(500, "Avatar not uploaded");
    }
    
    res.status(200).json({
        message: "User registered successfully"
    })



})

export { registerUser }