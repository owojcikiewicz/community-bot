import * as dotenv from "dotenv"; dotenv.config();
import "reflect-metadata";
import * as Discord from "discord.js";
import * as util from "./utils/misc";
import {StartDatabase} from "./utils/mysql";
import {default as StartBot} from "./bot";
import {default as StartServer} from "./server";

// Initialize the Discord client.
const intents: Discord.Intents = new Discord.Intents().add("GUILDS", "GUILD_MEMBERS", "GUILD_BANS", "GUILD_INTEGRATIONS", "GUILD_INVITES", "GUILD_PRESENCES", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "DIRECT_MESSAGES");
const client: Discord.Client = new Discord.Client({partials: ["USER", "GUILD_MEMBER", "REACTION"], intents: intents});

// Initialize the Bot, API and SQL. 
StartDatabase();
StartBot(client);
StartServer(client);

process.on("unhandledRejection", err => {
    throw err;
});

util.log("INIT", "Loaded index.ts");