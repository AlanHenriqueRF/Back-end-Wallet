import { MongoClient } from 'mongodb';
import dotenv from "dotenv";

dotenv.config()
const mongoClient = new MongoClient(process.env.DATABASE_URL);

mongoClient.connect()
    .then(() => {
        console.log('MongoDb Conectado!')})
    .catch((err) => console.log(err))

export const db = mongoClient.db()