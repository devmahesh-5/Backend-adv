import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema = new Schema({//userSchema is a instance of mongoose schema
    watchhistory:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }],
    username: {
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        unique:true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
   fullName: {
       type: String,
       required: true,
       trim: true,
       index: true
   },
   avatar: {
       type: String,//cloudnary url
       requied: true
   },
   coverImage: {
       type: String,
   },
   password: {
       type: String,
       required: [true,"Password required"],
       min: [6, 'Must be at least 6, got {VALUE}'],
       max: 12
   },
   refreshToken:{
    type:String
   }

},{timestamps:true})

userSchema.pre("save", async function(next){//we dont use arrow function as it has no access to this context
    if(!this.isModified("password")) return next();
    this.password= await bcrypt.hash(this.password,10);
    next()//for another middleware 
})//middleware run before saving and change password with hash value of password
userSchema.methods.isPasswordCorrect=async function (password) {
    return await bcrypt.compare(password,this.password);
}//in this context 'this' refers to the function /user on which this function is called and it reeturns true or false
//eg:const isMatch = await user.isPasswordCorrect('user-entered-password');
userSchema.methods.generateAccessToken=function(){//this method is created by instance for itself but not on prototype
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName,
        },
        process.env.ACCESS_TOKEN_SCERET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SCERET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User=mongoose.model("User",userSchema);