import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    if (content?.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.create(
        {
            content,
            owner: req.user?._id
        }
    )

    if(!tweet) {
        throw new ApiError(500, "Something went wrong while creating tweet");
    }

    res
    .status(201)
    .json(
        new Apiresponse(
            201,
            tweet,
            "Tweet created successfully"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    //Algorithm
    //get tweets by user id
    const userId = req.params.userId
    if(userId?.trim() === "") {
        throw new ApiError(400, "User id is required");
    }
    const tweets = await Tweet.find(
        {owner : userId}
    ).select("-owner")

    if(!tweets || tweets.length === 0) {
        throw new ApiError(500, "Something went wrong while getting tweets");
    }
    //console.log(tweets);
    
    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            tweets,
            "Tweets fetched successfully"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const tweetId = req.params.tweetId
    //console.log("content",content,"TweetId",tweetId);
    
    if (!content || content?.trim() === "" || !tweetId) {
        throw new ApiError(400, "all fields are required");
    }

    const tweet = await Tweet.findOneAndUpdate(
        {
            _id : tweetId,
            owner : req.user?._id
        },
        {
            content
        },
        {
            new : true
        }
    )

    if(!tweet) {
        throw new ApiError(500, "Something went wrong while updating tweet");
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            tweet,
            "Tweet updated successfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //use findOneAndDelete
    const tweetId = req.params.tweetId
    if (!tweetId) {
        throw new ApiError(400, "all fields are required");
    }

    const tweet = await Tweet.findOneAndDelete(
        {
            _id : tweetId,
            owner : req.user?._id
        }
    )

    if(!tweet) {
        throw new ApiError(500, "Something went wrong while deleting tweet");
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            tweet,
            "Tweet deleted successfully"
        )
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}