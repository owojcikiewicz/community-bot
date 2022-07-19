import * as config from "../utils/config";
import * as util from "../utils/misc";
import SteamAPI from "steamapi";

const steam = new SteamAPI(process.env.STEAM_API);

function addBan(client, req, res) {
    let data = req.body;
    let token = req.headers.authorization; 

    if (!token || token != process.env.APP_AUTH_TOKEN) {
        res.sendStatus(401);
        return;
    };

    if (!data.name || !data.sid || !data.reason || !data.length || !data.admin || !data.adminsid || !data.server) {
        res.sendStatus(400);
        return;
    }; 

    res.sendStatus(200);
    steam.getUserSummary(data.sid)
        .then(summary => {
            const embed = {
                color: config.getSetting({table: "general", key: "color"}),
                author: {
                    name: `Ban - ${data.server}`,
                    url: `https://www.steamcommunity.com/profiles/${data.sid}/`,
                    icon_url: client.user.avatarURL()
                },
                thumbnail: {
                    url: summary.avatar.large
                },
                fields: [
                    {
                        name: `**Player**`, 
                        value: `${data.name} `,
                        inline: true
                    },
                    {
                        name: `**Admin**`, 
                        value: `${data.admin} `,
                        inline: true
                    },
                    {
                        name: `**Length**`, 
                        value: `${data.length}`,
                        inline: true
                    },
                    {
                        name: `**Reason**`, 
                        value: `${data.reason}`,
                        inline: false
                    },
                ]
            };

            client.channels.fetch(config.getSetting({table: "bans", key: "channel"}))
                .then(channel => {
                    channel.send( {embed: embed} )
                        .then(util.log("BANS", `Successfully received ban from ${data.server}`))
                        .catch(util.error);
                })
                .catch(util.error); 
        })
        .catch(util.error);
};

util.log("INIT", "Loaded controllers/bans.ts");

export {addBan};