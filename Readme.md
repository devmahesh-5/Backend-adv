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