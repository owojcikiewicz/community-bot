import * as util from "../../utils/misc";
import * as Discord from "discord.js";

export default {
    name: "Ticket",
    description: "Creates a support ticket with the provided title.",
    enabled: true,
    options: [
        {
            name: "title",
            description: "Enter the title of this ticket.",
            type: "STRING",
            required: true
        }
    ],
    scallback: async (client, interaction) => {
        let title: Discord.CommandInteractionOption = interaction.options.get("title");

        if (client.ticket.active[interaction.user.id] == true) {
            await interaction.reply({content: "You already have an active ticket!", ephemeral: true})
                .catch(util.error);

            return;
        };

        client.ticket.new(interaction.user, title.value);
        await interaction.reply({content: "Your ticket has been created successfully!", ephemeral: true})
            .catch(util.error);
    }
};