import * as config from "../utils/config";
import * as util from "../utils/misc";
import * as sql from "../utils/mysql";
import * as lookup from "../utils/lookup";
import * as Discord from "discord.js";
import {getRepository} from "typeorm";
import {User} from "../entities/user";

function returnUser(client, req, res) {
    let token = req.session.token;
    if (!token || token.length != 36) {
        res.send("Authentication failed, please make sure your URL is correct and that you're a member of the discord server.");
        return;
    };

    let tokenDecrypted = util.decrypt(token);
    let repository = getRepository(User);

    // Checking if user is in the discord. 
    let guild = client.guilds.cache.get(process.env.BOT_GUILD);
    guild.members.fetch({user: tokenDecrypted})
        .then(async (member: Discord.GuildMember) => {
            // Checking if the discord id was ever used, if not proceed. 
            let user = await repository.findOne({where: {discordID: tokenDecrypted}});
            if (user) {
                if (!member.roles.cache.some(role => role.id == config.getSetting({table: "auth", key: "role"})) && user.steamID == req.user.id) {
                    let guild = client.guilds.cache.get(process.env.BOT_GUILD);
                    let role = guild.roles.cache.find(role => role.id == config.getSetting({table: "auth", key: "role"}));

                    member.roles.add(role)
                        .catch(util.error);

                    member.createDM()
                        .then(DMChannel => {
                            DMChannel.send("You have been granted the Authenticated role based on a previous authentication.");
                        })
                        .catch(util.error);
                    
                    res.redirect("/");
                    return;
                };

                member.createDM()
                    .then(DMChannel => {
                        if (user.steamID == req.user.id) {
                            DMChannel.send("Authentication failed: Your discord account is already authenticated!");
                        } else {
                            DMChannel.send("Authentication failed: Your discord account is already authenticated with a different steam identity!");
                        };
                    })
                    .catch(util.error);
                
                res.redirect("/");
                return;
            };

            // Checking if the steam account was ever used, if not proceed. 
            user = await repository.findOne({where: {steamID: req.user.id}});
            if (user) {
                req.session.destroy();
                res.redirect("/");
                member.createDM()
                    .then((DMChannel) => {
                        DMChannel.send("Authentication failed: Your steam account is already authenticated with a different discord identity!");
                    })
                    .catch(util.error);

                return;
            };

            // Check if the steam account owns Garry's Mod. 
            try {
                let ownsGmod = await lookup.ownsGmod(req.user.id);
                if (!ownsGmod) {
                    req.session.destroy();
                    res.redirect("/");
                    member.createDM()
                        .then((DMChannel) => {
                            DMChannel.send("Authentication failed: Steam account doesn't own Garry's Mod.");  
                        })
                        .catch(util.error);     
    
                    return;
                };
            }
            catch(ex) {
                req.session.destroy();
                res.redirect("/");
                member.createDM()
                    .then((DMChannel) => {
                        DMChannel.send("Authentication failed: Unable to fetch Steam account information. Please make sure your profile and games are set to public.");  
                    })
                    .catch(util.error);     

                return;
            };

            // Check if user is banned in-game. 
            try {
                let count = await lookup.getBanCount(req.user.id);
                if (count >= 2) {
                    req.session.destroy();
                    res.redirect("/");
                    member.createDM()
                        .then((DMChannel) => {
                            DMChannel.send("Authentication failed: Steam account banned on at least two servers.");  
                        })
                        .catch(util.error);     
    
                    return;
                };
            } 
            catch(ex) {
                res.redirect("/");
                member.createDM()
                    .then((DMChannel) => {
                        DMChannel.send("Authentication failed: Unable to fetch in-game ban data.");  
                    })
                    .catch(util.error);     

                return;
            };

            // Insert new user to the database, DM them if successful. 
            user = new User();
            user.discordID = tokenDecrypted;
            user.steamID = req.user.id;
            user.nitro = member.premiumSince ? 1 : 0;
            await repository.save(user)
                .then(() => {
                    util.log("AUTH", `Successfully authenticated ${member.user.username} with steamid ${req.user.id}`);
                    req.session.destroy();
                    res.redirect("/");
            
                    member.createDM()
                        .then((DMChannel) => {
                            DMChannel.send(`You have been authenticated successfully using Steam Account ${req.user._json.personaname} (${req.user.id})!`)
                                .catch(util.error);
                        })
                        .catch(util.error);
            
                    let guild = client.guilds.cache.get(process.env.BOT_GUILD);
                    let role = guild.roles.cache.find(role => role.id == config.getSetting({table: "auth", key: "role"}));
                    member.roles.add(role)
                        .catch(util.error);
                })
                .catch(err => {
                    util.log("ERROR", err);
                    res.send("Authentication failed: Internal server error, please contact a developer.");    
                    req.session.destroy();                      
                    return;
                });
        })
        .catch(err => {
            res.send("Authentication failed, please make sure your URL is correct and that you're a member of the discord server.");                          
            return;
        });
};

