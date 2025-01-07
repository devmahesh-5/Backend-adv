import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app =express();
app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
        credentials:true
    }
));
app.use(express.json({limit:"16kb"}));//middleware to accept json and  provide in req.body
app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}));
app.use(express.static("public"));//to serve static files
app.use(cookieParser());//to parse cookies

//routes import
import userRouter from './routes/user.routes.js';

//routes declaration
app.use('/api/v1/users',userRouter);//as user hits /users it passes the control to userRouter

export {app};