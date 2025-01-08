import {v2 as cloudinary} from "cloudinary";
import fs from "fs";



    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SCERET // Click 'View API Keys' above to copy your API secret
    });
    
    // Upload file
 const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if (!localFilePath) return null;
        // Upload to Cloudinary
        const uploadResult =await cloudinary.uploader
        .upload(localFilePath,{
            resource_type:'auto',
        })
        //file uploaded successfully
        
        fs.unlinkSync(localFilePath)//remove the locally saved temporary file
        return uploadResult;

    } catch (error) {
        fs.unlinkSync(localFilePath)//remove the locally saved temporary file as the upload got failed
        console.log("Cloudinary upload error::",error);
        return null;
    }
 }

 export const deleteFromCloudinary = async (publicId)=>{
    try {
        if (!publicId) return null;
        // Upload to Cloudinary
        const deleteResult = await cloudinary.uploader
        .destroy(publicId,{
            resource_type:'auto',
        })
        return deleteResult;

    } catch (error) {
        
        console.log("Cloudinary file deletion error::",error);
        return null;
    }
 }
 export default uploadOnCloudinary;