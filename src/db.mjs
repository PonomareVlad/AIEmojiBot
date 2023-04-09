import * as Realm from "realm-web";

const {
    APP_ID: id,
    REALM_API_KEY,
    DATABASE_NAME,
    DATA_SOURCE_NAME,
} = process.env;

export async function initMongo() {
    try {
        const app = new Realm.App({id});
        const credentials = Realm.Credentials.apiKey(REALM_API_KEY);
        const user = await app.logIn(credentials);
        const mongo = globalThis.mongo = user.mongoClient(DATA_SOURCE_NAME);
        globalThis.db = mongo.db(DATABASE_NAME);
        return mongo;
    } catch (e) {
        console.error(e);
    }
}

export const mongo = globalThis.mongoReady ??= initMongo();

export default mongo;
