import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL,
        "X-OpenRouter-Title": "Collaborative Coder",
    },
});

export const getAIResponse = async (message) => {
    const model = process.env.AI_MODE_NAME;
    // Debug: Check if API key exists
    if (!process.env.AI_API_KEY) {
        throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }

    try {
        const stream = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "user",
                    content: message,
                },
            ],
            stream: true,
        });

        let response = ''

        for await (const chunck of stream) {

            const content = chunck.choices[0].delta?.content || '';
            if (content) response += content;
        }

        return response;
        // return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching AI response:", error);
        throw error;
    }
};
