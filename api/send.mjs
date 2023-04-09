import {optimize} from "svgo";
import TeleBot from "telebot";
import {md} from "telegram-md";
import {serializeError} from "serialize-error";
import {convert, options} from "../src/svg.mjs";

const {
    LOG_CHAT_ID,
    TELEGRAM_BOT_TOKEN,
} = process.env;

const chat_id = parseInt(LOG_CHAT_ID);
const bot = new TeleBot(TELEGRAM_BOT_TOKEN);

export default async ({query: {id}, body}, res) => {
    const {json} = res;
    try {
        if (!id || !body) return json({status: false});
        const action = bot.sendAction(id, "upload_document");
        const svg = body.replaceAll("xlink:href", "href");
        const {data} = optimize(svg, options);
        const [sticker] = await Promise.all([
            convert(data),
            bot.sendDocument(chat_id, Buffer.from(body, "utf8"), {fileName: "sticker.svg"}).catch(e => e),
            action
        ]);
        console.debug(sticker);
        const [message] = await Promise.all([
            bot.sendDocument(id, sticker, {fileName: "sticker.tgs"}),
            bot.sendAction(id, "choose_sticker")
        ]);
        const {message_id, chat: {id: from_chat_id}} = message || {};
        await bot.forwardMessage(chat_id, from_chat_id, message_id).catch(e => e);
        return json(message);
    } catch (e) {
        res.status(500);
        console.error(e);
        const message = md.build(md.codeBlock(JSON.stringify(serializeError(e), null, 2), "json"));
        await bot.sendMessage(chat_id, message, {parseMode: "MarkdownV2"});
        return json(serializeError(e));
    }
}
