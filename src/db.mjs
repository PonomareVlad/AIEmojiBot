import {MongoClient} from "mongodb";

const {
    MONGODB_URI,
    DATABASE_NAME,
} = process.env;

const options = {ignoreUndefined: true};

export const mongo = globalThis.mongo ??= await MongoClient.connect(MONGODB_URI, options);

export const db = globalThis.db ??= mongo.db(DATABASE_NAME);

export default mongo;
