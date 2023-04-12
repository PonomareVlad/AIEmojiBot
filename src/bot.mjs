import API from "./api.mjs";
import User from "./user.mjs";
import {md} from "telegram-md";
import config from "../config.json";
import decode from "html-entities-decoder";
import TeleBot from "@ponomarevlad/telebot";
import {marked} from "@ponomarevlad/marked";
import shortReply from "telebot/plugins/shortReply.js";
import {NewMethodsMixin, parseCommands} from "telebot-utils";

const {
    context,
    summarize,
    strings = {},
    tokens: maxTokens = 4000
} = config || {};

const {
    DEFAULT_URL,
    LOG_CHAT_ID,
    OPENAI_API_KEY,
    TELEGRAM_BOT_TOKEN,
    VERCEL_URL = DEFAULT_URL,
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
        try {
            reply.action("typing");
            setTimeout(() => reply.action("typing"), 5 * 1000);
            setTimeout(() => reply.action("typing"), 10 * 1000);
            setTimeout(() => reply.action("typing"), 15 * 1000);
            setTimeout(() => reply.action("typing"), 20 * 1000);
            setTimeout(() => reply.action("typing"), 25 * 1000);
            if (!user.messages.system) user.messages.system = context;
            user.messages.push({content: text});
            const {
                length,
                tokens,
                history
            } = user.messages;
            const max_tokens = maxTokens - tokens;
            console.debug("Messages:", {length, tokens});
            if (max_tokens < 1000) return reply.text(strings.limit);
            const result = await api.chat({max_tokens: 1000, messages: history});
            user.messages.push({content: result, role: "assistant"});
            const structure = marked.lexer(result, {});
            const messages = structure.reduce((messages = [[]], {type, text, raw, lang, tokens} = {}) => {
                switch (type) {
                    case "paragraph":
                        messages.at(-1).push(...tokens.map(({type, text, raw}) => {
                            switch (type) {
                                case "codespan":
                                    return md.inlineCode(text)
                                default:
                                    return decode(text || raw);
                            }
                        }), `\r\n`);
                        break;
                    case "code":
                        messages.push({text, lang});
                        messages.push([]);
                        break;
                    default:
                        messages.at(-1).push(decode(text || raw));
                }
                return messages;
            }, [[]]);
            await user.updateUser();
            await messages.reduce((promise, message) => {
                if (Array.isArray(message))
                    return message.length ? promise.then(() => {
                        const text = md(message.map(() => ""), ...message);
                        return reply.text(text, {parseMode: "MarkdownV2"});
                    }) : promise;
                return promise.then(() => {
                    const {text: body} = message || {};
                    const options = {method: "post", body};
                    const url = `https://${VERCEL_URL}/api/send?id=${chat.id}`;
                    return fetch(url, options);
                });
            }, Promise.resolve());
        } catch (e) {
            console.error(e);
            await reply.text(md.build(e.message));
        }
    }

    async command({command, chat = {}, reply = {}} = {}) {
        switch (command) {
            case "function":
                return reply.text(`Invocations: ${globalThis.invocations}\r\nDate: ${globalThis.date}`);
            case "start": {
                const user = await User.fetch(chat);
                if (user?.messages?.length) {
                    user.messages.length = 0;
                    await user.updateUser();
                    return reply.text(strings.new);
                }
                return reply.text(strings.tip);
            }
            case "summary": {
                const user = await User.fetch(chat);
                const {
                    length,
                    tokens,
                    history
                } = user.messages;
                if (!length) return reply.text(strings.empty);
                user.messages.push({content: summarize});
                const max_tokens = maxTokens - tokens;
                const result = await api.chat({max_tokens, messages: history});
                user.messages.length = 0;
                user.messages.system = context;
                user.messages.push({content: result, role: "assistant"});
                await user.updateUser();
                return reply.text(strings.summarized);
            }
            default:
                return reply.text(strings.tip);
        }
    }

}

export default new AIEmojiBot(TELEGRAM_BOT_TOKEN);
