import * as util from "../utils/misc";
import * as bans from "../controllers/bans";
import {Router} from "express";
import {Request, Response} from "express";

const router = Router();

export default function(client, app) {
    router.post("/bans/add", (req: Request, res: Response) => {
        bans.addBan(client, req, res)
    });

    util.log("INIT", "Loaded routes/bans.ts");

    return router;
};
