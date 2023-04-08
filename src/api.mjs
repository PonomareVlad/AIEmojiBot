export default class API {
    constructor(options = {}) {
        const {
            token = "",
            model = "text-davinci-003",
            api = "https://api.openai.com/v1/",
        } = options || {};
        this.options = {
            token,
            model,
            api
        };
    }

    async completions(options = {}) {
        const {
            api,
            model,
            token,
            prompt,
            max_tokens,
        } = {...this.options, ...options};
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
        const url = new URL("completions", api);
        const body = JSON.stringify({model, prompt, max_tokens});
        const config = {method: "post", headers, body};
        const response = await fetch(url, config);
        const data = await response.json();
        return response.ok ? data.choices[0].text : data.error.message;
    }
}
