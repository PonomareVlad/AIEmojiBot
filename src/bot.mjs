import API from "./api.mjs";
import {md} from "telegram-md";
import {init} from "./user.mjs";
import config from "../config.json";
import GPT3Tokenizer from 'gpt3-tokenizer';
import TeleBot from "@ponomarevlad/telebot";
import {parseCommands} from "telebot-utils";
import shortReply from "telebot/plugins/shortReply.js";

const {
    LOG_CHAT_ID,
    OPENAI_API_KEY,
    TELEGRAM_BOT_TOKEN,
    VERCEL_URL = "ai-emoji-bot.vercel.app",
} = process.env;

const {
    after,
    before,
    context,
    tokens: max_tokens
} = config || {};

const chat_id = parseInt(LOG_CHAT_ID);
const bot = new TeleBot(TELEGRAM_BOT_TOKEN);
const tokenizer = new GPT3Tokenizer({type: "gpt3"});
const api = new API({context, token: OPENAI_API_KEY});

bot.plug(shortReply);
bot.mod("message", parseCommands);

bot.on("text", async ({reply, isCommand, command, text, message_id, chat}) => {
    try {
        if (isCommand) {
            switch (command) {
                case "function":
                    return reply.text(`Invocations: ${globalThis.invocations}\r\nDate: ${globalThis.date}`);
                default:
                    return reply.text(`Send any description of your image`);
            }
        }
        const {id} = chat || {};
        const options = {
            max_tokens,
            prompt: [before, text, after].join("")
        };
        const url = `https://${VERCEL_URL}/api/send?id=${id}`;
        setTimeout(() => bot.sendAction(id, "typing"), 5 * 1000);
        setTimeout(() => bot.sendAction(id, "typing"), 10 * 1000);
        setTimeout(() => bot.sendAction(id, "typing"), 15 * 1000);
        setTimeout(() => bot.sendAction(id, "typing"), 20 * 1000);
        const report = md.build(md.codeBlock(JSON.stringify(tokenizer.encode(options.prompt), null, 2), "json"));
        const [result] = await Promise.all([
            api.chat(options),
            init(chat).catch(e => e),
            fetch(url).catch(e => e),
            bot.sendAction(id, "typing"),
            bot.sendMessage(chat_id, report).catch(e => e),
            bot.forwardMessage(chat_id, id, message_id).catch(e => e)
        ])
        const log = bot.sendMessage(chat_id, result).catch(e => e);
        if (result?.includes?.(`<svg`)) {
            const start = result.indexOf(`<svg`);
            const end = result.indexOf(`</svg>`);
            const body = result.slice(start, end + `</svg>`.length);
            const options = {method: "post", body};
            const [response] = await Promise.all([
                fetch(url, options),
                log
            ]);
            const json = await response.json();
            if (!response.ok) {
                const message = md.build(md.codeBlock(JSON.stringify(json, null, 2), "json"));
                return reply.text(message, {parseMode: "MarkdownV2"});
            }
        } else {
            if (typeof result === "object") {
                const message = md.build(md.codeBlock(JSON.stringify(result, null, 2), "json"));
                return reply.text(message, {parseMode: "MarkdownV2"});
            }
            return reply.text(result);
        }
    } catch (e) {
        console.error(e);
        return reply.text(md.build(e.message));
    }
});

export default bot;