async function deleteUser(client, req, res) {
    let method: string;
    let data = req.params.id;
    let token = req.headers.authorization; 

    if (!token || token != process.env.APP_AUTH_TOKEN) {
        res.sendStatus(401);
        return;
    };

    if (req.params.id.length == 18) {
        method = "discordID";
    } else if (req.params.id.length == 17 && lookup.isValidID(req.params.id)) {
        method = "steamID"; 
    } else {
        res.sendStatus(400);       
        return;
    };

    let repository = getRepository(User);
    let id = sql.escape(data);
    let user = await repository.findOne({where: `${method} = ${id}`});
    if (user) {
        await repository.delete(user);
        let guild = client.guilds.cache.get(process.env.BOT_GUILD);
        guild.members.fetch({user: user.discordID})
            .then(member => {
                let role = guild.roles.cache.find(role => role.id == config.getSetting({table: "auth", key: "role"}));

                member.createDM()
                    .then((channel: Discord.DMChannel) => {
                        channel.send(`You have been unauthenticated, if this was a mistake please re-authenticate using the ${config.getSetting({table: "general", key: "prefix"})}auth command.`)
                            .catch(util.error);
                    })
                    .catch(util.error);

                member.roles.remove(role)
                    .catch(util.error);

                res.sendStatus(200);
            })
            .catch(err => {
                util.error(err);
            });
    } else {
        res.sendStatus(200);
    };
};

async function getUser(client, req, res) {
    let method;
    let data = req.params.id;
    let token = req.headers.authorization; 

    if (!token || token != process.env.APP_AUTH_TOKEN) {
        res.sendStatus(401);
        return;
    };

    if (req.params.id.length == 18) {
        method = "discordID";
    } else if (req.params.id.length == 17 && lookup.isValidID(req.params.id)) {
        method = "steamID"; 
    } else {
        res.sendStatus(400);
        return;
    };

    let repository = getRepository(User);
    let id = sql.escape(data);
    let user = await repository.findOne({where: `${method} = ${id}`});
    if (user) {
        let guild = client.guilds.cache.get(process.env.BOT_GUILD);
        guild.members.fetch({user: user.discordID})
            .then(async member => {
                let currentNitro = member.premiumSince != undefined && 1 || 0;

                if (user.nitro != currentNitro) {
                    user.nitro = currentNitro; 
                    await repository.save(user)
                        .then(() => {
                            res.status(200);
                            res.json({
                                steamID: user.steamID,
                                discordID: user.discordID,
                                nitro: currentNitro
                            });
                        })
                        .catch(err => {
                            util.log("SQL", err);
                            res.sendStatus(400);
                        });
                } else {
                    res.status(200);
                    res.json({
                        steamID: user.steamID,
                        discordID: user.discordID,
                        nitro: user.nitro
                    });
                };
            })
            .catch(() => {
                res.status(200);
                res.json({
                    steamID: user.steamID,
                    discordID: user.discordID,
                    nitro: user.nitro
                });
            });
    } else {
        res.sendStatus(204);
    };
};

util.log("INIT", "Loaded controllers/auth.ts");

export {deleteUser, getUser, returnUser};