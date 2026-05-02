import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import collectionsRouter from "./collections";
import bookmarksRouter from "./bookmarks";
import tagsRouter from "./tags";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(collectionsRouter);
router.use(bookmarksRouter);
router.use(tagsRouter);
router.use(statsRouter);

export default router;
