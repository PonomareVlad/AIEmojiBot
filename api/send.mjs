import bot from "../src/bot.mjs"
import {convert} from "../src/svg.mjs";

export default async ({query: {id}, body}, {json}) => {
    if (!id || !body) return json({status: false});
    const sticker = await convert(body);
    return json(await bot.sendDocument(id, sticker, {fileName: "sticker.tgs"}).catch(e => e));
}
