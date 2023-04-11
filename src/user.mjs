import "./db.mjs";
import GPT3Tokenizer from "gpt3-tokenizer";

const tokenizer = new GPT3Tokenizer({type: "gpt3"});

export default class User {

    data = {};

    constructor(data = {}) {
        Object.assign(this.data, data);
        this.messages = new UserMessages(data.messages);
    }

    static sanitise({id, _id, ...data} = {}) {
        return data
    }

    static async fetch(data = {}) {
        const {id} = data;
        if (parseInt(id) < 1) {
            console.log("Chat:", JSON.stringify(data, null, 2));
            throw new Error("Allowed only private messages");
        }
        await globalThis.mongoReady;
        const users = globalThis.db.collection("users");
        return new this(await users.findOne({id}) || data).updateUser(data);
    }

    updateUser = async (data = this.data) => {
        const {id} = this.data;
        data.date = new Date();
        const {messages} = this;
        data.messages = messages;
        await globalThis.mongoReady;
        const users = globalThis.db.collection("users");
        await users.updateOne({id}, {$set: this.constructor.sanitise(data)}, {upsert: true});
        this.data = await users.findOne({id});
        return this;
    }

    toJSON() {
        return this.data;
    }

    toBSON() {
        return this.toJSON();
    }

    toString() {
        return JSON.stringify(this, null, 2);
    }

}

class UserMessages {

    messages = [];

    constructor(messages = []) {
        this.messages = messages || [];
    }

    get length() {
        return this.messages.length;
    }

    get tokens() {
        return this.messages.reduce(this.constructor.sumTokens, 0);
    }

    get system() {
        return this.messages.find(({role} = {}) => role === "system");
    }

    set system(content) {
        if (!this.system) this.messages.unshift({role: "system", content: ""});
        if (typeof content === "object") return Object.assign(this.system, {content});
        return this.system.content = content;
    }

    static sumTokens = (sum = 0, {content} = {}) => sum += tokenizer.encode(content).bpe.length;

    push(data = {}) {
        const {
            content = "",
            role = "user"
        } = data || {};
        const message = {
            content,
            role
        };
        return this.messages.push(message);
    }

    toJSON() {
        return this.messages;
    }

    toBSON() {
        return this.toJSON();
    }

    toArray() {
        return this.toJSON();
    }

    toString() {
        return JSON.stringify(this, null, 2);
    }

}
