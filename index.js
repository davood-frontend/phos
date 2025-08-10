import express from "express"
import { StartBot } from "./bot.js";
const app = express();

app.listen(3000, () => {
    console.log('running')
})

StartBot()