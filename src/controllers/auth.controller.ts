import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model";


const generateToken = (id: string, role: string) => {
      return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
            expiresIn: "1d",
      });
};


export const registerUser = async (req: Request, res: Response) => {
      try {
            const { name, email, password, role } = req.body;

            if (!name || !email || !password || !role) {
                  return res.status(400).json({ 
                        message: "All fields required" 
                  });
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                  return res.status(400).json({ 
                        message: "User already exists" 
                  });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await User.create({
                  name,
                  email,
                  password: hashedPassword,
                  role,
            });

            res.status(201).json({
                  message: "User registered successfully",
                  user,
            });
      } catch (error) {
            console.error("Error registering user:", error);
            res.status(500).json({ 
                  message: "Server error", error 
            });
      }
};



export const loginUser = async (req: Request, res: Response) => {
      try {
            const { email, password } = req.body;

            if (!email || !password) {
                  return res.status(400).json({ 
                        message: "All fields required" 
                  });
            }

            const user = await User.findOne({ email });
            if (!user) {
                  return res.status(404).json({ 
                        message: "User not found" 
                  });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                  return res.status(400).json({ 
                        message: "Invalid credentials" 
                  });
            }

            if (!user.isActive) {
                  return res.status(403).json({ 
                        message: "Account is inactive. Please contact administrator." 
                  });
            }

            const token = generateToken(user._id.toString(), user.role);

            res.status(200).json({
                  message: "Login successful",
                  token,
                  user:{
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                  },
            });
      } catch (error) {
            res.status(500).json({ 
                  message: "Server error", error 
            });
      }
};