import {Router} from "express";
import  {loginUser, registerUser,logoutUser} from '../controllers/user.controller.js'
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
router.route('/logout').post(
    verifyJWT,
    logoutUser
)
export default router;