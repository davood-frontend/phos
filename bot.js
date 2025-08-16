import { phos_my_personality, phos_others_personality } from "./botPersonality.js";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

// Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Store user conversation history
const userHistories = new Map();

const MAX_HISTORY = 10; // keep only last 10 messages (excluding system)

const StartBot = () => {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    bot.command("start", (ctx) => {
        ctx.reply("Hey");
    });

    // Reset chat history
    bot.command("reset", (ctx) => {
        userHistories.set(ctx.chat.id, []);
        ctx.reply("🧠 Memory reset!");
    });

    // Handle text messages
    bot.on(message("text"), async (ctx) => {
        const chatId = ctx.chat.id;
        const userMessage = ctx.message.text;

        // Check identity
        const isDavid = ctx.from?.username === "telegram-username";
        const personality = isDavid ? phos_my_personality : phos_others_personality;

        // Initialize history if not present
        if (!userHistories.has(chatId)) {
            userHistories.set(chatId, [
                { role: "system", content: personality }
            ]);
        }

        const history = userHistories.get(chatId);

        // Add user message
        history.push({ role: "user", content: userMessage });

        // Trim history to keep only last N messages (excluding system)
        if (history.length > MAX_HISTORY + 1) {
            // keep system at [0], trim older entries
            const systemMsg = history[0];
            const recent = history.slice(-MAX_HISTORY);
            userHistories.set(chatId, [systemMsg, ...recent]);
        }

        try {
            const completion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: userHistories.get(chatId),
                temperature: 0.7
            });

            const aiReply = completion.choices[0]?.message?.content || "Hmm... I have no words.";

            // Add assistant reply
            history.push({ role: "assistant", content: aiReply });

            ctx.reply(aiReply);
        } catch (error) {
            console.error("Groq API Error:", error);
            ctx.reply("I'm gonna sleep... can you text me a little bit later");
        }
    });

    // Handle non-text messages
    bot.on("message", (ctx) => {
        if (!ctx.message.text) {
            ctx.reply("Ummmm... I only understand text format");
        }
    });

    bot.launch();
    console.log("🤖 Bot launched!");
};

export { StartBot };
