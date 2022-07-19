import * as config from "../utils/config";
import * as util from "../utils/misc";
import * as sql from "../utils/mysql";
import * as Discord from "discord.js";
import {getRepository} from "typeorm";
import {Mute} from "../entities/mute";

export default {
    name: "Mute", 
    enabled: true, 
    callback: function(client) { 
        client.mute = [];

        async function checkMutes(): Promise<void> {
            let time: number = Math.floor(new Date().getTime() / 1000);
            let repository = getRepository(Mute);
            let mute = await repository.find({where: `timestamp <= ${sql.escape(time)} AND timestamp != 0`});

            if (mute) {
                for (let i = 0; i < mute.length; i++) {
                    let info = mute[i];
                    let user = info.discordID; 

                    if (user && info.timestamp <= time) {
                        client.mute.unmute(user);
                    };
                };
            };
        };

        client.mute.new = async (user: Discord.User, reason?: string, duration?: number): Promise<Discord.GuildMember> => {
            return new Promise((resolve, reject) => {
                let guild = client.guilds.cache.get(process.env.BOT_GUILD);
                guild.members.fetch({user: user})
                    .then(async (member: Discord.GuildMember) => {
                        let repository = getRepository(Mute);
                        let mute = new Mute();
                        mute.discordID = member.id;
                        mute.reason = reason ? reason : "None provided";
                        mute.timestamp = duration ? duration : 0;
                        
                        await repository.save(mute);
                        
                        let role = guild.roles.cache.find(role => role.id == config.getSetting({table: "mute", key: "role"}));
                        member.roles.add(role)
                            .then(() => {
                                resolve(member)
                            })
                            .catch(err => {
                                reject(err);
                            });
                    })
                    .catch(err => {
                        reject(err);
                    });
            });
        };

        client.mute.unmute = async (user: Discord.User): Promise<Discord.GuildMember> => {
            return new Promise((resolve, reject) => {
                let guild = client.guilds.cache.get(process.env.BOT_GUILD);
                guild.members.fetch({user, force: true})
                    .then(async (member: Discord.GuildMember) => {
                        let repository = await getRepository(Mute);
                        let mute = await repository.findOne({where: {discordID: member.id}});
                        if (!mute) {
                            reject("User not muted!")
                            return; 
                        };
                        await repository.delete(mute)
                            .then(() => {
                                let role = guild.roles.cache.find(role => role.id == config.getSetting({table: "mute", key: "role"}));
                                member.roles.remove(role)
                                    .then(() => {
                                        member.createDM()
                                            .then(DMChannel => {
                                                DMChannel.send(`You have been unmuted!`);
                                            })
                                            .catch(util.error);

                                        resolve(member);
                                    })
                                    .catch(err => {
                                        reject(err)
                                    });
                            })
                            .catch(err => {
                                reject(err);
                            });
                    })
                    .catch(err => {
                        reject(err);
                    });
            });
        };

        client.on("ready", () => {
            checkMutes();
            setInterval(() => checkMutes(), config.getSetting({table: "mute", key: "interval"}));
        });
    }
}