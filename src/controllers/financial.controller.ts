import { Response } from "express";
import FinancialRecord from "../models/financialRecord.model";
import { AuthRequest } from "../middleware/auth.middleware";
import mongoose from "mongoose";


// create a new financial record - only admin can create
export const createRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, type, category, date, notes } = req.body;
    const userId = req.user?.id;

    if (!amount || !type || !category) {
      return res.status(400).json({
        message: "All required fields (amount, type, category) must be provided",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        message: "Type must be either 'income' or 'expense'",
      });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        message: "Amount must be a valid number",
      });
    }

    const record = await FinancialRecord.create({
      userId,
      amount,
      type,
      category,
      date: date ? new Date(date) : new Date(),
      notes: notes || "",
    });

    res.status(201).json({
      message: "Financial record created successfully",
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// get all records with filtering - only admin can access
export const getRecords = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;

    if (role === "viewer") {
      return res.status(403).json({
        message: "Forbidden - Viewers can only access dashboard data",
      });
    }

    let filter: any = {};

    // Apply optional filters from query params
    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate as string);
      }
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const records = await FinancialRecord.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FinancialRecord.countDocuments(filter);

    res.status(200).json({
      message: "Records retrieved successfully",
      data: records,
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



// get a single record by ID - admin and analyst can access
export const getRecordById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const role = req.user?.role;

    if (role === "viewer") {
      return res.status(403).json({
        message: "Forbidden - Viewers can only access dashboard data",
      });
    }

    const record = await FinancialRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    // Admin and analyst can view by ID
    res.status(200).json({
      message: "Record retrieved successfully",
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// update record - only admin can do
export const updateRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, type, category, date, notes } = req.body;
    const role = req.user?.role;

    if (role !== "admin") {
      return res.status(403).json({
        message: "Forbidden - Only admin can update records",
      });
    }

    const record = await FinancialRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    if (type && !["income", "expense"].includes(type)) {
      return res.status(400).json({
        message: "Type must be either 'income' or 'expense'",
      });
    }

    if (amount && (typeof amount !== "number" || amount <= 0)) {
      return res.status(400).json({
        message: "Amount must be a valid number",
      });
    }

    if (amount !== undefined) record.amount = amount;
    if (type) record.type = type;
    if (req.body.category) record.category = req.body.category;
    if (date) record.date = new Date(date);
    if (notes !== undefined) record.notes = notes;

    await record.save();

    res.status(200).json({
      message: "Record updated successfully",
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// delete record - only admin can do
export const deleteRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const role = req.user?.role;

    if (role !== "admin") {
      return res.status(403).json({
        message: "Forbidden - Only admin can delete records",
      });
    }

    const record = await FinancialRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    await FinancialRecord.findByIdAndDelete(id);

    res.status(200).json({
      message: "Record deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
