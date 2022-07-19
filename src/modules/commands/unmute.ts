import * as util from "../../utils/misc";

export default {
    name: "Unmute",
    description: "Unmutes the specified user.",
    enabled: true,
    defaultPermission: false,
    permissions: [
        {
            id: "497935422496702465",
            type: "ROLE",
            permission: true
        }
    ],
    options: [
        {
            name: "user",
            type: "USER",
            description: "Select a user to unmute.",
            required: true
        }
    ],
    scallback: async (client, interaction) => {
        let user = interaction.options.get("user");

        await interaction.deferReply();

        if (!user) {
            await interaction.editReply("Something went wrong: User is invalid!")
                .catch(util.error);
            
            return;
        };

        client.mute.unmute(user.user)
            .then(async () => {
                await interaction.editReply(`${user.member} has been unmuted!`)
                    .catch(util.error);
            })
            .catch(async err => {
                await interaction.editReply(`Something went wrong: ${err}`)
                    .catch(util.error);
            });
    }
};