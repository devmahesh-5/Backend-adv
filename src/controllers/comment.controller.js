import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const paginationToken = req.query.paginationToken

    if (videoId?.trim() === "") {
        throw new ApiError(400, "Video id is required");
    }

    const comments = await Comment.aggregate(
        [
            {
                $search : {
                    index : "comments_index",
                    text : {
                        query :videoId,
                        path : "video"
                    },
                    searchAfter : paginationToken || undefined
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "owner"
                }
            },
            {
                $addFields : {
                   owner : { $first : "$owner"}
                }
            },
            {
                $project : {
                    content : 1,
                    createdAt : 1,
                    "owner._id" : 1,
                   "owner.fullName" : 1,
                    "owner.username" : 1,
                    paginationToken : { $meta : "searchSequenceToken" }
                }
            }
        ]
    )

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            comments,
            "Comments fetched successfully"
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} = req.body;
    if (content?.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.create(
        {
            content,
            video : req.params.videoId,
            owner : req.user._id
        }

    )
    if (!comment) {
        throw new ApiError(400, "Comment not created");
    }

    res
    .status(201)
    .json(
        new Apiresponse(
            201,
            comment,
            "Comment created successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    
    const {commentId} = req.params
    const {content} = req.body
    if (content?.trim() === "" || commentId?.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new : true
        }
    )
    if (!comment){
        throw new ApiError(400, "Comment not updated");
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            comment,
            "Comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if (commentId?.trim() === "") {
        throw new ApiError(400, "Comment id is required");
    }

    const comment = await Comment.findByIdAndDelete(commentId)
    if (!comment){
        throw new ApiError(400, "Comment not deleted");
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            comment,
            "Comment deleted successfully"
        )
    )

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }