import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models";
export const verifyJWT=asyncHandler(async(req,res,next)=>{
    const token = await req.cookie?.accessToken || req.header("Authorization").replace("Bearer ","")
    if(!token){
        throw new ApiError(401,"User authorization failed"); 
    }

     const  decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SCERETS);//this is decoded to the object we provided on jwt.sign() method if token is verified
    const user= await User.findById(decodedToken._id).select(
        "-password -refreshToken"
    )
    req.user=user;
    next();

})