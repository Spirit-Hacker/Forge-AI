import express from "express";
import cors from "cors";
import projectRoutes from "./routes/project.routes.js";
import authRoutes from "./auth/auth.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import fileRoutes from "./files/file.routes.js";
import snapshotRoutes from "./snapshots/snapshot.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "forge-api",
  });
});

app.use("/api/projects", projectRoutes);
app.use("/api/projects", fileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", snapshotRoutes);
app.use(errorMiddleware);

export default app;
