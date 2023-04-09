import {startHandler} from "telebot-vercel";
import bot from "../src/bot.mjs";

export const config = {runtime: "edge"};

globalThis.date = new Date();

export default async (request, context) => {
    globalThis.invocations = ++globalThis.invocations || 1;
    context.waitUntil(startHandler({bot}, request));
    return new Response(`OK`);
}
