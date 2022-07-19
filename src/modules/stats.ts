
import * as config from "../utils/config";
import * as util from "../utils/misc";
import {GameServer} from "../utils/types";
import group from "steam-group";
import Gamedig from "gamedig";

const servers = [];

export default {
    name: "Stats",
    enabled: true, 
    callback: function(client) {
        let steamGroup = group.fromId64(config.getSetting({table: "stats", key: "groupID"}));

        function addServer(server: GameServer): void {
            servers[server.name] = [
                server.ip,
                server.port,
                server.channel,
            ];
        };

       async function getGameData(server: string): Promise<Gamedig.QueryResult> {
            return new Promise<Gamedig.QueryResult>((resolve, reject) => {
                Gamedig.query({
                    type: servers[server].game || "garrysmod",
                    host: servers[server][0],
                    port: servers[server][1]
                })
                .then(state => {
                    resolve(state);
                })
                .catch((err) => {
                    reject(err);
                });
            });
        };
       

        function checkSteamData(): void {
            steamGroup.getMembers((error, members) => {
                if (error) {util.error(error); return};

                client.stats["steam"] = util.numberToComma(members.length);
                client.channels.fetch(config.getSetting({table: "stats", key: "channelSteam"}))
                    .then(channel => {
                        channel.edit( {name: `Steam: ${util.numberToComma(members.length)}`} )
                            .then(util.log("STATS", "Successfully retrieved stats from Steam"))
                            .catch(util.error)
                    })
                    .catch(util.error);
            });
        };

        function checkDiscordData(): void {
            let guild = client.guilds.cache.get(config.getSetting({table: "stats", key: "discordID"}));
            let memberCount = guild.memberCount;

            client.stats["discord"] = util.numberToComma(memberCount);
            client.channels.fetch(config.getSetting({table: "stats", key: "channelDiscord"}))
                .then(channel => {
                    channel.edit( {name: `Discord: ${util.numberToComma(memberCount)}`} )
                        .then(util.log("STATS", `Successfully retrieved stats from Discord`))
                        .catch(util.error);
                })
                .catch(util.error); 
        };

        function checkGameData(): void {
            for (let i in servers) {
                getGameData(i)
                    .then(result => {
                        client.stats[i] = `${result.players.length}/${result.maxplayers}`;
                        client.channels.fetch(servers[i][2])
                            .then(channel => {
                                channel.edit( {name: `${i}: ${result.players.length}/${result.maxplayers}`} )
                                    .then(util.log("STATS", `Successfully retrieved stats from ${i}`))
                                    .catch(util.error);
                            })
                            .catch(util.error); 
                    })
                    .catch(util.error);
            };
        };

        // Add all source servers.
        addServer({
            name: "DRP", 
            ip: "135.148.31.98", 
            port: 27015, 
            channel: config.getSetting({table: "stats", key: "channelDRP"}),
            game: "garrysmod"
        });

        addServer({
            name: "MBRP", 
            ip: "135.148.73.202", 
            port: 27015, 
            channel: config.getSetting({table: "stats", key: "channelMBRP"}),
            game: "garrysmod"
        });
        
        addServer({
            name: "MelonBomber", 
            ip: "208.103.169.26", 
            port: 27019, 
            channel: config.getSetting({table: "stats", key: "channelMelonBomber"}),
            game: "garrysmod"
        });

        addServer({
            name: "PrisonRP", 
            ip: "216.126.207.4", 
            port: 29120, 
            channel: config.getSetting({table: "stats", key: "channelPrisonRP"}),
            game: "garrysmod"
        });

        /*
        addServer({
            name: "Rust", 
            ip: "104.143.3.5", 
            port: 28196, 
            channel: config.getSetting({table: "stats", key: "channelRust"}),
            game: "rust"
        });
        */

        // Start gathering the stats when available. 
        client.on("ready", () => {
            client.stats = [];
            setInterval(() => checkSteamData(), config.getSetting({table: "stats", key: "steamInterval"}));
            setInterval(() => checkGameData(), config.getSetting({table: "stats", key: "gameInterval"}));

            checkGameData();
            checkSteamData();
            checkDiscordData();
        });

        // Check the discord stats on join. 
        client.on("guildMemberAdd", () => {
            checkDiscordData();
        });

        // Check the discord stats on leave. 
        client.on("guildMemberRemove", () => {
            checkDiscordData();
        });
    }
};