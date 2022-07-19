import * as config from "../../utils/config";
import * as util from "../../utils/misc";
import * as lookup from "../../utils/lookup";
import {getRepository } from "typeorm";
import {User} from "../../entities/user";
import * as Discord from "discord.js";
import {PlayerProfile} from "../../utils/types";
import SteamAPI from "steamapi";

const steam = new SteamAPI(process.env.STEAM_API);

const units = {
    "m": 60,
    "h": 60*60,
    "d": 60*60*24
};

function parseLength(length: number): string {
    let time = length + "Seconds";

    if (length / units.m >= 1) {
        time = Math.floor(length / units.m) + " Minutes";
    };

    if (length / units.h >= 1) {
        time = Math.floor(length / units.h) + " Hours";
    };

    if (length / units.d >= 1) {
        time = Math.floor(length / units.d) + " Days";
    };

    return time;
};

function handleProfile(client: Discord.Client, summary: any, sid: string, server: string, profile: PlayerProfile): Object {
    let rank = profile.dadmin.rank;
    let rankParsed = rank && rank.charAt(0).toUpperCase() + rank.slice(1) || "User";

    const embed = {
        color: config.getSetting({table: "general", key: "color"}),
        author: {
            name: `${"Profile"} - ${summary.nickname} (${server.toUpperCase()})`,
            url: `https://www.steamcommunity.com/profiles/${sid}/`,
            icon_url: client.user.avatarURL()
        },
        description: "You can see this player's in-game profile below.",
        thumbnail: {
            url: summary.avatar.large
        },
        fields: [
            {
                name: `**RP Name**`, 
                value: `${profile.game.rpname}`,
                inline: true
            },
            {
                name: `**Rank**`, 
                value: `${rankParsed}`,
                inline: true
            },
            {
                name: `**Money**`, 
                value: `$${util.numberToComma(profile.game.wallet + profile.bank)}`,
                inline: true
            },
            {
                name: `**Credits**`, 
                value: `${util.numberToComma(profile.credits)}`,
                inline: true
            },
            {
                name: `**Playtime**`, 
                value: `${Math.floor(profile.dadmin.time / 60 / 60) || 0} Hours`,
                inline: true
            }, 
            {
                name: `**Last Seen**`, 
                value: `${util.convertUnix(profile.dadmin.lastTime)}`,
                inline: true
            }, 
        ]
    };

    let bans = [];
    if (profile.bans && profile.bans.length > 0) {
        for (let i = 0; i < profile.bans.length; i++) {
            let ban = profile.bans[i];

            if (ban.Time + ban.Length > (Date.now() / 1000) || ban.Length == 0) {
                bans.push(profile.bans[i]);
            };
        };
    };

    if (bans.length > 0) {
        embed.fields.push({
            name: `**Ban Length**`,
            value: `${profile.bans[0].Length == 0 && "Permanent" || parseLength(profile.bans[0].Length)}`,
            inline: true
        });

        embed.fields.push({
            name: `**Ban Reason**`,
            value: `${profile.bans[0].Reason}`,
            inline: true
        });

        embed.fields.push({
            name: `**Admin**`,
            value: `${profile.bans[0].AName}`,
            inline: true
        });
    };

    return embed;
};

export default {
    name: "Profile",
    description: "Returns an in-game profile of the provided user.",
    enabled: true,
    options: [
        {
            name: "user",
            description: "Select a user to fetch his profile.",
            type: "USER"
        }
    ],
    scallback: async (client, interaction) => {
        let user = interaction.options.get("user");
        let id: string;

        if (user) {
            id = user.user.id;
        } 
        else {
            id = interaction.user.id;
        };

        await interaction.deferReply();

        let guild: Discord.Guild = client.guilds.cache.get(process.env.BOT_GUILD);
        guild.members.fetch({user: user && user.user || interaction.user})
            .then(async (member: Discord.GuildMember) => {
                if (!member.roles.cache.some(role => role.id == config.getSetting({table: "auth", key: "role"}))) {
                    await interaction.editReply({content: user && "The provided user is not authenticated!" || "You're not authenticated!", components: [], embeds: []})
                        .catch(util.error);

                    return; 
                };

                let row = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageSelectMenu()
                        .setCustomId(`Profile.${id}`)
                        .setPlaceholder("No server selected.")
                        .addOptions([
                            {
                                label: "Mexican Border RP",
                                value: "MBRP",
                            },
                            {
                                label: "DarkRP",
                                value: "DRP",
                            },
                            {
                                label: "PrisonRP",
                                value: "PrisonRP"
                            }
                        ]),
                );
            
                await interaction.editReply({content: "Please select the server!", components: [row]})
                    .catch(util.error);
                
                let message = await interaction.fetchReply();
                let collector = message.createMessageComponentCollector({maxUsers: 1});
                collector.on("collect", async (_interaction: Discord.SelectMenuInteraction) => {
                    let repository = getRepository(User);
                    let user = await repository.findOne({where: `discordID = ${id}`});

                    if (!user) {
                        await interaction.editReply({content: `The provided player has never played on ${_interaction.values[0]}!`, components: []})
                            .catch(util.error);

                        return; 
                    };

                    steam.getUserSummary(user.steamID)
                        .then(summary => {
                            lookup.getData(user.steamID, _interaction.values[0].toLowerCase())
                                .then(async (profile) => {
                                    let embed = handleProfile(client, summary, user.steamID, _interaction.values[0].toLowerCase(), profile);
                                    await interaction.editReply({content: null, components: [], embeds: [embed]})
                                        .catch(util.error);
                                })
                                .catch(async (err) => {
                                    await interaction.editReply({content: "Something went wrong...", components: []})
                                        .catch(util.error);

                                    return;
                                });
                        })
                        .catch(util.error);
                    });
            })
            .catch(util.error);
    },
};