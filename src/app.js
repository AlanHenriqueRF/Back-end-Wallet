import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from "dotenv";
import joi from 'joi';
import bcrypt from "bcrypt";
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';

//Servidor
const server = express();
server.use(cors());
server.use(express.json());
dotenv.config()

//Banco de dados
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
    .then(() => db = mongoClient.db())
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
server.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    const loginSchedule = joi.object({
        email: joi.string().email().required(),
        senha: joi.string().required()
    })

    const validation = loginSchedule.validate({ email, senha }, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((details) => details.message);
        return res.status(422).send(errors)
    }

    try {
        const nao_cadastrado = await db.collection('cadastro').findOne({ email });
        if (!nao_cadastrado) return res.status(404).send('Email não cadastrado')

        if (!bcrypt.compareSync(senha, nao_cadastrado.senha)) return res.status(401).send('Senha incorreta!')

        if (await db.collection('login').findOne({ _id: new ObjectId(nao_cadastrado._id) })) {
            await db.collection('login').deleteOne({ _id: new ObjectId(nao_cadastrado._id) })
        }

        const token = uuid()

        await db.collection('login').insertOne({ _id: nao_cadastrado._id, token })
        res.status(200).send({ _id: nao_cadastrado._id, token, nome: nao_cadastrado.nome });
    } catch (err) {
        return res.sendStatus(500)
    }
})

//transacao
server.post('/transacao', async (req, res) => {
    const { authorization } = req.headers;

    const token = authorization?.replace('Bearer ', ' ');
    if (!token) res.sendStatus(401);

    const { tipo, valor, descricao } = req.body;

    const trasacaoSchedule = joi.object({
        valor: joi.number().positive().required(),
        tipo: joi.string().valid('entrada', 'saida').required(),
        descricao: joi.string().required()
    })

    const validation = trasacaoSchedule.validate({ tipo, valor, descricao}, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((details) => details.message);
        return res.status(422).send(errors)
    }
    try {
        await db.collection('transacao').insertOne({ tipo, valor, descricao, token, date:dayjs(Date.now()).format('DD/MM') });
        res.sendStatus(200);
    }
    catch (err) {
        res.sendStatus(500)
    }
})

server.get('/transacao', async (req, res) => {
    const { authorization } = req.headers;

    const token = authorization?.replace('Bearer ', ' ');
    if (!token) res.sendStatus(401);

    try{
        const transacoes = await db.collection('transacao').find({token:token}).toArray();
        res.send(transacoes)
    }catch(err){
        res.sendStatus(500)
    }
})



//LIGAR SERVER
const PORT = 5000;
server.listen(PORT, () => console.log(`rodando na porta número ${PORT}`))