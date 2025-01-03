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

- we seperate the controllers and router to maintain good practice.

## [Controllers](./src/controllers/user.controller.js)
* we used asyncHandler function as utility function to wrap up functions
* Controllers define what happens when a specific route is accessed.
  
[check app.js](./src/app.js)
   
## [Routes](./src/routes/user.routes.js)
* Routes define the URL patterns and HTTP methods that the application responds to.
* A route is a mapping between a URL and a controller function.
* A route acts as a "traffic director" that decides which controller function to execute based on the incoming request.
* route is import and declared in app.js with app.use('route-url',router) method and the routes.js is activated

*********** for example: routes is /user and controller is the function that sends response to the /user url

## for solving any problem break it down on smaller chunks/steps(thats algorithm)

### user Register   -->  algorithm for user register 
 1. get user data from frontend
 2. validate user data
 3. check if user already exists(email/username)
 4. check for images,avatar
 5. upload image to cloudinary
 6. create user object in database
 7. remove password and refresh token from response
 8. check for user creation
 9. send response to frontend 

- we upload file to cloudinary and save the url in database
- before uploading file to cloudinary we first save the file locally
- we use multer middleware to handle file upload   
- First thing controllers runs after user set data and click submit but using middleware, middleware runs (here files upload) and then only other data is got from user in controller