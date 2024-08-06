import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})
        return {accessToken, refreshToken}
    }
    catch(err){
        throw new ApiError(500,"something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    console.log('Received files:', req.files); // Log received files
    console.log('Received body:', req.body); // Log received body

    const { fullName, email, username, password } = req.body;

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, 'All fields are required');
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, 'User with email or username already exists');
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is required');
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, 'Avatar file is required');
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select('-password -refreshToken');

    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong while registering the user');
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User registered Successfully')
    );
});
const loginUser = asyncHandler(async(req,res)=>{
    // req body->data
    // first take the username or email and password of the existinguser
    // then check if it exists
    // password check
    // access and refresh token
    // send the response or cookie
    const {username, email, password}=req.body;
    if(!(username || email)){
        throw new ApiError(400, 'Username or email is required');
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    
    })
    if(!user){
        throw new ApiError(400, 'User not found');
    }
    const isPasswordMatched = await user.isPasswordCorrect(password);
    if(!isPasswordMatched){
        throw new ApiError(400, 'Password is incorrect');
    }
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select
    ('-password -refreshToken');
    const options = {
        httpOnly:true,
        secure:true,
    }
    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})
const logoutUser = asyncHandler(async(req,res)=>{
    // clear the cookies
    // send the response
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
            
        },
        {new:true}
    )
    const options = {
        httpOnly:true,
        secure:true,
    }
    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out successfully"
        )
    )

})
const refreshAccessToken = asyncHandler(async(req,res)=>{
    // get the refresh token from the cookie
    // verify the refresh token
    // generate new access token
    // send the response
    
        const incomingRefreshToken = req.cookies.refreshToken
        || req.body.refreshToken
        if(incomingRefreshToken){
            throw new ApiError(401,"refresh token is required")
        }
        try{
            const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
            const user = await User.findById(decodedToken?._id)
            if(!user){
                throw new ApiError(401,"invalid refresh token")
            }
            if(incomingRefreshToken!== user?.refreshToken){
                throw new ApiError(401,"invalid refresh token")
            }
            const options = {
                httpOnly:true,
                secure:true,
            }
            const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
            return res.status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        newRefreshToken
                    },
                    "Access token refreshed successfully"
                )
            )
        }
        catch(err){
            throw new ApiError(401,err?.message||"invalid refresh token")
        } 
    
})
export { registerUser
    ,loginUser,
    logoutUser,
    refreshAccessToken
 };
