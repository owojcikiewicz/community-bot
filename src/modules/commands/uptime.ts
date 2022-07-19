import * as util from "../../utils/misc";

export default {
    name: "Uptime",
    description: "Returns the bot's uptime.",
    enabled: true,
    scallback: async (client, interaction) => {
        let d: number, h: number, m: number, s: number;
        
        s = Math.floor(client.uptime / 1000);
        m = Math.floor(s / 60);
        s = s % 60;
        h = Math.floor(m / 60);
        m = m % 60;
        d = Math.floor(h / 24);
        h = h % 24;

        await interaction.reply({content: `The bot has been up for ${d} days, ${h} hours, ${m} minutes and ${s} seconds!`})
            .catch(util.error);
    }
};