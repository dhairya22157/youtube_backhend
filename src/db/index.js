import mongoose from "mongoose";
import express from "express";
import {DB_NAME} from "../constants.js";
const app = express();
const connectDB = async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`Connected to MongoDB || db host: ${connectionInstance.connection.host}`);
        // app.listen(process.env.PORT,()=>{
        //     console.log(`Server is running on port ${process.env.PORT}`);
        // })
    }
    catch(error){
        console.log("mongo db connection error ", error);
        process.exit(1);
    }
}
export default connectDB;