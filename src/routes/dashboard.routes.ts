import { Router } from "express";
import {
  getDashboardSummary,
  getCategoryBreakdown,
  getIncomeExpenseComparison,
} from "../controllers/dashboard.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { authorize, Permission } from "../utils/permissions";

const router = Router();

router.use(verifyToken);


// get dashboard summary - different data based on role
router.get("/summary", authorize(Permission.VIEW_DASHBOARD), getDashboardSummary);


// get category breakdown - analyst and admin can access
router.get("/categories", authorize(Permission.VIEW_RECORDS), getCategoryBreakdown);


// get income vs expense comparison - analyst and admin can access
router.get("/comparison", authorize(Permission.VIEW_RECORDS), getIncomeExpenseComparison);

export default router;
