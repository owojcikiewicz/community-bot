import * as util from "../../utils/misc";

const units = {
    "m": 60,
    "h": 60*60,
    "d": 60*60*24,
    "w": 60*60*24*7
};

function parseDuration(input: string): number {
    if (input == "0") return 0;

    let val: string[] = input.split("");
    let suff: string = val.pop();
    let unit: number = units[suff.toLowerCase()];
    let num: number = Number(val.join(""));

    if (!unit) {
        return null
    };

    return num * unit;
};

export default {
    name: "Mute",
    description: "Mutes the specified user.",
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
            description: "Select a user to mute.",
            required: true
        },
        {
            name: "duration",
            type: "STRING",
            description: "Enter the duration of the mute.",
            required: true
        },
        {
            name: "reason",
            type: "STRING",
            description: "Enter the reason of the mute."
        }
    ],
    scallback: async (client, interaction) => {
        let user = interaction.options.get("user");
        let duration = interaction.options.get("duration").value;
        let reason = interaction.options.get("reason");
        
        await interaction.deferReply();

        if (!user) {
            await interaction.editReply("Something went wrong: User is invalid!")
                .catch(util.error);
            
            return;
        };

        if (!parseDuration(duration) || isNaN(parseDuration(duration))) {
            await interaction.editReply("Invalid time unit, please use: m - minutes, h - hours, d - days or w - weeks!")
                .catch(util.error);

            return;
        };

        client.mute.new(user.user, reason ? reason : "None provided", parseDuration(duration) != 0 ? Math.floor(new Date().getTime() / 1000) + parseDuration(duration) : 0)
            .then(async member => {
                await interaction.editReply(`${member} has been muted ${duration != 0 ? `for ${duration}` : "permanently"} with reason: ${reason ? reason : "None provided"}!`)
                    .catch(util.error);

                member.createDM()
                    .then(DMChannel => {
                        DMChannel.send(`You have been muted by ${interaction.user.username} ${duration != 0 ? `for ${duration}` : "permanently"} with reason: ${reason ? reason : "None provided"}!`)
                            .catch(util.error);
                    })
                    .catch(util.error);
            })
            .catch(async err => {
                await interaction.editReply(`Something went wrong: ${err}!`)
                    .catch(util.error);
            });
    }
};