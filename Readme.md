Advance Backend startup

#  use eraser for data modeling
- [Eraser](https://app.eraser.io/workspace/bpYGl2nZxnEwVuyo95HV)

# [Go to index](./index.js)
 
 ## how to connect to db
 - [mongoose documentation](https://mongoosejs.com/docs/index.html)
 - don't connect db in one line
 - [we connect mongodb project we created at atlas](https://cloud.mongodb.com/v2/676d76029e97fe11061386a9#/clusters)
 - atlas database connect aws region behind the scene
  # Further
    - npm install mongoose,dotenv,express
    - there may be problem database connection so always use try catch block
    - use async await (use IIFE)
    - configure dotenv
    - setup express for app
    - cors setup
    - app.use() function to setup express as data is requested from client in different formats
    - middleware is used for authentication like stuffs as we have to authenticate user before giving access to data
    - cookie parser for using cookies for data acceptance and sending
    - we used asyncHandler function as utility function to wrap up fn
    - next is used for middleware chain
  
  ## models
  * we used mongoose schema and model to create models
  * futher we use a package called mongoose-aggregate-paginate-v2 to add pagination to our models
      1. it is used for custom query in database
      2. it allows us to use custom plugins 
  * use bcrypt, a library to help you hash passwords.
       1. it is used for password hashing
       2. we can also compare encrypted password and plan password as password is ecrypted before saving in database
  * use jsonwebtoken, a library to help you create and verify JWT tokens.
       1. it is used for token based authentication
       2. it is used for authorization
       3. it is used for generating token
       4. jwt.sign() to generate token
       5.[ it takes 3 arguments(payload,secretKey,options)](.env.sample)
  * use cloudinary a library to help you upload files to cloudinary here we upload file from temprorary local file to cloudinary if failed we delete the local file
  * multer is used as middleware to handle file upload