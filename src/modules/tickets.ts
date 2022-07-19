import * as config from "../utils/config";
import * as util from "../utils/misc";
import * as sql from "../utils/mysql";
import * as Discord from "discord.js";

export default {
    name: "Tickets",
    enabled: false, 
    callback: function(client) {
        client.ticket = {};
        client.ticket.active = {};

        client.ticket.log = (id: number, state: string, title: string, user: Discord.User) => {
            client.channels.fetch(config.getSetting({table: "ticket", key: "channel"}))
                .then((channel: Discord.TextChannel) => {
                    let embed = {
                        color: config.getSetting({table: "general", key: "color"}),
                        title: `Ticket #${id}`,
                        thumbnail: {
                            url: user.avatarURL()
                        },
                        fields: [
                            {
                                name: "**State**",
                                value: state,
                                inline: true
                            },
                            {
                                name: "**Title**",
                                value: title,
                                inline: true
                            },
                            {
                                name: "**User**",
                                value: user.username,
                                inline: true
                            }
                        ]
                    };

                    channel.send({embeds: [embed]})
                        .catch(util.error);
                })
                .catch(util.error);
        };

        client.ticket.new = (user: Discord.User, title: string) => {
            sql.getData("tickets")
                .then(data => {
                    let ticketID = (data - 0) + 1;
                    let guild = client.guilds.cache.get(process.env.BOT_GUILD);

                    guild.channels.create(`ticket-${ticketID}`, {
                        type: "GUILD_TEXT",
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: ["VIEW_CHANNEL"],
                                type: "role"
                            },
                            {
                                id: config.getSetting({table: "ticket", key: "role"}),
                                allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
                                type: "role"
                            },
                            {
                                id: user.id, 
                                allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
                                type: "member"
                            }
                        ]
                    })
                        .then((channel: Discord.TextChannel) => {
                            let embed = {
                                color: config.getSetting({table: "general", key: "color"}),
                                author: {
                                    name: `Ticket #${ticketID}`,
                                    icon_url: client.user.avatarURL()
                                },
                                thumbnail: {
                                    url: user.avatarURL()
                                },
                                title: (!title && "Untitled" || title),
                                description: `Hello ${user}, help will arrive shortly. In the meantime, please explain your issue in as much detail as possible. You can close this ticket at any time by using the lock reaction below.`
                            };

                            sql.setData("tickets", ticketID);
                            client.ticket.log(ticketID, "Open", (!title && "Untitled" || title), user);
                            client.ticket.active[user.id] = true;

                            channel.send({embeds: [embed]})
                                .then(message => {
                                    let reactingUser; 
                                    let filter = (reaction, user) => {
                                        if (!user.bot) {
                                            reactingUser = user;
                                        };

                                        return !user.bot && reaction.emoji.name === "🔒";
                                    };
                                    let collector = message.createReactionCollector({filter, maxUsers: 1, max: 1});

                                    message.react("🔒")
                                        .catch(util.error);

                                    collector.on("end", collecter => {
                                        channel.delete();
                                        client.ticket.log(ticketID, "Locked", (!title && "Untitled" || title), reactingUser);
                                        client.ticket.active[user.id] = false;
                                        user.createDM()
                                            .then((channel: Discord.DMChannel) => {
                                                channel.send(`Your ticket #${ticketID} has been locked by ${reactingUser}. If you have any further questions/concerns, please open a new ticket.`)
                                                    .catch(util.error);
                                            })
                                            .catch(util.error);
                                    });
                                    
                                })
                                .catch(util.error);
                                
                            channel.setParent(config.getSetting({table: "ticket", key: "category"}), {lockPermissions: false});
                            
                            channel.send("@here")
                                .then(message => message.delete())
                                .catch(util.error);
                        })
                        .catch(util.error);
                })
                .catch(util.error);
        };
    }
};