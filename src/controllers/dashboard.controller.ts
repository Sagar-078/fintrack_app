import { Response } from "express";
import FinancialRecord from "../models/financialRecord.model";
import { AuthRequest } from "../middleware/auth.middleware";
import mongoose from "mongoose";


// get dashboard summary data all can access 
export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;

    let matchFilter: any = {};

    if (req.query.startDate || req.query.endDate) {
      matchFilter.date = {};
      if (req.query.startDate) {
        matchFilter.date.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        matchFilter.date.$lte = new Date(req.query.endDate as string);
      }
    }

    // Aggregation pipeline for summary stats
    const summary = await FinancialRecord.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalIncome: {
                  $sum: {
                    $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
                  },
                },
                totalExpenses: {
                  $sum: {
                    $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
                  },
                },
                transactionCount: { $sum: 1 },
              },
            },
          ],
          categoryBreakdown: [
            {
              $group: {
                _id: "$category",
                total: { $sum: "$amount" },
                count: { $sum: 1 },
                type: { $first: "$type" },
              },
            },
            {
              $sort: { total: -1 },
            },
          ],
          monthlyTrends: [
            {
              $group: {
                _id: {
                  year: { $year: "$date" },
                  month: { $month: "$date" },
                },
                income: {
                  $sum: {
                    $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
                  },
                },
                expenses: {
                  $sum: {
                    $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
                  },
                },
              },
            },
            {
              $sort: { "_id.year": -1, "_id.month": -1 },
            },
            {
              $limit: 12,
            },
          ],
          weeklyTrends: [
            {
              $group: {
                _id: {
                  year: { $isoWeekYear: "$date" },
                  week: { $isoWeek: "$date" },
                },
                income: {
                  $sum: {
                    $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
                  },
                },
                expenses: {
                  $sum: {
                    $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
                  },
                },
              },
            },
            {
              $sort: { "_id.year": -1, "_id.week": -1 },
            },
            {
              $limit: 12, // Last 12 weeks
            },
          ],
          recentTransactions: [
            {
              $sort: { date: -1 },
            },
            {
              $limit: 5,
            },
            {
              $project: {
                amount: 1,
                type: 1,
                category: 1,
                date: 1,
                notes: 1,
              },
            },
          ],
        },
      },
    ]);

    const totalStats = summary[0].totals[0] || {
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: 0,
    };

    const netBalance = totalStats.totalIncome - totalStats.totalExpenses;

    const data: any = {
      overview: {
        totalIncome: totalStats.totalIncome,
        totalExpenses: totalStats.totalExpenses,
        netBalance: netBalance,
        transactionCount: totalStats.transactionCount,
      },
      monthlyTrends: summary[0].monthlyTrends,
      weeklyTrends: summary[0].weeklyTrends,
      recentTransactions: summary[0].recentTransactions,
    };

    // Include category breakdown only for analyst and admin
    if (role !== "viewer") {
      data.categoryBreakdown = summary[0].categoryBreakdown;
    }

    const response = {
      message: "Dashboard summary retrieved successfully",
      data,
    };

    res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// get category breakdown with more details - all analysts and admins can access
export const getCategoryBreakdown = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const role = req.user?.role;
    
    // All analysts and admins see global category breakdown
    let matchFilter: any = {};

    const breakdown = await FinancialRecord.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          incomeAmount: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
            },
          },
          expenseAmount: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
            },
          },
          transactionCount: { $sum: 1 }
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    res.status(200).json({
      message: "Category breakdown retrieved successfully",
      data: breakdown,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// get income vs expense comparison - all analysts and admins can access
export const getIncomeExpenseComparison = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const role = req.user?.role;

    // All analysts and admins see global comparison data
    let matchFilter: any = {};

    const comparison = await FinancialRecord.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          type: "$_id",
          total: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json({
      message: "Income vs Expense comparison retrieved successfully",
      data: comparison,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
