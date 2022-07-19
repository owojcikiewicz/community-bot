import {Router} from "express";
import AuthRouter from "./auth";
import BansRouter from "./bans";
import CommitsRouter from "./commits";
import GroupRouter from "./group";
import ReportsRouter from "./reports";
import RolesRouter from "./roles";

const router = Router();

export default function(client, app) {
    router.use(AuthRouter(client, app));
    router.use(BansRouter(client, app));
    router.use(CommitsRouter(client, app));
    router.use(GroupRouter(client, app));
    router.use(ReportsRouter(client, app));
    router.use(RolesRouter(client, app));

    return router;
};