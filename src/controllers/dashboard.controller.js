import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { subscribe } from "diagnostics_channel"
import { User } from "../models/user.models.js"
const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    //get channel id from req.user

    //1.get total video views
    //2.get total subscribers
    //3.get total videos
    //4.get total likes

    const channelId = req.user?._id;
    if (!channelId) {
        throw new ApiError(400, "Channel id is required");
    }

    // const totalViews = await User.aggregate(//totalViews is an object of videos(videos : {totalViews : value})
    //     [
    //         {
    //             $match: {
    //                 _id: new mongoose.Types.ObjectId(channelId)
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from : "videos",
    //                 localField : "_id",
    //                 foreignField : "owner",
    //                 as : "videos",//videos model
    //                 pipeline : [//this pipeline has excess of videos document
    //                     {//now we are in users.videos
    //                         $group :{//group of all videos document 
    //                             _id : "$owner",
    //                             totalViews : {$sum : "$views"},
    //                         }//upto here we get user and in user there is videos field and in the videos there will be grouped object with id and total views (in array of videos)
    //                     },
    //                     {
    //                         $project : {//in videos there is grouped object and the object now is projected to show only total views
    //                             _id : 0,
    //                             totalViews : 1
    //                         }//array of objects with total views
    //                     },
                       
    //                 ]
    //             }
    //         },
    //         {
    //             $addFields : {//add field to videos
    //                 videos : {
    //                 $first : "$videos"//first element of videos(total views)
    //             }
    //             }
    //         },
    //         {
    //             $project : {
    //                 videos : 1
    //             }
    //         }
    //     ]
    // )
    const totalViewsAndVideos = await Video.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(channelId)
                }//gets all videos of the channel
            },
            {
                $group : {
                    _id : "$owner",
                    totalViews : {$sum : "$views"},
                    totalVideos : {$sum : 1}//accumulaes the number of videos
                }//
            },
            {
                $project : {
                    _id : 0,
                    totalViews : 1,
                    totalVideos : 1
                }
            }
        ]
    )

    const totalSubscribers = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from : "subscriptions",
                    localField : "_id",
                    foreignField : "channel",
                    as : "subscribers",//subscriptions model
            }
        },
        {
            $group : {
                _id : "$_id",
                subscribersCount : {$sum : 1}
            }
        },
    //     { 
    //         $addFields : {
    //         subscribersCount : {$size : "$subscribers"}
    //     }
    // },
    {
        $project : {
            _id : 0,
            subscribersCount : 1
        }
    },
   
    ]
    )

    // const totalSubscribers = await Subscription.aggregate(
    //     [
    //         {
    //             $match: {
    //                 channel: new mongoose.Types.ObjectId(channelId)
    //             }
    //         },
    //         {
    //             $count : "totalDocuments"
    //         },
    //         // {
    //         //     $project : {
    //         //         subscribersCount : 1
    //         //     }
    //         // }
    //     ]
    // )

    const totalLikes = await Video.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from : "likes",
                    localField : "_id",
                    foreignField : "video",
                    as : "likes",//likes model
                }
            },
            {
                $addFields : {
                    likesCount : {$size : "$likes"}
                }
            },
            {
                $group : {
                    _id : "$owner",
                    likesCount : {$sum : "$likesCount"}
                }
            },
            {
                $project : {
                    _id : 0,
                    likesCount : 1
                }
            }

        ]
    )

    if(!totalViewsAndVideos[0] || !totalSubscribers || !totalLikes){ 
        throw new ApiError(400, "Something went wrong while getting channel stats");
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            {
                totalViews: totalViewsAndVideos[0].totalViews,
                totalVideos : totalViewsAndVideos[0].totalVideos,
                totalSubscribers : totalSubscribers[0].subscribersCount,
                // subscribersCount,
                totalLikes : totalLikes[0].likesCount
            },
            "Channel stats fetched successfully"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    
    const videos = await Video.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $lookup: {
                    from : "users",
                    localField: "owner",
                    foreignField : "_id",
                    as : "owner"
                }
            },
            {
                $addFields : {
                    owner : {$first : "$owner"}
                }
            },
            {
                $project : {
                    _id : 1,
                    title : 1,
                    thumbnail : 1,
                    views : 1,
                    createdAt : 1,
                    "owner.username" : 1,
                    "owner.avatar" : 1,
                    "owner.fullName" : 1
                }
            }
        ]
    )

    if(!videos){
        throw new ApiError(400, "Something went wrong while getting channel videos");
    }

    res.status(200).json(
        new Apiresponse(
            200,
            videos,
            "Channel videos fetched successfully"
        )
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }