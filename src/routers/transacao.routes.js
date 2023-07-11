import { Router } from "express";
import { gettransacao, transacao } from '../controllers/transacao.controller.js';

const transacaoRouter = Router()
//transacao
transacaoRouter.post('/transacao', transacao);
transacaoRouter.get('/transacao', gettransacao);

export default transacaoRouter;
