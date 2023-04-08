import bot from "../src/bot.mjs"
import {convert} from "../src/svg.mjs";

export default async ({query: {id}, body}, {json}) => {
    if (!id || !body) return json({status: false});
    console.debug(body);
    await bot.sendMessage(id, body).catch(e => e);
    const sticker = await convert(body);
    console.debug(sticker);
    return json(await bot.sendDocument(id, sticker, {fileName: "sticker.tgs"}).catch(e => e));
}
