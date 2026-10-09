import { IChatProvider } from "../interfaces/chat.providers";
import "dotenv/config";

const DEFAULT_MODELS = [
    process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
];

export class GroqChatProvider implements IChatProvider {
    async generateResponse(prompt: string): Promise<string> {
        let lastError: any = null;

        for (const model of DEFAULT_MODELS) {
            try {
                const response = await fetch(
                    "https://api.groq.com/openai/v1/chat/completions",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${process.env.GROQ_KEY}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            model,
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
                    lastError = new Error(
                        `Groq error (${model}): ${data?.error?.message || JSON.stringify(data)}`
                    );
                    console.warn(`Groq model ${model} failed, trying next fallback model...`);
                    continue;
                }

                if (data.choices?.[0]?.message?.content) {
                    return data.choices[0].message.content;
                }
            } catch (err) {
                lastError = err;
                console.warn(`Groq request for model ${model} failed:`, err);
            }
        }

        throw lastError || new Error("All Groq chat models failed to generate response.");
    }
}