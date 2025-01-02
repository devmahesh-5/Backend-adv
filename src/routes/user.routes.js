import {Router} from "express";
import  {registerUser} from '../controllers/user.controller.js'
const router = Router();
import {upload} from '../middlewares/multer.middleware.js'
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
export default router;