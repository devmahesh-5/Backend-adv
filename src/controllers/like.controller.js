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

    if(isLiked){
      const toggleLike =  await Like.findByIdAndDelete(isLiked._id);
    }else {
        const toggleLike =  await Like.create({
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

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}