import {v2 as cloudinary} from "cloudinary";
import fs from "fs";



    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });
    
    // Upload file
 const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if (!localFilePath) return null;
        // Upload to Cloudinary
        const uploadResult =await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto',
        })
        //file uploaded successfully
        console.log("File uploaded successfully",uploadResult.url);
        return uploadResult;
    } catch (error) {
        fs.unlinksync(localFilePath)//remove the locally saved temporary file as the upload got failed
        console.log("Cloudinary upload error::",error);
        return null;
    }
 }