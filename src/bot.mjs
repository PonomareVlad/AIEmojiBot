import API from "./api.mjs";
import {md} from "telegram-md";
import TeleBot from "@ponomarevlad/telebot";
import shortReply from "telebot/plugins/shortReply.js";

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
            prompt: text,
            max_tokens: 4000
        };
        await bot.sendAction(id, "typing");
        const result = await api.completions(options);
        if (result.trim().startsWith(`<svg`)) {
            const options = {method: "post", body: result};
            const url = `https://${VERCEL_URL}/api/send?id=${id}`;
            const response = await fetch(url, options);
            return await response.json();
        }
        return reply.text(md.build(result), {parseMode: "MarkdownV2"});
    } catch (e) {
        console.error(e);
        return reply.text(md.build(e.message));
    }
});

bot.plug(shortReply);

export default bot;
