import joi from "joi";
import bcrypt from "bcrypt";
import { db } from "../database/database.connection.js";
import { v4 as uuid } from 'uuid';
import { ObjectId } from "mongodb";


export async function cadastro(req, res) {
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
}


export async function login(req, res) {
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
        console.log(err)
        return res.sendStatus(500)
    }
}