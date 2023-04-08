import {optimize} from "svgo";
import bot from "../src/bot.mjs"
import {convert, options} from "../src/svg.mjs";

export default async ({query: {id}, body}, {json}) => {
    if (!id || !body) return json({status: false});
    await bot.sendAction(id, "upload_document");
    const {data} = optimize(body, options);
    await bot.sendMessage(id, data).catch(e => e);
    const sticker = await convert(data);
    await bot.sendAction(id, "choose_sticker");
    return json(await bot.sendDocument(id, sticker, {fileName: "sticker.tgs"}).catch(e => e));
}
