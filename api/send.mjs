import {optimize} from "svgo";
import {md} from "telegram-md";
import bot from "../src/bot.mjs";
import {serializeError} from "serialize-error";
import {convert, options} from "../src/svg.mjs";

export default async ({query: {id}, body}, {json}) => {
    try {
        if (!id || !body) return json({status: false});
        await bot.sendAction(id, "upload_document");
        const {data} = optimize(body, options);
        // const message = md.build(`Optimized SVG: ${md.codeBlock(data, "svg")}`);
        // await bot.sendMessage(id, message, {parseMode: "MarkdownV2"}).catch(e => e);
        const sticker = await convert(data);
        await bot.sendAction(id, "choose_sticker");
        return json(await bot.sendDocument(id, sticker, {fileName: "sticker.tgs"}).catch(e => e));
    } catch (e) {
        return json(serializeError(e));
    }
}
