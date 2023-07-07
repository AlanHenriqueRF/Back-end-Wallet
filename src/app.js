import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from "dotenv";
import joi from 'joi';
import bcrypt from "bcrypt";
dotenv.config();

//Servidor
const server = express();
server.use(cors());
server.use(express.json());

//Banco de dados
const mongoClient = new MongoClient(process.env.DATABASE_URI);
let db;

mongoClient.connect()
    .then(()=>db = mongoClient.db("Wallet-API"))
    .catch((err)=>console.log(err))
  

//CADASTRO
server.post('/cadastro',async (req,res)=>{
    const {nome,email,senha} = req.body;

    const cadastroSchema = joi.object({
        nome: joi.string().required(),
        email: joi.string().email().required(),
        senha: joi.string().min(3).required()
    })
    
    const validation = cadastroSchema.validate(req.body,{abortEarly:false});

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }
    
    try {
        const usuario = await db.collection("cadastro").findOne({ email })
        if (usuario) return res.status(409).send("E-mail já cadastrado")

		const hash = bcrypt.hashSync(senha, 10);
        
        console.log({nome,email,senha:hash})

        await db.collection("cadastro").insertOne({ nome, email, senha: hash });
        res.sendStatus(201);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});


//LIGAR SERVER
const PORT =5000;
server.listen(PORT,()=>console.log(`rodando na porta número ${PORT}`))