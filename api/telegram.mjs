import {startHandler} from "telebot-vercel";
import bot from "../src/bot.mjs";

export const config = {runtime: "edge"};

export default async (request, context) => {
    context.waitUntil(startHandler({bot}, request));
    return new Response(`OK`);
}
