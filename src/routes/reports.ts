import * as util from "../utils/misc";
import * as reports from "../controllers/reports";
import {Router} from "express";
import {Request, Response} from "express";

const router = Router();

export default function(client, app) {
    router.post("/reports/add", (req: Request, res: Response) => {
        reports.addReport(client, req, res);
    });

    util.log("INIT", "Loaded routes/reports.ts");

    return router;
};