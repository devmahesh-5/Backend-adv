import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/Apiresponse.js"
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
    
    if ([title, description].some((field) => {
        field?.trim() === "";
    })) {
        throw new ApiError(400, "All fields are required");
    }
    
    const localVideoPath = req.files?.videoFile[0]?.path
    const localThumbnailPath = req.files?.thumbnail[0]?.path

    if(!localVideoPath || !localThumbnailPath) {
        throw new ApiError(400, "Video and thumbnail are required");
    }

    const videoFile = await uploadOnCloudinary(localVideoPath)
    const thumbnailFile = await uploadOnCloudinary(localThumbnailPath)

    if(!videoFile || !thumbnailFile) {
        throw new ApiError(500, "Something went wrong while uploading video");
    }
    const video =await Video.create(
        {
            title,
            description,
            owner: req.user?._id,
            thumbnail : thumbnailFile?.url,
            videoFile : videoFile?.url,
            duration : videoFile?.duration,
            isPublished : false,

        }
    )

    if(!video) {
        throw new ApiError(500, "Something went wrong while creating video");
    }

    res
    .status(201)
    .json(
        new Apiresponse(
            201,
            video,
            "Video created successfully"
        )
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //get video by id
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }
    const video =  await Video.aggregate(
        [
            {
                $match : {
                    _id : videoId
                }
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
                $addFields : {
                    owner : {$first : "$owner"}
                }
            }
        ]
    )

    if(!video) {
        throw new ApiError(404, "Video not found");
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            video,
            "Video fetched successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    //update video details like title, description, thumbnail
    const { videoId } = req.params
    const { title, description} = req.body

    const thumbnailLocalPath = req.file?.path

    if(!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail) {
        throw new ApiError(500, "Something went wrong while uploading thumbnail");
    }

    if([title, description].some((field) => {
        field?.trim() === "";
    })) {
        throw new ApiError(400, "All fields are required");
    }

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findByIdAndUpdate(
        {
            _id : videoId
        },
        {
            title,
            description,
            thumbnail :thumbnail.url
        }
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if(!deletedVideo) {
        throw new ApiError(500, "Something went wrong while deleting video");
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            deletedVideo,
            "Video deleted successfully"
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //toggle published status of video

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const tooglepublish = await Video.findByIdAndUpdate(
        {
            _id : videoId
        },
        {
           $set: {
            isPublished : {
                $not : ["$isPublished"]//used for query only
            }
        },
            //or use equlity operator
            // $set : {
            //     isPublished : {
            //         $eq : [false,"$isPublished"]}//this returns true if isPublished is false
            // }
        },
        {
            new : true
        }
    )

    if (!tooglepublish) {
        throw new ApiError(500, "Something went wrong while toggling publish status");
        
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            tooglepublish,
            "Publish status toggled successfully"
        )
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}