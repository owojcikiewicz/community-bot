import * as config from "../../utils/config";
import * as util from "../../utils/misc";
import * as Discord from "discord.js";
import {getRepository} from "typeorm";
import {User} from "../../entities/user";

export default {
    name: "MAuth",
    description: "Manually authenticates the user.",
    enabled: true,
    defaultPermission: false,
    permissions: [
        {
            id: "497935422496702465",
            type: "ROLE",
            permission: true
        }
    ],
    options: [
        {
            name: "user",
            description: "Select a user to manually authenticate.",
            type: "USER",
            required: true
        },
        {
            name: "steamid64",
            description: "Enter the user's SteamID64.",
            type: "STRING",
            required: true
        }
    ],
    scallback: async (client, interaction) => {
        let user = interaction.options.get("user");
        let sid64: Discord.CommandInteractionOption = interaction.options.get("steamid64");

        await interaction.deferReply();

        if (!user || !sid64) {
            await interaction.editReply({content: "Something went wrong..."})
                .catch(util.error);
            
            return;
        };

        let member = user.member;
        if (member) {
            if (member.roles.cache.some(role => role.id == config.getSetting({table: "auth", key: "role"}))) {
                await interaction.editReply({content: `The mentioned user is already authenticated!`})
                    .catch(util.error);
    
                return;
            };

            let repository = getRepository(User);
            let usr = new User();
            usr.discordID = member.id;
            usr.steamID = `${sid64.value}`;
            usr.nitro = member.premiumSince ? 1 : 0;

            await repository.save(usr)
                .then(async () => {
                    let guild = client.guilds.cache.get(process.env.BOT_GUILD);
                    let role = guild.roles.cache.find(role => role.id == config.getSetting({table: "auth", key: "role"}));
                    member.roles.add(role)
                        .catch(util.error);

                    await interaction.editReply({content: "The mentioned user has been manually authenticated."})
                        .catch(util.error);
                        
                    member.createDM()
                        .then((DMChannel: Discord.DMChannel) => {
                            DMChannel.send(`You have been manually authenticated.`)
                                .then(() => {
                                    util.log("AUTH", `Manually authenticated ${member.username} (${member.id})`)
                                })
                })
                .catch(util.error)
            });
        };
    },
};