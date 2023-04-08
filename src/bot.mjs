import API from "./api.mjs";
import {md} from "telegram-md";
import TeleBot from "@ponomarevlad/telebot";
import shortReply from "telebot/plugins/shortReply.js";

const start = `Write the code for the SVG image. Image: "`;
const end = "`. Just write code and not draw image.`;

const {
    OPENAI_API_KEY,
    TELEGRAM_BOT_TOKEN,
    VERCEL_URL = "ai-emoji-bot.vercel.app",
} = process.env;

const bot = new TeleBot(TELEGRAM_BOT_TOKEN);
const api = new API({token: OPENAI_API_KEY});

bot.on("text", async ({reply, text, chat: {id}}) => {
    try {
        const options = {
            max_tokens: 4000,
            prompt: [start, text, end].join("")
        };
        await bot.sendAction(id, "typing");
        const result = await api.completions(options);
        if (result.trim().startsWith(`<svg`)) {
            const options = {method: "post", body: result};
            const url = `https://${VERCEL_URL}/api/send?id=${id}`;
            const response = await fetch(url, options);
            const json = await response.json();
            if (!response.ok) {
                const message = md.build(md.codeBlock(JSON.stringify(json, null, 2), "json"));
                return reply.text(message, {parseMode: "MarkdownV2"});
            }
        } else return reply.text(md.build(result), {parseMode: "MarkdownV2"});
    } catch (e) {
        console.error(e);
        return reply.text(md.build(e.message));
    }
});

bot.plug(shortReply);

export default bot;
