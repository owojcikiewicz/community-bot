import * as config from "../utils/config";
import * as util from "../utils/misc";
import * as sql from "../utils/mysql";
import {getRepository} from "typeorm";
import {User} from "../entities/user";

async function addRole(client, req, res) {
    let data = req.body;
    let token = req.headers.authorization; 

    if (!token || token != process.env.APP_AUTH_TOKEN) {
        res.sendStatus(401);
        return;
    };

    if (!data || !data.sid64 || !data.rank) {
        res.sendStatus(400);
        return;
    };

    let repository = getRepository(User);
    let user = await repository.findOne({where: {steamID: data.sid64}})
    if (user) {
        if (!config.getSetting({table: "roles", key: "list"})[data.rank.toLowerCase()]) {res.sendStatus(400); return};

        let guild = client.guilds.cache.get(process.env.BOT_GUILD);
        guild.members.fetch({user: user.discordID})
            .then(member => {
                if (member.roles.cache.some(role => role.id == config.getSetting({table: "roles", key: "list"})[data.rank])) {
                    res.sendStatus(409); 
                    return;
                };

                let role = guild.roles.cache.find(role => role.id == config.getSetting({table: "roles", key: "list"})[data.rank])
                member.roles.add(role)
                    .then(() => {
                        res.json({
                            "rank": data.rank
                        });
                        res.status(200);
                    })
                    .catch(err => {
                        util.error(err);
                    });
            })
            .catch(err => {
                util.error(err);
            });
    } else {
        res.sendStatus(404);
    };
};

async function deleteRole(client, req, res) {
    let data = req.body;
    let token = req.headers.authorization; 

    if (!token || token != process.env.APP_AUTH_TOKEN) {
        res.sendStatus(401);
        return;
    };

    if (!data || !data.sid64 || !data.rank) {
        res.sendStatus(400);
        return;
    };

    let repository = getRepository(User);
    let user = await repository.findOne({where: {steamID: data.sid64}})
    if (user) {
        if (!config.getSetting({table: "roles", key: "list"})[data.rank]) {res.sendStatus(400); return};

        let guild = client.guilds.cache.get(process.env.BOT_GUILD);
        guild.members.fetch({user: user.discordID})
            .then(member => {
                if (member.roles.cache.some(role => role.id == config.getSetting({table: "roles", key: "list"})[data.rank])) {
                    res.sendStatus(409); 
                    return;
                };

                let role = guild.roles.cache.find(role => role.id == config.getSetting({table: "roles", key: "list"})[data.rank])
                member.roles.remove(role)
                    .then(() => {
                        res.json({
                            "rank": data.rank
                        });
                        res.status(200);
                    })
                    .catch(err => {
                        util.error(err);
                    });
            })
            .catch(err => {
                util.error(err);
            });
    } else {
        res.sendStatus(204);
    };
};

util.log("INIT", "Loaded controllers/roles.ts");

export {addRole, deleteRole};