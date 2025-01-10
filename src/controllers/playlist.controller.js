import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if ([name, description].some((field) => {
        field?.trim() === "";
    })) {
        throw new ApiError(400, "All fields are required");
    }
    
    const playlist = await Playlist.create(
        {
            name,
            description,
            owner: req.user?._id
        }
    )

    const createdPlaylist = await Playlist.findById(playlist._id);

    res.status(201).json(
        new Apiresponse(
            201,
            createdPlaylist,
            "Playlist created successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {// we might use pagination
    const {userId} = req.params
    if (userId?.trim() === "") {
        throw new ApiError(400, "User id is required");
    }
    const userPlaylist = await Playlist.aggregation(
        [
            {
                $match: {//instead we can use $search { index:"index defined for playlist collection",{query: userId, path: "owner"} }
                    owner: mongoose.Types.ObjectId(userId)
                },
                $lookup: {
                    from : "videos",
                    localField : "videos",
                    foreignField : "_id",
                    as : "videos",
                    pipeline : [
                        {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner"
                        },
                        $project : {
                            fullName : 1,
                            username : 1,
                            avatar : 1
                        },
                        $addFields:{
                            $first : "$owner"//first element of owner
                        }
                    }
                    ]
                }
            }
        ]
    )

    res.status(200).json(
        new Apiresponse(
            200,
            userPlaylist,
            "Playlist fetched successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: get playlist
    //get playlist id from params
    //get playlist by id
    //use aggregation pipeline
    //get videos from Video model by playlist id and join
    //get owner from User model by video owner id and join

    if(playlistId?.trim() === "") {
        throw new ApiError(400, "Playlist id is required");
    }

    const playlist = await Playlist.aggregate(
        [
            {
                $match : {
                    _id : mongoose.Types.ObjectId(playlistId)
                },
                $lookup :{
                    from : "videos",
                    localField : "videos",
                    foreignField : "_id",
                    as : "videos",
                    pipeline : [
                        {
                            $lookup :{
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
                                        },
                                        $addFields : {
                                            $first : "$owner"
                                        }

                                    }
                                ]
                            }
                        }
                    ]
                }
            }
    ])
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: add video to playlist
    //get playlist id and video id from params
    //add video id to playlist videos array

    // const playlist = await Playlist.findById(playlistId);
    // playlist.videos.push(videoId);
    // await playlist.save();
    if (playlistId?.trim() === "" || videoId?.trim() === "") {
        throw new ApiError(400, "Playlist id and video id are required");
    }

    const playlist = await Playlist.updateOne(
        {
            _id : playlistId
        },
        {
            $addToSet : {
                videos : videoId
            }
        }
    )

    if (playlist.modifiedCount < 0) {
        throw new ApiError(400, "video not added to playlist");
    }
    
    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            playlist,
            "Video added to playlist successfully"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (playlistId?.trim() === "" || videoId?.trim() === "") {
        throw new ApiError(400, "Playlist id and video id are required");
    }

    const playlist = await Playlist.updateOne(
        {
            _id : playlistId //find playlist by id
        },
        {
            $pull : {
                videos : videoId
            }
        }
    )

    if(!playlist){
        throw new ApiError(400, "Playlist not found");
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            playlist,
            "Video removed from playlist successfully"
        )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // delete playlist

    if (playlistId?.trim() === "") {
        throw new ApiError(400, "Playlist id is required");
    }

    const deletedplaylist = await Playlist.findByIdAndDelete(playlistId);

    if(!deletedplaylist){
        throw new ApiError(400, "Playlist not found");
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            deletedplaylist,
            "Playlist deleted successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //update playlist
    if ([name, description, playlistId].some((field) => {
        field?.trim() === "";
    })) {
        throw new ApiError(400, "All fields are required");
    }

    const updatedplaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name,
            description
        },
        {
            new : true
        }
    )

    if(!updatedplaylist){
        throw new ApiError(400, "Playlist not found");
    }

    res
    .status(200)
    .json(
        new Apiresponse(
            200,
            updatedplaylist,
            "Playlist updated successfully"
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}