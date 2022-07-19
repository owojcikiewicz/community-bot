import * as config from "../utils/config";
import * as util from "../utils/misc";
import axios from "axios";
import parser from "fast-xml-parser";

function getGroup(client, req, res) {
    let sid = req.params.id;
    let token = req.headers.authorization; 

    if (!token || token != process.env.APP_AUTH_TOKEN) {
        res.sendStatus(401);
        return;
    };

    if (!sid) {
        res.sendStatus(400);
        return;
    }; 

    axios.get("https://www.steamcommunity.com/profiles/" + sid + "?xml=1")
        .then(data => {
            let parsed = parser.parse(data.data);

            if (!parsed.profile.groups) {
                res.sendStatus(400);
                return;
            };

            let groups = parsed.profile.groups.group;
            for (let i = 0; i < groups.length; i++) {
                let info = groups[i]; 
                if (info.groupID64 == config.getSetting({table: "stats", key: "groupID"})) {
                    res.status(200);
                    res.json({
                        sid: sid, 
                        member: 1
                    });
                    return;
                };
            };
            
            res.status(200);
            res.json({
                sid: sid, 
                member: 0
            });
        })
        .catch(util.error);
};

util.log("INIT", "Loaded controllers/group.ts");

export {getGroup};