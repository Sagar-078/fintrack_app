import express, { Application, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import financialRoutes from "./routes/financial.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import userRoutes from "./routes/user.routes";

const app: Application = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/records", financialRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.send("Finance Backend API running");
});

export default app;