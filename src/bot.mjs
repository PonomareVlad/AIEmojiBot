import API from "./api.mjs";
import User from "./user.mjs";
import {md} from "telegram-md";
import config from "../config.json";
import TeleBot from "@ponomarevlad/telebot";
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
            history: messages
        } = user.messages;
        const max_tokens = maxTokens - tokens;
        console.debug("Messages:", {length, tokens});
        const result = await api.chat({max_tokens, messages});
        user.messages.push({content: result, role: "assistant"});
        await user.updateUser();
        return reply.text(md.build(result), {parseMode: "MarkdownV2"});
    }

    async command({command, chat = {}, reply = {}} = {}) {
        switch (command) {
            case "function":
                return reply.text(`Invocations: ${globalThis.invocations}\r\nDate: ${globalThis.date}`);
            case "start":
                const user = await User.fetch(chat);
                if (user?.messages?.length) {
                    await user.updateUser({messages: []});
                    return reply.text(`You started a new conversation, the story was deleted`);
                }
                return reply.text(`Send any description of your image`);
            default:
                return reply.text(`Send any description of your image`);
        }
    }

}

export default new AIEmojiBot(TELEGRAM_BOT_TOKEN);
