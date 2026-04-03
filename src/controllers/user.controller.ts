import { Response } from "express";
import User from "../models/user.model";
import { AuthRequest } from "../middleware/auth.middleware";



// get all users - only admin can access
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get all users with pagination
    const users = await User.find()
      .select("-password") 
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.status(200).json({
      message: "Users retrieved successfully",
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// get user by id - admin can see any user others can only see themselves
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const role = req.user?.role;

    if (role !== "admin" && currentUserId !== id) {
      return res.status(403).json({
        message: "Forbidden - You can only view your own profile",
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// update user profile - only admin or the user themselves can update
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    const currentUserId = req.user?.id;
    const role = req.user?.role;

    if (role !== "admin" && currentUserId !== id) {
      return res.status(403).json({
        message: "Forbidden - You can only update your own profile",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          message: "Email already in use",
        });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    res.status(200).json({
      message: "User profile updated successfully",
      data: user.toObject({ versionKey: false, transform: (doc, ret) => {
        delete ret.password;
        return ret;
      }}),
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// change user role - only admin can do
export const changeUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["viewer", "analyst", "admin"].includes(role)) {
      return res.status(400).json({
        message: 'Role must be one of: "viewer", "analyst", "admin"',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (id === req.user?.id && role !== req.user.role) {
      return res.status(400).json({
        message: "Cannot change your own role. Contact another admin.",
      });
    }

    user.role = role as "viewer" | "analyst" | "admin";
    await user.save();

    res.status(200).json({
      message: `User role successfully changed to ${role}`,
      data: user.toObject({ versionKey: false, transform: (doc, ret) => {
        delete ret.password;
        return ret;
      }}),
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// toggle user active/inactive status - only admin can do
export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
 
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be a boolean value (true/false)",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (id === req.user?.id && !isActive) {
      return res.status(400).json({
        message: "Cannot deactivate your own account. Ask another admin.",
      });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      message: `User account ${isActive ? "activated" : "deactivated"} successfully`,
      data: user.toObject({ versionKey: false, transform: (doc, ret) => {
        delete ret.password;
        return ret;
      }}),
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// delete user - only admin can do
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      return res.status(400).json({
        message: "Cannot delete your own account. Ask another admin.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// get user statistics - admin only
export const getUserStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      message: "User statistics retrieved successfully",
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        roleDistribution: roleDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
