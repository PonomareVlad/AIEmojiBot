import plugin from "./plugin.mjs";
import FormData from "form-data";

const {API_URL} = process.env;

export const options = {
    multipass: true, plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    inlineStyles: {
                        onlyMatchedOnce: false,
                    },
                },
            },
        },
        "removeRasterImages",
        "removeStyleElement",
        "removeScriptElement",
        "convertStyleToAttrs",
        {name: "test", fn: () => plugin}]
};

export const convert = (svg = "") => {
    const form = new FormData();
    const options = {
        filename: "sticker.svg",
        contentType: "image/svg+xml"
    };
    form.append("file", svg, options);
    return new Promise((resolve, reject) => form.submit(API_URL, (err, res) => {
        const chunks = [];
        res.on("data", chunks.push.bind(chunks));
        res.on("end", () => {
            const data = Buffer.concat(chunks);
            if (res.statusCode === 200) return resolve(data);
            let error;
            try {
                error = JSON.parse(data).error;
            } catch {
                error = {message: res.statusMessage};
            } finally {
                reject(error);
            }
        });
    }));
}
