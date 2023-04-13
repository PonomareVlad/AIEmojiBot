import API from "./api.mjs";
import User from "./user.mjs";
import TeleBot from "telebot";
import {marked} from "marked";
import {md} from "telegram-md";
import decode from "html-entities-decoder";
import config from "../config.json" assert {type: "json"};
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
        // this.plug(shortReply);
        this.mod("message", parseCommands);
        this.on("text", this.text.bind(this));
        // this.on("callbackQuery", this.callback.bind(this));
    }

    async text(message = {}) {
        const {
            message_id,
            isCommand,
            text = "",
            chat = {},
            reply = {},
        } = message || {};
        reply.action("typing");
        const user = await User.fetch(chat);
        if (isCommand) return this.command(message);
        const errorHandler = e => console.error(e) || reply.text(md.build(e.message || e));
        const interval = setInterval(() => reply.action("typing"), 5 * 1000);
        try {
            if (!user.messages.system) user.messages.system = context;
            user.messages.push({content: text, ids: [message_id]});
            const {
                length,
                tokens,
                history
            } = user.messages;
            const max_tokens = maxTokens - tokens;
            console.debug("Messages:", {length, tokens});
            if (max_tokens < 1500) return reply.text(strings.limit);
            const result = await api.chat({max_tokens, messages: history});
            const structure = marked.lexer(result, {});
            const messages = structure.reduce((messages = [[]], {type, text, raw, lang, tokens} = {}) => {
                switch (type) {
                    case "paragraph":
                        messages.at(-1).push(...tokens.map(({type, text, raw}) => {
                            switch (type) {
                                case "codespan":
                                    return md.inlineCode(decode(text || raw))
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
            const ids = [];
            clearInterval(interval);
            await messages.reduce((promise, message) => {
                if (Array.isArray(message))
                    return message.length ? promise.then(async () => {
                        const text = md(message.map(() => ""), ...message);
                        const result = await reply.text(md.build(text), {parseMode: "MarkdownV2"});
                        if (!result.message_id) throw result;
                        ids.push(result.message_id);
                    }).catch(errorHandler) : promise;
                return promise.then(async () => {
                    const {text: body} = message || {};
                    const options = {method: "post", body};
                    const url = `https://${VERCEL_URL}/api/send?id=${chat.id}`;
                    const result = await fetch(url, options).then(r => r.json());
                    if (!result.message_id) throw result;
                    ids.push(result.message_id);
                }).catch(errorHandler);
            }, Promise.resolve()).catch(errorHandler);
            user.messages.push({content: result, role: "assistant", ids});
            await user.updateUser();
        } catch (e) {
            errorHandler(e);
            clearInterval(interval);
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
                const interval = setInterval(() => reply.action("typing"), 5 * 1000);
                user.messages.push({content: summarize});
                const max_tokens = maxTokens - tokens;
                const result = await api.chat({max_tokens, messages: history});
                user.messages.length = 0;
                user.messages.system = context;
                user.messages.push({content: result, role: "assistant"});
                await user.updateUser();
                clearInterval(interval);
                return reply.text(strings.summarized);
            }
            default:
                return reply.text(strings.tip);
        }
    }

}

export default new AIEmojiBot(TELEGRAM_BOT_TOKEN);
