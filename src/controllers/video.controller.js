import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    //we try using aggregation pipeline and using page and limit and skip
    

    if (userId?.trim() === "") {
        throw new ApiError(400, "User id is required");
    }
    const searchQuery = {
        $or :[ 
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
}
    const videos = await Video.aggregate(
        [
            {
                $match : searchQuery
            },
            {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "owner",
                    pipeline : [
                        {
                            $project : {
                                fullName : 1,
                                username : 1,
                                avatar : 1
                            }
                        }
                    ]
                }
            },
            {
               $sort : {
                   [sortBy] : sortType
               } 
            },//sorted data
            {
                $skip : (page-1)*limit
            },
            {
                $limit : limit
            },
            {
                $addFields : {
                   owner : { $first : "$owner"}
                }
            },
            {
                $project : {
                    _id : 1,
                    title : 1,
                    description : 1,
                    thumbnail : 1,
                    views : 1,
                    createdAt : 1,
                    owner : 1,
                    duration : 1,
                    videoFile : 1
                }
            }
        ]
    )

    if (videos?.length === 0) {
        throw new ApiError(404, "No videos found");
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "Videos fetched successfully"
        )
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}