import API from "./api.mjs";
import {md} from "telegram-md";
import config from "../config.json";
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
const api = new API({context, token: OPENAI_API_KEY});

bot.plug(shortReply);
bot.mod("message", parseCommands);

bot.on("text", async ({reply, isCommand, text, message_id, chat: {id}}) => {
    try {
        if (isCommand) return reply.text(`Send any description of your image`);
        const options = {
            max_tokens,
            prompt: [before, text, after].join("")
        };
        const url = `https://${VERCEL_URL}/api/send?id=${id}`;
        setTimeout(() => bot.sendAction(id, "typing"), 5 * 1000);
        setTimeout(() => bot.sendAction(id, "typing"), 10 * 1000);
        setTimeout(() => bot.sendAction(id, "typing"), 15 * 1000);
        setTimeout(() => bot.sendAction(id, "typing"), 20 * 1000);
        const [result] = await Promise.all([
            fetch(url),
            api.chat(options),
            bot.sendAction(id, "typing"),
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
