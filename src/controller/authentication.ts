import { Request, Response } from 'express'
import { User } from '../database/authModel'
import jwt from 'jsonwebtoken'
const bcrypt = require('bcryptjs');
import { UserModel } from '../database/users/model'
//Method POST
// Register new user
export const registerNewUser = async (req: Request, res: Response) => {
  try {
    const { email, name, surname, password } = req.body
    const user = await User.findOne({ email })
    
    if (user) return res.status(400).json({ msg: 'The email alerady exists' })
    //password Encritiom
    const hashPassword = bcrypt.hashSync(password, 12)
    const newUser = new User({
      email,
      name,
      surname,
      password: hashPassword,
    })
    // //save mongoDB
    const addUser = new UserModel(newUser);
    await newUser.save()
    //Then create jsonwebtoken to authentication
    const accessToken = createAccessToken({ id: newUser._id })
    const refreshtoken = createRefreshToken({ id: newUser._id })

    res.cookie('refreshtoken', refreshtoken, {
      httpOnly: true,
      path: '/user/refresh_token',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.status(200).json({ name,surname,email,accessToken,id:newUser._id });
    //@ts-ignore
  } catch ({ message }) {
    return res.status(500).json({ message: message })
  }
}
//Method POST
// Login User
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    console.log(req.body)
    const user: any = await User.findOne({ email })

    if (!user) return res.status(400).json({ msg: 'User does not exist' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ msg: 'Incorrect password' })
    //if login success, create access token and refresh
    const accessToken = createAccessToken({ id: user._id })
    const refreshtoken = createRefreshToken({ id: user._id })

    res.cookie('refreshtoken', refreshtoken, {
      httpOnly: true,
      path: '/user/refresh_token',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.status(200).json({ accessToken, user })
    //@ts-ignore
  } catch ({ message }) {
    res.status(500).json({ accessToken: null })
  }
}
//Method GET
// Log Out user
export const logOut = async (req: Request, res: Response) => {
  try {
    const {email} = req.body;

    const user:any = await User.findOne({email});

    if (!user){
      return res.status(400).json({msg:"User does not exist"});
    }else{
    res.clearCookie('refreshtoken', { path: '/user/refresh_token' })

    return res.json({ msg: 'Logged out' })
    //@ts-ignore
    }
  } catch ({ message }) {
    return res.status(500).json({ message })
  }
}
const createAccessToken = (user: any): string => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '10m' })
}
const createRefreshToken = (user: any): string => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '7d' })
} 
//Method GET
//All Registered Users
export const getAllUsers = async(req:Request, res:Response) => {
    try{
      const user:any = await UserModel.find();
      res.status(200).json({status:"200 ok", user});
    }catch(error){
      res.status(400).json({msg:error});
    }
}