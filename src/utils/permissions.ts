import { Request, Response, NextFunction } from "express";

export enum Permission {
  VIEW_DASHBOARD = "VIEW_DASHBOARD",
  VIEW_RECORDS = "VIEW_RECORDS",
  CREATE_RECORD = "CREATE_RECORD",
  UPDATE_RECORD = "UPDATE_RECORD",
  DELETE_RECORD = "DELETE_RECORD",
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_CATEGORIES = "MANAGE_CATEGORIES"
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  viewer: [Permission.VIEW_DASHBOARD],

  analyst: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_RECORDS,
  ],

  admin: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_RECORDS,
    Permission.CREATE_RECORD,
    Permission.UPDATE_RECORD,
    Permission.DELETE_RECORD,
    Permission.MANAGE_USERS,
    Permission.MANAGE_CATEGORIES,
  ],
};

export const authorize = (permission: Permission) => {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const allowedPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    if (!allowedPermissions.includes(permission)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
