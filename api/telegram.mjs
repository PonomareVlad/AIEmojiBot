import {startHandler} from "telebot-vercel";
import bot from "../src/bot.mjs";

export const config = {runtime: "edge"};

globalThis.date = new Date();

const {VERCEL_ENV} = process.env;

export default async (request, context) => {
    globalThis.invocations = ++globalThis.invocations || 1;
    const handler = startHandler({bot}, request);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start: controller => controller.enqueue(encoder.encode("O")),
        async pull(controller) {
            const result = await handler;
            controller.enqueue(encoder.encode("K"));
            return controller.close();
        },
    });
    return new Response(stream);
}
