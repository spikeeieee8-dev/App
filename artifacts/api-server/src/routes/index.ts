import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import ordersRouter from "./orders.js";
import analyticsRouter from "./analytics.js";
import usersRouter from "./users.js";
import uploadRouter from "./upload.js";
import metricsRouter from "./metrics-route.js";
import cartRouter from "./cart.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/orders", ordersRouter);
router.use("/analytics", analyticsRouter);
router.use("/users", usersRouter);
router.use("/upload", uploadRouter);
router.use("/cart", cartRouter);

export { metricsRouter };
export default router;
