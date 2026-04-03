import { Router } from "express";
import {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} from "../controllers/financial.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { authorize, Permission } from "../utils/permissions";

const router = Router();

router.use(verifyToken);


// create records- only admin can 
router.post("/", authorize(Permission.CREATE_RECORD), createRecord);


// get all records with filtering and pagination - analyst and admin
router.get("/", authorize(Permission.VIEW_RECORDS), getRecords);


// access records by id - analyst and admin can access
router.get("/:id", authorize(Permission.VIEW_RECORDS), getRecordById);


// update records - only admin can update
router.put("/:id", authorize(Permission.UPDATE_RECORD), updateRecord);


// delete records - only admin can delete
router.delete("/:id", authorize(Permission.DELETE_RECORD), deleteRecord);

export default router;
