import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const isSubscribed = await Subscription.findOne(
        {
            channel: channelId,
            subscriber: req.user?._id
        }
    )
    let toggleSubscription;
    if (isSubscribed) {
        toggleSubscription = await Subscription.findByIdAndDelete(isSubscribed._id);
    }else {
        toggleSubscription = await Subscription.create({
            channel: channelId,
            subscriber: req.user?._id
        })
    }

    if (!toggleSubscription) {
        throw new ApiError(500, "Something went wrong while toggling subscription");
    }
    res.status(200).json(
        new Apiresponse(
            200,
            toggleSubscription,
            "Subscription toggled successfully"
        )
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    //Algorithm
    //get all the subscriptions where channel id is channelId
    //now group by channel id and create an array of subscribers
    //now lookup user collection where _id is channel id
    //project subscriber field
    const {channelId} = req.params
    const subscriberList = await Subscription.aggregate([
        {
            $match : {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group : {
                _id : "$subscriber",
                subscribers : {
                    $addToSet : "$subscriber"
                }
            }
        },
        {
            $project : {
                subscribers : 1
            }
        },
        {
            $lookup : {
                from: "users",
                localField : "subscribers",
                foreignField : "_id",
                as : "subscribers",
                pipeline : [
                    {
                        $project : {
                            _id : 1,
                            username : 1,
                             fullName: 1,
                             avatar : 1
                        }
                    }
                ]
            }
        },
    ])

    if (!subscriberList) {
        throw new ApiError(500, "Something went wrong while getting subscribers");
    }
    res.status(200).json(
        new Apiresponse(
            200,
            subscriberList[0].subscribers,
            "Subscribers fetched successfully"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    //Algorithm
    //get all the subscriptions where subscriber is subscriberId
    //now group by subscriber and create an array of channels
    //now lookup user collection where _id is channels 
    //project channel field

    const subscribedChannels = await Subscription.aggregate([
        {
            $match : {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $group : {
                _id : "$subscriber",
                channels : {
                    $addToSet : "$channel"
                }
            }
        },
        {
            $project : {
                channels : 1
            }
        },
        {
            $lookup : {
                from: "users",
                localField : "channels",
                foreignField : "_id",
                as : "channels",
                pipeline : [
                    {
                        $project : {
                            _id : 1,
                            username : 1,
                             fullName: 1,
                             avatar : 1
                        }
                    }
                ]
            }
        },
    ])

    if (!subscribedChannels) {
        throw new ApiError(500, "Something went wrong while getting channels");
    }
    res.status(200).json(
        new Apiresponse(
            200,
            subscribedChannels[0].channels,
            "Channels fetched successfully"
        )
    )
  
})
export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}