import * as config from "./utils/config";
import * as util from "./utils/misc";
import * as modules from "./modules/index";
import * as Discord from "discord.js";
import {Module} from "./utils/types";

function load(client: Discord.Client, module: Module): void {
    if (module.enabled == false) return;

    module.callback(client);
    util.log("INIT", `Loaded modules/${module.name.toLowerCase()}.ts`);
};

export default function(client: Discord.Client) {
    load(client, modules.stats);
    load(client, modules.tickets);
    load(client, modules.voting);
    load(client, modules.welcome);
    load(client, modules.mute);
    load(client, modules.commands);

    client.on("ready", () => {
        client.user.setActivity(config.getSetting({table: "general", key: "activity"}));
        util.log("INIT", "Loaded bot.ts");
        console.log("-----------------------------------------------------");
    });

    client.login(process.env.BOT_TOKEN);
};