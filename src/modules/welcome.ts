import * as config from "../utils/config";
import * as util from "../utils/misc";
import * as Discord from "discord.js";

export default {
    name: "Welcome Message", 
    enabled: true, 
    callback: function(client) {
        client.on("guildMemberAdd", member => {
            member.createDM()
                .then((channel: Discord.DMChannel) => {
                    channel.send(config.getSetting({table: "general", key: "greeting"}))
                        .catch(util.error);

                    let token = util.encrypt(member.id);
                    let authURL = `https://api.exhibitionrp.com/auth?t=${token}`;
                    channel.send(`In order to authenticate yourself please follow the link provided and login using Steam. The link contains direct access to your identity, sharing this link with others will allow them to potentially hijack it.\n\nLink: ${authURL}`)
                        .catch(util.error);
                })
                .catch(util.error);
        });
    }
};