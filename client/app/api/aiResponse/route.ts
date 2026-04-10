import { NextResponse } from "next/server";
import { getAIResponse } from "@/services/ai";

export async function POST(req: Request) {


    try {
        //This message comes form frontend wich is a user input
        const { message } = await req.json();
        console.log("--- BACKEND AI REQUEST RECEIVED ---", { messageType: typeof message, messageContent: message });

        if (!message) {
            return NextResponse.json({
                success: false,
                error: "Message is required and cannot be empty"
            }, { status: 400 });
        }


        const aiResult = await getAIResponse(message) // Calling the AI service to get the response for the user message

        if (!aiResult) {
            console.warn("AI response is empty or malformed:", aiResult);
            return NextResponse.json({
                success: false,
                error: "AI response is empty or malformed"
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            response: aiResult,
        });



    } catch (error) {
        console.error("Error fetching AI response:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch AI response"
        }, { status: 500 });
    }

}

