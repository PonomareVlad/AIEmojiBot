import {startHandler} from "telebot-vercel";
import bot from "../src/bot.mjs";

export const config = {runtime: "edge"};

globalThis.date = new Date();

const {VERCEL_ENV} = process.env;

export default async (request, context) => {
    if (VERCEL_ENV === "development") return startHandler({bot}, request);
    globalThis.invocations = ++globalThis.invocations || 1;
    context.waitUntil(startHandler({bot}, request));
    return new Response(`OK`);
}
