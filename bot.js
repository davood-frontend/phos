import { davidPersonality, othersPersonality } from "./botPersonality.js";
import { Telegraf } from "telegraf";
import axios from "axios";
import { message } from "telegraf/filters";
import dotenv from "dotenv";

dotenv.config();

// Store user conversation history
const userHistories = new Map();

const StartBot = () => {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    bot.command("start", (ctx) => {
        ctx.reply("Heyyyy! I'm your AI buddy. Just send me something and I'll reply :)");
    });

    bot.command("stop", (ctx) => {
        ctx.reply("Ok, I'll stop.");
    });

    bot.command("happy", (ctx) => {
        ctx.reply("Yepeeeeey!! Such a wonderful day it is, right?");
    });

    bot.command("sad", (ctx) => {
        ctx.reply("I told you not to press that butto... oh ok...");
    });

    // Reset chat history
    bot.command("reset", (ctx) => {
        userHistories.set(ctx.chat.id, []);
        ctx.reply("🧠 Memory reset!");
    });

    // Handle user messages
    bot.on(message("text"), async (ctx) => {
        const chatId = ctx.chat.id;
        const userMessage = ctx.message.text;
        bot.on("message", (ctx) => {
            if (!ctx.message.text) {
                ctx.reply("Ummmm... I'm a little bit stupid and I can only understand text so...");
                return
            }
        });

        ctx.reply("typing...");

        // If user has no history yet, initialize it
        let personality = ''
        const isDavid = ctx.from?.username === "Aaron_swarts"
        if (isDavid) {
            personality = davidPersonality;
        } else {
            personality = othersPersonality;
        }

        if (!userHistories.has(chatId)) {
            userHistories.set(chatId, [
                { role: "system", content: personality }
            ]);
        }

        const history = userHistories.get(chatId);
        history.push({ role: "user", content: userMessage });

        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    // model: "openai/gpt-oss-20b:free",
                    model: "deepseek/deepseek-r1:free",
                    messages: history
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                        "HTTP-Referer": "https://t.me/DavidspersonalBot",
                        "X-Title": "Telegram AI Bot",
                        "Content-Type": "application/json"
                    }
                }
            );

            const aiReply = response.data.choices[0].message.content;
            history.push({ role: "assistant", content: aiReply });

            ctx.reply(aiReply);
        } catch (error) {
            console.error("DeepSeek API Error:", error?.response?.data || error.message);
            ctx.reply("ummm... can you text me a little bit later? something seems to be wrong");
        }
    });


    bot.launch();
    console.log("🤖 Bot launched!");
};

export { StartBot };

