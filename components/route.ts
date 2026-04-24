import { NextResponse } from "next/server";
import OpenAI from "openai";
import { env, hasValue } from "@/lib/env";

export async function POST(request: Request) {
    if (!hasValue(env.openaiApiKey)) {
        return NextResponse.json({
            reply: "OpenAI is not configured. Add OPENAI_API_KEY to .env to enable the agent."
        });
    }

    const client = new OpenAI({ apiKey: env.openaiApiKey });
    const body = await request.json();
    const { messages, financialTwin } = body;

    const systemPrompt = `You are the Ethos Ledger Agent. You help users manage their financial digital twin.
Current Twin State: ${JSON.stringify(financialTwin || {})}

If the user provides information that updates their twin (e.g., getting married, changing risk profile), acknowledge it and use the update_twin tool to apply the change. Answer concisely. If Current Twin State is empty, inform the user they must create a Financial Twin first.`;

    try {
        const response = await client.chat.completions.create({
            model: env.openaiModel,
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.map((m: any) => ({
                    role: m.role === "agent" ? "assistant" : "user",
                    content: m.content
                }))
            ],
            tools: [
                {
                    type: "function",
                    function: {
                        name: "update_twin",
                        description: "Update the user's financial twin based on their input.",
                        parameters: {
                            type: "object",
                            properties: {
                                filingStatus: { type: "string" },
                                currentLifeNode: { type: "string" },
                                riskProfile: { type: "string", enum: ["Boglehead", "Balanced Growth", "Aggressive Growth"] }
                            }
                        }
                    }
                }
            ]
        });

        const message = response.choices[0].message;
        let reply = message.content || "I have updated your financial twin based on your input.";
        let updatedTwin = null;

        if (message.tool_calls && message.tool_calls.length > 0) {
            const toolCall = message.tool_calls[0];
            if (toolCall.function.name === "update_twin") {
                updatedTwin = JSON.parse(toolCall.function.arguments);
            }
        }

        return NextResponse.json({ reply, updatedTwin });
    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: "Failed to process chat request" },
            { status: 500 }
        );
    }
}