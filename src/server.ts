import * as config from "./utils/config";
import * as util from "./utils/misc";
import express from "express";
import {Request, Response} from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import Router from "./routes/index";

export default function(client) {
    const app = express();
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use(helmet());
    app.use(Router(client, app));

    app.listen(process.env.APP_PORT_HTTP, () => {
        util.log("INIT", "Loaded app.ts");
    });
    
    // Redirect to main site. 
    app.get("/", (req: Request, res: Response) => {
        res.redirect(config.getSetting({table: "auth", key: "redirect"}));
    });
};