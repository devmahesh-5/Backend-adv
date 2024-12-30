class Apiresponse {
    constructor(data,statusCode,message="Success"){
        this.data=data;
        this.statusCode=statusCode;
        this.message=message
        this.sucess=statusCode<400
    }
}






























    ]