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
        await globalThis.mongoReady;
        data.messages = messages.history;
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

    history = [];

    constructor(messages = []) {
        this.history = messages || [];
    }

    get length() {
        return this.history.length;
    }

    get tokens() {
        return this.history.reduce(this.constructor.sumTokens, 0);
    }

    get system() {
        return this.history.find(({role} = {}) => role === "system");
    }

    set system(content) {
        if (!this.system) this.history.unshift({role: "system", content: ""});
        if (typeof content === "object") return Object.assign(this.system, {content});
        return this.system.content = content;
    }

    static sumTokens = (sum = 0, {content, role} = {}) => sum += tokenizer.encode([content, role].join("")).bpe.length;

    push(data = {}) {
        const {
            content = "",
            role = "user"
        } = data || {};
        const message = {
            content,
            role
        };
        return this.history.push(message);
    }

}
