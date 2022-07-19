import * as config from "../utils/config";
import * as util from "../utils/misc";
import * as auth from "../controllers/auth";
import {Router} from "express";
import {Request, Response} from "express";
import passport from "passport";
import session from "express-session";
import SteamStrateg from "passport-steam";
import bcrypt from "bcrypt";

const SteamStrategy = SteamStrateg.Strategy;
const router = Router();

export default function(client, app) {
    app.use(session({
        secret: bcrypt.hashSync(bcrypt.genSaltSync(), bcrypt.genSaltSync(), 10),
        resave: true,
        saveUninitialized: true,
        cookie: {
            httpOnly: true,
        }
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    
    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    passport.use(new SteamStrategy({
        returnURL: `http://${config.getSetting({table: "auth", key: "realm"})}/auth/return/`,
        realm: `http://${config.getSetting({table: "auth", key: "realm"})}/`,
        apiKey: process.env.STEAM_API
      },
      function(identifier, profile, done) {
        process.nextTick(function () {
            profile.identifier = identifier;
            return done(null, profile);
        });
      }
    ));

    router.get("/auth", (req: Request, res: Response, next) => {
        req.session.token = req.query.t;
        next();
    },
        passport.authenticate("steam", { failureRedirect: "/"}), (req: Request, res: Response) => {
            res.send("Authentication failed, please make sure your URL is correct and that you're a member of the discord server.");
        }
    );

    router.get("/auth/return", 
        passport.authenticate("steam", { failureRedirect: "/"}), (req: Request, res: Response) => {
            auth.returnUser(client, req, res);
        }
    );

    router.delete("/auth/users/:id", (req: Request, res: Response) => { 
        auth.deleteUser(client, req, res);
    });

    router.get("/auth/users/:id", (req: Request, res: Response) => {
        auth.getUser(client, req, res);
    });
    
    util.log("INIT", "Loaded routes/auth.ts");

    return router;
};