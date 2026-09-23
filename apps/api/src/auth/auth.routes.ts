import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";
import { asyncHandler } from "../middleware/async.handler.js";

const router = Router();

router.post("/register", asyncHandler(registerController));
router.post("/login", asyncHandler(loginController));
router.post("/refresh", asyncHandler(refreshController));
router.post("/logout", asyncHandler(logoutController));
router.get("/me", authMiddleware, asyncHandler(meController));

export default router;
