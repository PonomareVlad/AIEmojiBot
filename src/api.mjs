export default class API {

    constructor(options = {}) {
        const {
            token = "",
            context = "",
            api = "https://api.openai.com/v1/",
        } = options || {};
        this.options = {
            context,
            token,
            api
        };
    }

    async completions(options = {}) {
        const {
            api,
            token,
            prompt,
            max_tokens,
            model = "text-davinci-003",
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
        console.debug(data);
        return response.ok ? data.choices[0].text : data.error.message;
    }

    async chat(options = {}) {
        const {
            api,
            token,
            prompt,
            context,
            max_tokens,
            model = "gpt-4-turbo-preview",
            messages = [
                {role: "system", content: context},
                {role: "user", content: prompt}
            ],
        } = {...this.options, ...options};
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
        const url = new URL("chat/completions", api);
        const body = JSON.stringify({model, messages, max_tokens});
        const config = {method: "post", headers, body};
        const response = await fetch(url, config);
        const data = await response.json();
        console.debug(data);
        return response.ok ? data.choices[0].message.content : data.error.message;
    }

}
