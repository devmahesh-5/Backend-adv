import {Router} from "express";
import  {
    loginUser,
     registerUser,
     logoutUser,
     refreshAccessToken, 
     updateUserPassword,
     getCurrentUser,
     updateUserDetails, 
     updateCoverImage, 
     updateAvatar,
    getUserChannelProfile,
    getWatchHistory
    } from '../controllers/user.controller.js'
const router = Router();
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middlewares.js";
router.route('/register').post(//first thing controllers runs after user set data and click submit but using middleware, middleware runs (here files upload) and then only other data is got from user in controller
    upload.fields([
        {
            name:'avatar',
            maxCount:1
        },
        {
            name:'coverImage',
            maxCount:1
        }
    ]),
    registerUser
)//https:localhost:8000/api/v1/users/register
// userRouter.route('/login').post(loginUser);
router.route('/login').post(loginUser)

//secured routes
router.route('/logout').post(
    verifyJWT,
    logoutUser
)

router.route('/refresh-token').post(
    refreshAccessToken
)

router.route('/change-password').post(
    verifyJWT,
    updateUserPassword
)

router.route('/getCurrentUser').get(
    verifyJWT,
    getCurrentUser
)

router.route('/updateAccount').patch(
    verifyJWT,
    updateUserDetails
)

router.route('/updateAvatar').patch(
    verifyJWT,
    upload.fields([
        {
            name:'avatar',
            maxCount:1
        }
    ]),
    updateAvatar
)

router.route('/updateCoverImage').patch(
    verifyJWT,
    upload.fields([
        {
            name:'coverImage',
            maxCount:1
        }
    ]),
    updateCoverImage
)

router.route('/c/:username').get(
    verifyJWT,
    getUserChannelProfile
)
router.route('/history').get(
    verifyJWT,
    getWatchHistory
)
export default router;