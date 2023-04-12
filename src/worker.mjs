import bot from "./bot.mjs";
import {json} from "micro";

const {
    RENDER_EXTERNAL_HOSTNAME
} = process.env;

const href = `https://${RENDER_EXTERNAL_HOSTNAME}/`;

console.log(await bot?.setWebhook(href, undefined, undefined, 100));

export default async (req) => {
    const body = await json(req).catch(() => ({}));
    let response = {status: false};
    if (body?.update_id) response = await bot?.receiveUpdates([body]);
    return response;
}
