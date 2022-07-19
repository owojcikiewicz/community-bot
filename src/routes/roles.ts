import * as util from "../utils/misc";
import * as roles from "../controllers/roles";
import {Request, Response, Router} from "express";

const router = Router();

export default function(client, app) {
    router.post("/roles/add", (req: Request, res: Response) => {
        roles.addRole(client, req, res);
    });

    router.delete("/roles/remove", (req: Request, res: Response) => {
        roles.deleteRole(client, req, res);
    });

    util.log("INIT", "Loaded routes/roles.ts");

    return router;
};