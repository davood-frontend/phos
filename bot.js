import { davidPersonality, othersPersonality } from "./botPersonality.js";
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

const StartBot = () => {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    bot.command("start", (ctx) => {
        ctx.reply("Heyyyy! I'm your AI buddy. Just send me something and I'll reply :)");
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

        ctx.reply("typing...");

        // Determine personality
        const isDavid = ctx.from?.username === "Aaron_swarts";
        const personality = isDavid ? davidPersonality : othersPersonality;

        // Initialize history if not present
        if (!userHistories.has(chatId)) {
            userHistories.set(chatId, [
                { role: "system", content: personality }
            ]);
        }

        const history = userHistories.get(chatId);
        history.push({ role: "user", content: userMessage });

        try {
            const completion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
		// model: "llama-3.3-70b-versatile",
                messages: history,
                temperature: 0.7
            });

            const aiReply = completion.choices[0]?.message?.content || "Hmm... I have no words.";
            history.push({ role: "assistant", content: aiReply });

            ctx.reply(aiReply);
        } catch (error) {
            console.error("Groq API Error:", error);
            ctx.reply("ummm... can you text me a little bit later? something seems to be wrong");
        }
    });

    // Handle non-text messages
    bot.on("message", (ctx) => {
        if (!ctx.message.text) {
            ctx.reply("Ummmm... I'm a little bit stupid and I can only understand text so...");
        }
    });

    bot.launch();
    console.log("🤖 Bot launched!");
};

export { StartBot };