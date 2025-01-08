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
- we get data of current user from database after user created and but refreshToken and password is not sent to frontend

# Refresh Token & Access Token
- refresh token is used to get new access token
- access token is used for authentication and authorization
- once access token expires we get new access token using refresh token
- refresh token has longer validity than access token
- fontend engineer will use refresh token to get new access token by hitting specific endpoint

# user Login   -->  algorithm for user login
 1. get user data(email/username) from frontend(req.body)
 2. check if user exists in database
 3. check if password is correct
 4. generate access token and refresh token
 5. send response to frontend (send cookies)
 
 * while sending cookie send options with httpOnly and secure also to ensure that cookie is not modifiable from frontend

# user Logout   -->  algorithm for user logout
* we use a middleware to handle logout it use use cookie to get refresh token and access token
* for mobile user accessing jwt token is done using req.header("authorization") it returns bearer <token>
* Algorithm
 1. make a middleware to verify jwt token and get user (it may be used for other routes also)
 2. from the user we got, delete refresh token in database
 3. send response to the frontend(i.e, clear cookies)

# RefreshAccessToken   -->  algorithm for refresh access token
   1. we use a middleware to handle refresh access token it use use cookie to get refresh token and access token
  2. get user and rungenerateAccessAndRefreshToken
  3. send response to the frontend(i.e, set cookies)

# updatePassword   -->  algorithm for update password
  1. get current and old password from frontend(req.body)
  2. check if old password is correct
  3. if password is correct update password in database
  4. save user in database

# getCurrentUser   -->  algorithm for get current user
  1. we use a middleware to handle get current user it use use cookie to get refresh token and access token
  2. get user and send response to frontend

# subscription Schema and Model
  1. we use mongoose schema and model to create models
  2. in this model, every time subscription is updated we create a new document in subscription collection(i.e, document is created every time when new subscribe or channel is created ) 
  3. we get count of subscriber for any (say x) channel by counting documents where channel is 'x'
  4. we get total subscribed channels of user (y) by counting documents where subscriber is 'y'

# Aggregation Pipeline
  - consists of stages
  - each stage performs operation on input documents
  - output of one stage is input of next stage