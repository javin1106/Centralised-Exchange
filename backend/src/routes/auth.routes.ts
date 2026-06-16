import { Router } from "express";
import { signin, signup } from "../controllers/auth.controllers.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";

export const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
