import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getBalance,
  getFills,
  getOrderBook,
  getOrders,
  getStocks,
} from "../controllers/exchange.controller.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";

export const exchangeRouter = Router();

exchangeRouter.post("/order", requireAuth, createOrder);
exchangeRouter.delete("/order/:orderId", requireAuth, cancelOrder);
exchangeRouter.get("/orders", requireAuth, getOrders);
exchangeRouter.get("/orderbook/:symbol", requireAuth, getOrderBook);
exchangeRouter.get("/fills/:symbol", requireAuth, getFills);
exchangeRouter.get("/stocks", requireAuth, getStocks);
exchangeRouter.get("/balance", requireAuth, getBalance);
