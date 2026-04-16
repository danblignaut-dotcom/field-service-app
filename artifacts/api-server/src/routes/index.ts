import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tenantsRouter from "./tenants";
import usersRouter from "./users";
import leadsRouter from "./leads";
import quotesRouter from "./quotes";
import jobsRouter from "./jobs";
import dashboardRouter from "./dashboard";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tenantsRouter);
router.use(usersRouter);
router.use(leadsRouter);
router.use(quotesRouter);
router.use(jobsRouter);
router.use(dashboardRouter);
router.use(paymentsRouter);

export default router;
