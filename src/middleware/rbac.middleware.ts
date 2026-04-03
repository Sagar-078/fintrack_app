import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";


// middleware to check if user has required role
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized - No user found",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden - This action requires one of these roles: ${allowedRoles.join(
          ", "
        )}`,
      });
    }

    next();
  };
};



// middleware to check if user can only access their own records
export const canAccessRecord = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized - No user found",
    });
  }

  if (req.user.role === "admin") {
    return next();
  }

  next();
};
