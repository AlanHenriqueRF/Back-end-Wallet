import { Router } from "express";
import transacaoRouter from "./transacao.routes.js";
import userRouter from "./user.routes.js";

const router = Router();

router.use(transacaoRouter);
router.use(userRouter);

export default router;