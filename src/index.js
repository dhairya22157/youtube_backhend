
import  connectDB  from "./db/index.js";
import dotenv from "dotenv";

import {app} from './app.js';
dotenv.config({
    path: './.env'
});


connectDB().then(()=>{
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT||8080,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("Error: ",error);
    
})

// (async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log(`Error: ${error}`);
//             throw error;
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`Server is running on port ${process.env.PORT}`);
//         })
//     }
//     catch(error){
//         console.log(`Error: ${error}`);
//         throw error;
//     }
// })