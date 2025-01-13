import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    //algorithm
    //find if in likes collection, if there is videoId, then remove, else add
    const isLiked = await Like.findOne(
        {
            video: videoId,
            likedBy:req.user?._id
        }
    )
 let  toggleLike;
    if(isLiked){
     toggleLike =  await Like.findByIdAndDelete(isLiked._id);
    }else {
         toggleLike =  await Like.create({
            video: videoId,
            likedBy:req.user?._id
        })   
    }
    if (!toggleLike) {
        throw new ApiError(500, "Something went wrong while toggling like");
        
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            toggleLike,
            "Like toggled successfully"
        )
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const isLiked = await Like.findOne(
        {
            comment: commentId,
            likedBy:req.user?._id
        }
    )
    let  toggleLike;
    if(isLiked){
      toggleLike =  await Like.findByIdAndDelete(isLiked._id);
    }else{
         toggleLike =  await Like.create({
            comment: commentId,
            likedBy:req.user?._id
        })
    }

    if (!toggleLike) {
        throw new ApiError(500, "Something went wrong while toggling like");
        
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            toggleLike,
            "Like toggled successfully"
        )
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const isLiked = await Like.findOne(
        {
            tweet : tweetId,
            likedBy:req.user?._id
        }
    )
    let  toggleLike;
    if(isLiked){
      toggleLike =  await Like.findByIdAndDelete(isLiked._id);
    }else{
        toggleLike =  await Like.create({
            tweet : tweetId,
            likedBy:req.user?._id
        })
    }

    if (!toggleLike) {
        throw new ApiError(500, "Something went wrong while toggling like");
        
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            toggleLike,
            "Like toggled successfully"
        )
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    
    //Algorithm 
    //get all like documents where likedBy = req.user._id
    //then group by likedBy
    //then create array of videos where value is the videoId of all liked videos by user
    //then lookup videos collection and get all videos where _id is in videos array
    
    const likedVideos = await Like.aggregate(
        [
            {
                $match :{
                    likedBy : req.user?._id
                }
            },
            {
                $group :{
                    _id : "$likedBy",
                    videos : {
                        $addToSet : "$video"
                    }
                }
            },
            {
                $lookup :{
                    from : "videos",
                    localField : "videos",
                    foreignField : "_id",
                    as : "videos"
                }
            },
            
        ]
    )

    if (!likedVideos) {
        throw new ApiError(500, "Something went wrong while getting liked videos");
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            likedVideos[0]?.videos,
            "Liked videos fetched successfully"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}