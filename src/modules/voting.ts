import * as config from "../utils/config";
import * as util from "../utils/misc";

export default {
    name: "Voting", 
    enabled: true, 
    callback: function(client) {
        client.on("messageCreate", (message) => {
            if (config.getSetting({table: "voting", key: "channels"}).includes(message.channel.id)) {
                let yesEmoji = client.emojis.cache.find(emoji => emoji.name == config.getSetting({table: "voting", key: "yes"}));
                let noEmoji = client.emojis.cache.find(emoji => emoji.name == config.getSetting({table: "voting", key: "no"}));

                message.react(yesEmoji)
                    .catch(util.error); 
                
                message.react(noEmoji)
                    .catch(util.error);
            };
        });

    }
};