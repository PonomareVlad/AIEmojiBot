import "./db.mjs";
import GPT3Tokenizer from "gpt3-tokenizer";

const tokenizer = new GPT3Tokenizer({type: "gpt3"});

export default class User {

    data = {};

    constructor(data = {}) {
        Object.assign(this.data, data);
        this.messages = new UserMessages(this);
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

    user = {data: {messages: []}};

    constructor(user = {}) {
        this.user = user || {};
    }

    get history() {
        return this.user.data.messages;
    }

    get length() {
        return this.history.length;
    }

    set length(value) {
        return this.history.length = value;
    }

    get tokens() {
        return this.history.reduce((sum = 0, {content, role} = {}) => {
            return sum += tokenizer.encode(["", content, role, ""].join(" ")).bpe.length;
        }, 0);
    }

    get system() {
        return this.history.find(({role} = {}) => role === "system");
    }

    set system(content) {
        if (!this.system) this.history.unshift({role: "system", content: ""});
        if (typeof content === "object") return Object.assign(this.system, {content});
        return this.system.content = content;
    }

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
