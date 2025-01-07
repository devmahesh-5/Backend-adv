import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";
export const verifyJWT=asyncHandler(async(req,_,next)=>{
    const token = await req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    // console.log(req.cookies?.accessToken) 
    if(!token){
        throw new ApiError(401,"User authorization failed"); 
    }

     const  decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SCERET);//this is decoded to the object we provided on jwt.sign() method if token is verified
    const user= await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
    )
    req.user=user;
    next();

})