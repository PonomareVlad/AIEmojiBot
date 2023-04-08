import API from "./api.mjs";
import TeleBot from "telebot";
import {md} from "telegram-md";
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
            max_tokens: 1000
        };
        await bot.sendAction(id, "typing");
        const result = await api.completions(options);
        if (result.trim().startsWith(`<svg`)) {
            const options = {method: "post", body: result};
            const response = await fetch(`https://${VERCEL_URL}/api/send?id=${id}`, options);
            const json = await response.json();
            console.debug(json);
            const message = md.build(`Send result: ${md.codeBlock(JSON.stringify(json), "json")}`);
            return reply.text(message, {parseMode: "MarkdownV2"});
        }
        return reply.text(md.build(result), {parseMode: "MarkdownV2"});
    } catch (e) {
        console.error(e);
        return reply.text(e.message);
    }
});

bot.plug(shortReply);

export default bot;
