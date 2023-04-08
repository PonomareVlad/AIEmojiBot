import API from "./api.mjs";
import {md} from "telegram-md";
import config from "../config.json";
import TeleBot from "@ponomarevlad/telebot";
import shortReply from "telebot/plugins/shortReply.js";

const {
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

const bot = new TeleBot(TELEGRAM_BOT_TOKEN);
const api = new API({context, token: OPENAI_API_KEY});

bot.on("text", async ({reply, text, chat: {id}}) => {
    try {
        const options = {
            max_tokens,
            prompt: [before, text, after].join("")
        };
        await bot.sendAction(id, "typing");
        const result = await api.chat(options);
        if (result.includes(`<svg`)) {
            const start = result.indexOf(`<svg`);
            const end = result.indexOf(`</svg>`);
            const body = result.slice(start, end + `</svg>`.length);
            const options = {method: "post", body};
            const url = `https://${VERCEL_URL}/api/send?id=${id}`;
            const response = await fetch(url, options);
            const json = await response.json();
            if (!response.ok) {
                const message = md.build(md.codeBlock(JSON.stringify(json, null, 2), "json"));
                return reply.text(message, {parseMode: "MarkdownV2"});
            }
        } else return reply.text(result);
    } catch (e) {
        console.error(e);
        return reply.text(md.build(e.message));
    }
});

bot.plug(shortReply);

export default bot;
