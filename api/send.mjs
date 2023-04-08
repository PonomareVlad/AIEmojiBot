import TeleBot from "telebot";
import {optimize} from "svgo";
import {serializeError} from "serialize-error";
import {convert, options} from "../src/svg.mjs";

const {
    TELEGRAM_BOT_TOKEN,
} = process.env;

const bot = new TeleBot(TELEGRAM_BOT_TOKEN);

export default async ({query: {id}, body}, res) => {
    const {json} = res;
    try {
        if (!id || !body) return json({status: false});
        await bot.sendAction(id, "upload_document");
        const {data} = optimize(body, options);
        const sticker = await convert(data);
        await bot.sendAction(id, "choose_sticker");
        return json(await bot.sendDocument(id, sticker, {fileName: "sticker.tgs"}));
    } catch (e) {
        res.status(500);
        console.error(e);
        return json(serializeError(e));
    }
}
