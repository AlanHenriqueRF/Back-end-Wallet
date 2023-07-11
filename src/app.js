import express from 'express';
import cors from 'cors';
import router from './routers/index.routes.js';

//Servidor
const server = express();
server.use(cors());
server.use(express.json());

server.use(router);

//LIGAR SERVER
const PORT = 5000;
server.listen(PORT, () => console.log(`rodando na porta número ${PORT}`))