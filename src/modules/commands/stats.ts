import * as config from "../../utils/config";
import * as util from "../../utils/misc";

let names = {
    "discord": "Discord",
    "steam": "Steam Group",
    "drp": "DarkRP",
    "mbrp": "Mexican Border RP",
    "rust": "Rust",
    "melonbomber": "Melon Bomber",
    "prisonrp": "PrisonRP"
};

function parseName(server: string): string {
    let name: string = names[server.toLowerCase()] || "Unknown";

    return name;
};

export default {
    name: "Stats",
    description: "Returns a full list of community statistics.",
    enabled: true,
    scallback: async (client, interaction) => {
        await interaction.deferReply();

        let servers = [];
        for (const server in client.stats) {
            let info = client.stats[server];

            if (server == "discord" || server == "steam") {
                if (!server) continue; 

                servers.push({
                    name: `**${parseName(server)}**`,
                    value: info,
                    inline: true
                });
            } else {
                servers.unshift({
                    name: `**${parseName(server)}**`,
                    value: info,
                    inline: true
                });
            };
        };

        let embed = {
            color: config.getSetting({table: "general", key: "color"}),
            author: {
                name: `Server Stats`,
                icon_url: client.user.avatarURL()
            },
            description: "You can see the statistics of our services below.",
            fields: servers
        };

        await interaction.editReply({embeds: [embed]})
            .catch(util.error);
    }
};