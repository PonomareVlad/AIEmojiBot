import "./db.mjs";

export async function init(user = {}) {
    const {id} = user || {};
    if (!id) return;
    await globalThis.mongoReady;
    const db = globalThis.db;
    return db.collection("users").findOneAndUpdate({id}, user, {upsert: true});
}
