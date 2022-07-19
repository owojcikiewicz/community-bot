import * as util from "../utils/misc";
import * as config from "../utils/config";
import * as cmd from "./commands/index";

export default {
    name: "Commands", 
    enabled: true, 
    callback: async function(client) {
        let help = [];
        let commands = [];

        for (let command in cmd) {
            let info = cmd[command];
        
            if (info.enabled == false) {
                continue;
            };
        
            commands[info.name.toLowerCase()] = {
                name: info.name,
                description: info.description,
                callback: info.scallback,
                options: info.options,
                permissions: info.permissions,
                defaultPermission: info.defaultPermission,
            };
        };
        
        for (let i in commands) {
            let info = commands[i];
        
            if (info.name != "Help") {
                help.push({
                    name: `**/${i}**`,
                    value: info.description
                });
            };
        };

        client.on("interactionCreate", async interaction => {
            if (!interaction.isCommand()) return; 

            if (interaction.commandName == "help") {
                let embed = {
                    color: config.getSetting({table: "general", key: "color"}),
                    author: {
                        name: `Help`,
                        icon_url: client.user.avatarURL()
                    },
                    description: "You can see the full list of my commands below.",
                    fields: help
                };

                await interaction.reply({embeds: [embed]});
            };

            if (commands[interaction.commandName]) {
                if (!commands[interaction.commandName].callback) {
                    await interaction.reply("This command does not currently have slash functionality.");
                    return;
                };

                commands[interaction.commandName].callback(client, interaction);
            };
        });

        client.on("messageCreate", async message => {
            if (!client.application?.owner) await client.application?.fetch();

            if (message.content.toLowerCase() == "!auth" || message.content.toLowerCase() == ".auth" || message.content.toLowerCase() == "!verify" || message.content.toLowerCase() == ".verify" || message.content.toLowerCase() == "/verify") {
                message.channel.send("The correct command is `/auth`")
                    .catch(util.error);
                return;
            };

            if (message.content.toLowerCase() == "!slash" && message.author.id === client.application?.owner.id) {
                await client.guilds.cache.get(config.getSetting({table: "stats", key: "discordID"}))?.commands.set([]);
                await client.guilds.cache.get(config.getSetting({table: "stats", key: "discordID"}))?.commands.create({name: "help", description: "Returns a list of all my commands."});
                
                for (const i in commands) {
                    let info = commands[i];
                    
                    let data = {
                        name: info.name.toLowerCase(),
                        description: info.description,
                        options: info.options,
                        defaultPermission: info.defaultPermission
                    };
                    let cmd = await client.guilds.cache.get(config.getSetting({table: "stats", key: "discordID"}))?.commands.create(data);

                    if (info.permissions) {
                        let perms = info.permissions;
                        let guild = await client.guilds.cache.get(config.getSetting({table: "stats", key: "discordID"}));
                        let command = await guild?.commands.fetch(cmd.id);

                        await command.permissions.add({command: command.id, permissions: perms});
                    };
                };
            };
        });
    }
};