import joi from "joi";
import { db } from "../database/database.connection.js";
import dayjs from 'dayjs';

export async function transacao(req, res) {
    const { authorization } = req.headers;

    const token = authorization?.replace('Bearer ', '');
    if (!token) res.sendStatus(401);

    const { tipo, valor, descricao} = req.body;

    const trasacaoSchedule = joi.object({
        valor: joi.number().positive().required(),
        tipo: joi.string().valid('entrada', 'saida').required(),
        descricao: joi.string().required(),
    })

    const validation = trasacaoSchedule.validate({ tipo, valor, descricao }, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((details) => details.message);
        return res.status(422).send(errors)
    }
    try {
        const id = await db.collection('login').findOne({token})
        const email = await db.collection('cadastro').findOne({_id:id._id})
        await db.collection('transacao').insertOne({ tipo, valor, descricao,email:email.email, token, date: dayjs(Date.now()).format('DD/MM') });
        res.sendStatus(200);
    }
    catch (err) {

        res.status(500).send(err)
    }
}

export async function gettransacao(req, res) {
    const { authorization } = req.headers;
    let saldo = 0;

    const token = authorization?.replace('Bearer ', '');
    if (!token) res.sendStatus(401);

    try {
        const id = await db.collection('login').findOne({token})
        const email = await db.collection('cadastro').findOne({_id:id._id})

        const transacoes = await db.collection('transacao').find({ email: email.email }).toArray();
        transacoes.forEach((item)=>{item.tipo==='entrada'? saldo+=item.valor:saldo-=item.valor;})
        res.send({transacoes,saldo})
    } catch (err) {
        res.sendStatus(500)
    }
}