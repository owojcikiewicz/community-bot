import * as util from "../utils/misc";
import * as commits from "../controllers/commits";
import {Router} from "express";
import {Request, Response} from "express";

const router = Router();

export default function(client, app) {
    router.post("/commits/add", (req: Request, res: Response) => {
        commits.addCommit(client, req, res);
    });
    
    util.log("INIT", "Loaded routes/commits.ts");

    return router;
};  