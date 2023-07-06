import express from 'express';
import cors from 'cors';

const server = express();
server.use(cors());
server.use(express.json())

server.get('/eissoai',(req,res)=>{
    res.send('Alan seu lindo')
})

const PORT =5000;
server.listen(PORT,()=>console.log(`rodando na porta número ${PORT}`))