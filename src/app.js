import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from "dotenv";
import joi from 'joi';
import bcrypt from "bcrypt";
import {v4 as uuid} from 'uuid';
dotenv.config();

//Servidor
const server = express();
server.use(cors());
server.use(express.json());

//Banco de dados
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
    .then(() => db = mongoClient.db("Wallet-API"))
    .catch((err) => console.log(err))


//CADASTRO
server.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;

    const cadastroSchema = joi.object({
        nome: joi.string().required(),
        email: joi.string().email().required(),
        senha: joi.string().min(3).required()
    })

    const validation = cadastroSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    try {
        const usuario = await db.collection("cadastro").findOne({ email })
        if (usuario) return res.status(409).send("E-mail já cadastrado")

        const hash = bcrypt.hashSync(senha, 10);

        await db.collection("cadastro").insertOne({ nome, email, senha: hash });
        res.sendStatus(201);
    } catch (err) {
        return res.status(500).send(err.message);
    }
});

// LOGIN
server.post('/login',async(req,res)=>{
    const {email,senha}= req.body;

    const loginSchedule = joi.object({
        email: joi.string().email().required(),
        senha: joi.string().required()
    })

    const validation = loginSchedule.validate({email,senha},{abortEarly:false});

    if (validation.error){
        const errors = validation.error.details.map((details)=>details.message);
        return res.status(422).send(errors)
    }

    try{
        const nao_cadastrado = await db.collection('cadastro').findOne({email});
        if (!nao_cadastrado) return res.status(404).send('Email não cadastrado')

        console.log(bcrypt.compareSync(senha,nao_cadastrado.senha))
        if (!bcrypt.compareSync(senha,nao_cadastrado.senha)) return res.status(401).send('Senha incorreta!')

        const token = uuid()
        await db.collection('login').insertOne({_id:nao_cadastrado._id,token})
        res.status(200).send(token);
    }catch(err){
        return res.sendStatus(500)
    }




})

server.get('/cadastro', async (req, res) => {
    try {
        const teste = await db.collection('cadastro').find().toArray();
        res.send(teste)
    } catch (err) { res.sendStatus(500) }
})
//LIGAR SERVER
const PORT = 5000;
server.listen(PORT, () => console.log(`rodando na porta número ${PORT}`))