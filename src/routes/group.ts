import * as util from "../utils/misc";
import * as group from "../controllers/group";
import {Router} from "express";
import {Request, Response} from "express";

const router = Router();

export default function(client, app) {
    router.get("/group/:id", (req: Request, res: Response) => {
        group.getGroup(client, req, res);
    });

    util.log("INIT", "Loaded routes/group.ts");

    return router;
};