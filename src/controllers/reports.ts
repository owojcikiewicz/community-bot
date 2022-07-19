import * as config from "../utils/config";
import * as util from "../utils/misc";
import * as sql from "../utils/mysql";
import * as Discord from "discord.js";
import Trello from "trello";
import SteamAPI from "steamapi";

const steam = new SteamAPI(process.env.STEAM_API);
const trello = new Trello(process.env.TRELLO_APP, process.env.TRELLO_TOKEN);

function addReport(client, req, res) {
    let data = req.body;
    let token = req.headers.authorization; 

    if (!token || token != process.env.APP_AUTH_TOKEN) {
        res.sendStatus(401);
        return;
    };

    if (!data.name || !data.sid64 || !data.title || !data.description || !data.server) {
        res.sendStatus(400);
        return;
    };
        
    res.sendStatus(200);
    sql.getData("reports")
        .then(results => { 
            if (results == null) return;
            
            let reportID = results || 0

            sql.setData("reports", (reportID - 0) + 1)
                .then(results => {
                    if (results == null) return;

                    steam.getUserSummary(data.sid64)
                        .then(summary => {
                            const embed = {
                                color: config.getSetting({table: "general", key: "color"}),
                                author: {
                                    name: `Report #${reportID} - ${data.server}`,
                                    icon_url: client.user.avatarURL()
                                },
                                thumbnail: {
                                    url: summary.avatar.large
                                },
                                fields: [
                                    {
                                        name: `**Title**`, 
                                        value: `${data.title}`,
                                        inline: false
                                    },
                                    {
                                        name: `**Description**`, 
                                        value: `${data.description}`,
                                        inline: false
                                    },
                                    {
                                        name: `**User**`, 
                                        value: `${data.name}\n${data.sid64}`,
                                        inline: true
                                    }
                                ]
                            };
            
                            util.log("REPORTS", `Received report from ${data.server}`);
            
                            client.channels.fetch(config.getSetting({table: "reports", key: "channel"}))
                                .then((channel: Discord.TextChannel) => {
                                    if (config.getSetting({table: "reports", key: "ping"})) {
                                        channel.send("@here")
                                            .then((message: Discord.Message) => {
                                                message.delete();
                                            })
                                            .catch(util.error);
                                    };
                                    channel.send( {embeds: [embed]} )
                                        .then(message => {
                                            let userReacting; 
                                            const yesEmoji = client.emojis.cache.find(emoji => emoji.name == config.getSetting({table: "voting", key: "yes"}));
                                            const noEmoji = client.emojis.cache.find(emoji => emoji.name == config.getSetting({table: "voting", key: "no"}));
                                            const filter = (reaction, user) => {
                                                if (config.getSetting({table: "reports", key: "allowed"}).includes(user.id) && !user.bot) {
                                                    userReacting = user;
                                                };
    
                                                return config.getSetting({table: "reports", key: "allowed"}).includes(user.id) && !user.bot && (reaction.emoji.name === config.getSetting({table: "voting", key: "yes"}) || reaction.emoji.name === config.getSetting({table: "voting", key: "no"}));
                                            };
                                            
                                            message.react(yesEmoji)
                                                .catch(util.error); 
                                            
                                            message.react(noEmoji)
                                                .catch(util.error);
                
                                            let collector = message.createReactionCollector({filter, maxUsers: 1, max: 1});
                                            collector.on("collect", async (reaction) => {
                                                if (reaction.message.partial) await reaction.message.fetch();
                                                
                                                let emojiName = reaction.emoji.name; 
                                                let member = userReacting; 
                                                
                                                if (emojiName == config.getSetting({table: "voting", key: "yes"})) {
                                                    trello.addCard(`[#${reportID}] ${data.title} (${data.server})`, `**Info**\nName: ${data.name}\nID: ${data.sid64}\n\n**Description**\n${data.description}`, config.getSetting({table: "reports", key: "list"}))
                                                        .then(cards => {
                                                            util.log("REPORTS", `Successfully sent report to Trello from ${data.server}`);
                                                        })
                                                        .catch(util.error);
                                                    
                                                    channel.send(`Report #${reportID} sent by ${data.name} has been accepted by ${member}!`);
                                                } else {
                                                    channel.send(`Report #${reportID} sent by ${data.name} has been denied by ${member}!`);
                                                };
                                            });
                                            collector.on("end", () => {
                                                util.log("REPORTS", "Successfully processed a report");
                
                                                if (config.getSetting({table: "reports", key: "remove"})) {
                                                    message.delete();
                                                };
                                            });
                                        })
                                        .catch(util.error);
                                })
                                .catch(util.error); 
                        })
                        .catch(util.error);
                })
                .catch(util.error);
        })
        .catch(util.error);
};

util.log("INIT", "Loaded controllers/reports.ts");

export {addReport};