import API from "./api.mjs";
import User from "./user.mjs";
import {md} from "telegram-md";
import config from "../config.json";
import TeleBot from "@ponomarevlad/telebot";
import {marked} from "@ponomarevlad/marked";
import shortReply from "telebot/plugins/shortReply.js";
import {NewMethodsMixin, parseCommands} from "telebot-utils";

const {
    context,
    tokens: maxTokens
} = config || {};

const {
    LOG_CHAT_ID,
    OPENAI_API_KEY,
    TELEGRAM_BOT_TOKEN,
    VERCEL_URL = "ai-emoji-bot.vercel.app",
} = process.env;

const api = new API({context, token: OPENAI_API_KEY});

class AIEmojiBot extends NewMethodsMixin(TeleBot) {

    constructor(...args) {
        super(...args);
        this.plug(shortReply);
        this.mod("message", parseCommands);
        this.on("text", this.text.bind(this));
        // this.on("callbackQuery", this.callback.bind(this));
    }

    async text(message = {}) {
        const {
            isCommand,
            text = "",
            chat = {},
            reply = {},
        } = message || {};
        const user = await User.fetch(chat);
        if (isCommand) return this.command(message);
        if (!user.messages.system) user.messages.system = context;
        user.messages.push({content: text});
        const {
            length,
            tokens,
            history
        } = user.messages;
        const max_tokens = maxTokens - tokens;
        console.debug("Messages:", {length, tokens});
        const result = await api.chat({max_tokens, messages: history});
        user.messages.push({content: result, role: "assistant"});
        await user.updateUser();
        const structure = marked.lexer(result, {});
        const messages = structure.reduce((messages = [[]], {type, text, raw, lang, tokens} = {}) => {
            switch (type) {
                case "paragraph":
                    messages.at(-1).push(...tokens.map(({type, text, raw}) => {
                        switch (type) {
                            case "codespan":
                                return md.inlineCode(text)
                            default:
                                return text || raw;
                        }
                    }), `\r\n`);
                    break;
                case "code":
                    messages.push({text, lang});
                    messages.push([]);
                    break;
                default:
                    messages.at(-1).push(text || raw);
            }
            return messages;
        }, [[]]);
        return messages.reduce((promise, message) => {
            if (Array.isArray(message))
                return message.length ? promise.then(() => {
                    const text = md(message.map(() => ""), ...message);
                    console.debug(message, text);
                    return reply.text(text, {parseMode: "MarkdownV2"});
                }) : promise;
            return promise.then(() => {
                const {text: body} = message || {};
                const options = {method: "post", body};
                const url = `https://${VERCEL_URL}/api/send?id=${chat.id}`;
                return fetch(url, options);
            });
        }, Promise.resolve());
    }

    async command({command, chat = {}, reply = {}} = {}) {
        switch (command) {
            case "function":
                return reply.text(`Invocations: ${globalThis.invocations}\r\nDate: ${globalThis.date}`);
            case "start":
                const user = await User.fetch(chat);
                if (user?.messages?.length) {
                    user.messages.length = 0;
                    await user.updateUser();
                    return reply.text(`You started a new conversation, the story was deleted`);
                }
                return reply.text(`Send any description of your image`);
            default:
                return reply.text(`Send any description of your image`);
        }
    }

}

export default new AIEmojiBot(TELEGRAM_BOT_TOKEN);
