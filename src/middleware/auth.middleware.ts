import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
      id: string;
      role: string;
}

export interface AuthRequest extends Request {
      user?: JwtPayload;
}

export const verifyToken = (
      req: AuthRequest,
      res: Response,
      next: NextFunction
) => {
      try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                  return res.status(401).json({
                        message: "Unauthorized - No token provided",
                  });
            }

            const token = authHeader.split(" ")[1];

            const decoded = jwt.verify(
                  token,
                  process.env.JWT_SECRET as string
            ) as JwtPayload;

            req.user = decoded;

            next();
      } catch (error) {
            return res.status(401).json({
                  message: "Unauthorized - Invalid token",
            });
      }
};