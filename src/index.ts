
// const TelegramBot = require('node-telegram-bot-api');
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import format from 'format-duration';

const csvFilePath = './timetracking.csv';
const delimiter = ';';

// replace the value below with the Telegram token you receive from @BotFather
const token = '';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });


const getEntries = async () => {
    if (!fs.existsSync(csvFilePath)) {
        fs.writeFileSync(csvFilePath, "");
    }

    // const jsonArray = await converter.fromFile(csvFilePath);
    // return jsonArray;
    const val = fs.readFileSync(csvFilePath).toString();
    const entries = [];
    if (val == "") {
        return entries;
    }
    val.split("\n").forEach((row, index) => {
        if (row === "" || index == 0) {
            return;
        }
        const [work, startDate, endDate, duration] = row.split(delimiter);
        const entry = {
            work,
            startDate,
            endDate,
            duration
        };
        entries.push(entry);
    });
    return entries;
}

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});

const writeFile = (entries) => {
    let str = "work;startDate;endDate;duration;\n";
    entries.forEach(e => {
        str += Object.keys(e).map(k => e[k]).join(delimiter);
        str += '\n';
    });
    fs.unlinkSync(csvFilePath);
    fs.writeFileSync(csvFilePath, str);
};

// Matches "/echo [whatever]"
bot.onText(/\/work (.+)/, async (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const work = match[1]; // the captured "whatever"
    const startDate = new Date();
    const entries = await getEntries();
    entries.push({
        work,
        startDate: startDate.toJSON(),
        endDate: null,
        duration: null,
    });
    writeFile(entries);

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, `You started ${work} at ${startDate.toLocaleString()}. Go ahead!`);
});

// Matches "/echo [whatever]"
bot.onText(/\/state(.*)/, async (msg, _match) => {
    const chatId = msg.chat.id;
    const endDate = new Date();

    const entries = await getEntries();
    if (entries.length == 0) {
        bot.sendMessage(chatId, `You don't have any work saved yet. Please start by using /work $myTodo`);
        return;
    }
    const targetEntry = entries[entries.length - 1];
    if (!targetEntry.endDate) {
        bot.sendMessage(chatId, `Your current task is ${targetEntry.work} from ${endDate.toLocaleString()}.`);
        return;
    }
    bot.sendMessage(chatId, `You recently finished ${targetEntry.work} at ${endDate.toLocaleString()}. It took ${targetEntry.duration}.!`);
});

bot.onText(/\/print(.*)/, async (msg, _match) => {
    const chatId = msg.chat.id;

    const entries = await getEntries();
    let str = "work;startDate;endDate;duration;\n";
    entries.forEach(e => {
        str += Object.keys(e).map(k => e[k]).join(delimiter);
        str += '\n';
    });
    bot.sendMessage(chatId, str);

});

// Matches "/echo [whatever]"
bot.onText(/\/done(.*)/, async (msg, _match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const endDate = new Date();

    const entries = await getEntries();
    if (entries.length < 1) {
        bot.sendMessage(chatId, `You didn't start any work that can be ended. Uff.`);
        return;
    }
    const targetEntry = entries[entries.length - 1];
    targetEntry.endDate = endDate.toJSON();
    const startDate = new Date(targetEntry.startDate);
    const diff = format(endDate.valueOf() - startDate.valueOf(), { leading: true, });
    targetEntry.duration = diff;

    writeFile(entries);

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, `You finished ${targetEntry.work} at ${endDate.toLocaleString()}. It took ${diff}. Congrats!`);
});