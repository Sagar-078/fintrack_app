import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUserProfile,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
  getUserStatistics,
} from "../controllers/user.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { authorize } from "../utils/permissions";
import { Permission } from "../utils/permissions";

const router = Router();

router.use(verifyToken);


// get current user profile - any authenticated user can access
router.get("/profile/me", (req, res) => {
  const userId = (req as any).user?.id;
  return res.status(200).json({
    message: "Current user profile",
    data: (req as any).user,
  });
});



// get all users - only admin can access
router.get("/", authorize(Permission.MANAGE_USERS), getAllUsers);


// get user statistics - only admin can access (total , active , by role)
router.get("/stats/overview", authorize(Permission.MANAGE_USERS), getUserStatistics);


// get users by id - admin can see any user others can only see themeselves
router.get("/:id", getUserById);


// upadate user profile - only admin or the user themselves can update
router.put("/:id", updateUserProfile);


// change user role - only admin can change roles
router.patch("/:id/role", authorize(Permission.MANAGE_USERS), changeUserRole);


// toggle user status - only admin can toggle active/inactive status
router.patch("/:id/status", authorize(Permission.MANAGE_USERS), toggleUserStatus);


// delete users - only admin can delete
router.delete("/:id", authorize(Permission.MANAGE_USERS), deleteUser);

export default router;
