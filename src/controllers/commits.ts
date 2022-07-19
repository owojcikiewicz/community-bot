import * as config from "../utils/config";
import * as util from "../utils/misc";

function addCommit(client, req, res) {
    let data = req.body;
    let token = req.headers["x-gitlab-token"] || req.headers["x-hub-signature"];
    let commits = req.body.commits;

    if (!token || token != process.env.APP_AUTH_TOKEN && !req.headers["x-hub-signature"]) {
        res.sendStatus(401);
        return;
    };

    for (let i in commits) {
        if (req.headers["x-gitlab-token"]) {
            const embed = {
                color: config.getSetting({table: "general", key: "color"}),
                author: {
                    name: `${commits[i].author.name}`,
                    icon_url: `${data.user_avatar}`
                },
                description: `${commits[i].title}`,
                timestamp: new Date(),
                footer: {
                    text: `${data.project.namespace} - ${data.repository.name}:${data.project.default_branch}`,
                    icon_url: config.getSetting({table: "commits", key: "imageLab"})
                }
            };

            client.channels.fetch(config.getSetting({table: "commits", key: "channel"}))
                .then(channel => {
                    channel.send( {embed: embed} )
                        .then(util.log("COMMITS", `Successfully received commit`))
                        .catch(util.error);
                })
                .catch(util.error); 
        } else {
            const embed = {
                color: config.getSetting({table: "general", key: "color"}),
                author: {
                    name: `${commits[i].author.name}`,
                    icon_url: `https://github.com/${commits[i].committer.username}.png`
                },
                description: `${commits[i].message}`,
                timestamp: new Date(),
                footer: {
                    text: `${data.repository.full_name}`,
                    icon_url: config.getSetting({table: "commits", key: "imageHub"})

                }
            };

            client.channels.fetch(config.getSetting({table: "commits", key: "channel"}))
                .then(channel => {
                    channel.send( {embed: embed} )
                        .then(util.log("COMMITS", `Successfully received commit`))
                        .catch(util.error);
                })
                .catch(util.error); 
        };
    };

    res.send("Ok");
};

util.log("INIT", "Loaded controllers/commits.ts");

export {addCommit};