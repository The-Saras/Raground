import { IChatProvider } from "../interfaces/chat.providers";

export class GroqChatProvider implements IChatProvider {
    async generateResponse(prompt: string): Promise<string> {
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.3,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Groq error: ${JSON.stringify(data)}`);
        }

        return data.choices[0].message.content;
    }
}