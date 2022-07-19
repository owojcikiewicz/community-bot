import * as config from "../../utils/config";
import * as util from "../../utils/misc";
import * as Discord from "discord.js";

export default {
    name: "Auth",
    description: "Sends an authentication link.",
    enabled: true,
    options: [
        {
            name: "user",
            description: "Select a user to send the authentication link to.",
            type: "USER"
        }
    ],
    scallback: async (client: Discord.Client, interaction) => {
        let user = interaction.options.get("user");
        let authURL: string;
        let member: Discord.GuildMember;
        
        if (user) {
            if (user.user.bot == true) {
                await interaction.reply("You cannot use this command on bots!")
                    .catch(util.error);
                    
                return;
            };

            let token = util.encrypt(user.user.id);
            authURL = `https://api.exhibitionrp.com/auth?t=${token}`;
            member = user.member;
        }
        else {
            let token = util.encrypt(interaction.user.id);
            authURL = `https://api.exhibitionrp.com/auth?t=${token}`;
        };

        if (member) {
            if (member.roles.cache.some(role => role.id == config.getSetting({table: "auth", key: "role"}))) {
                await interaction.reply(`The selected user is already authenticated!`)
                    .catch(util.error);
                
                return; 
            };

            if (!interaction.user.hasPermission("ADMINISTRATOR")) {
                await interaction.reply("You don't have the necessary permissions!")
                    .catch(util.error);

                return;
            };

            member.createDM()
                .then(async (DMChannel: Discord.DMChannel) => {
                    let message = `In order to authenticate yourself please follow the [link](${authURL}) provided and login using Steam. The link contains direct access to your identity, sharing this link with others will allow them to potentially hijack it.`
                    DMChannel.send(message)
                        .then(async () => {
                            util.log("AUTH", `Sent Authentication link to ${member.nickname} (${member.id})`)
                            await interaction.reply(`I've sent the mentioned user an authentication link!`)
                                .catch(util.error);
                        })
                        .catch(async () => {
                            await interaction.reply("I cannot send the mentioned user his authentication link, his DMs are closed!")
                                .catch(util.error);
                        });
                })
                .catch(util.error);
        } 
        else {
            // @ts-ignore
            let guild: Discord.Guild = client.guilds.cache.get(process.env.BOT_GUILD);
            guild.members.fetch({user: interaction.user.id})
                .then(async member => {
                    if (member.roles.cache.some(role => role.id == config.getSetting({table: "auth", key: "role"}))) {
                        await interaction.reply("You're already authenticated!")
                            .catch(util.error);
        
                        return;
                    };
        
                    let message = `In order to authenticate yourself please follow the [link](${authURL}) provided and login using Steam. The link contains direct access to your identity, sharing this link with others will allow them to potentially hijack it.`
                    await interaction.reply({content: message, ephemeral: true})
                        .catch(util.error);
                })
                .catch(util.error);
        };
    }
};