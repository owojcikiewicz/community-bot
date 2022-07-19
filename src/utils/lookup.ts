import * as util from "./misc";
import {PlayerProfile} from "../utils/types";
import SteamID from "steamid";
import steam from "steam-web";
import mysql from "mysql";

const darkrp: mysql.Pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "exhibitionrp_" + process.env.DB_DARKRP
});

const mbrp: mysql.Pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "exhibitionrp_" + process.env.DB_MBRP
});

const prisonrp: mysql.Pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_PRISONRP
});

const dadminD: mysql.Pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "exhibitionrp_" + process.env.DB_ADMIN_DARKRP
});

const dadminM: mysql.Pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "exhibitionrp_" + process.env.DB_ADMIN_MBRP
});

const dadminP: mysql.Pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "exhibitionrp_" + process.env.DB_ADMIN_PRISONRP
});

const darkrpBank: mysql.Pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "exhibitionrp_" + process.env.DB_BANK_DARKRP
});

const darkrpCredits: mysql.Pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "exhibitionrp_" + process.env.DB_CREDITS_DRP
});

const hubCredits: mysql.Pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "exhibitionrp_hub"
}); 

const SteamAPI = new steam({apiKey: process.env.STEAM_API, format: "json"});

function isValidID(sid64: string): boolean {
    try {
        let sid = new SteamID(sid64);
        return sid.universe == 1;
    } 
    catch (ex) {
        return false
    };
};

function convertToSID32(sid64: string): string {
    let sid = new SteamID(sid64);

    return sid.getSteam2RenderedID();
};

function getBanCount(sid64: string): Promise<number> {
    return new Promise((resolve, reject) => {
        let bannedCount = 0;
        let sid32 = convertToSID32(sid64);

        dadminD.query(`SELECT * FROM da_bans WHERE SteamID = ${dadminD.escape(sid32)}`, (err, results) => {
            if (err) {
                reject("DarkRP");
            };
            
            let bans = results;
            let validBans = bans.filter(x => x.Length == 0 && x.UnbanReason == null);

            if (validBans.length > 0) {
                bannedCount = bannedCount + 1; 
            };

            dadminM.query(`SELECT * FROM da_bans WHERE SteamID = ${dadminM.escape(sid32)}`, (err, results) => {
                if (err) {
                    reject("MBRP");
                };

                let bans = results;
                let validBans = bans.filter(x => x.Length == 0 && x.UnbanReason == null);

                if (validBans.length > 0) {
                    bannedCount = bannedCount + 1; 
                };

                resolve(bannedCount);
            });
        });
    });
};

function ownsGmod(sid64: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        SteamAPI.getOwnedGames({
            steamid: sid64,
            callback: function(err, data) {
                if (err) {
                    reject();
                };
            
                let games = data.response.games;
                if (!games || games === undefined || games.length <= 0) {
                    reject();
                };

                let gmod = games.filter(x => x.appid === 4000);
    
                resolve(gmod.length != 0);
            }
        });
    });
};

async function getServerData(sid: string, server: "DRP" | "MBRP" | "PrisonRP"): Promise<any> {
    return new Promise(async (resolve, reject) => {
        switch (server) {
            case "DRP": 
                darkrp.query(`SELECT * FROM darkrp_player WHERE UID = ${darkrp.escape(sid)}`, (err, results) => {
                    if (err) {
                        reject();
                    };

                    if (!results) {
                        reject();
                    };

                    resolve(results[0]);
                });
            
                break;
            
            case "MBRP":
                mbrp.query(`SELECT * FROM darkrp_player WHERE UID = ${mbrp.escape(sid)}`, (err, results) => {
                    if (err) {
                        reject();
                    };

                    if (!results) {
                        reject();
                    };

                    resolve(results[0]);
                });

            case "PrisonRP":
                prisonrp.query(`SELECT * FROM darkrp_player WHERE UID = ${prisonrp.escape(sid)}`, (err, results) => {
                    if (err) {
                        reject();
                    };

                    if (!results) {
                        reject();
                    };

                    resolve(results[0]);
                });
                
        };
    });
};

async function getDadminData(sid: string, server: "DRP" | "MBRP" | "PrisonRP"): Promise<any> {
    return new Promise(async (resolve, reject) => {
        switch (server) {
            case "DRP": 
                dadminD.query(`SELECT * FROM da_players WHERE SteamID = ${dadminD.escape(sid)}`, (err, results) => {
                    if (err) {
                        reject();
                    };

                    if (!results) {
                        reject();
                    };

                    resolve(results[0]);
                });

                break;
            
            case "MBRP":
                dadminM.query(`SELECT * FROM da_players WHERE SteamID = ${dadminM.escape(sid)}`, (err, results) => {
                    if (err) {
                        reject();
                    };

                    if (!results) {
                        reject();
                    };

                    resolve(results[0]);
                });

                break;

            case "PrisonRP":
                dadminP.query(`SELECT * FROM da_players WHERE SteamID = ${dadminP.escape(sid)}`, (err, results) => {
                    if (err) {
                        reject();
                    };

                    if (!results) {
                        reject();
                    };

                    resolve(results[0]);
                });

                break;
        };
    });
};

async function getBankData(sid: string, server: "DRP"): Promise<any> {
    return new Promise(async (resolve, reject) => {
        switch (server) {
            case "DRP":
                darkrpBank.query(`SELECT * FROM gb_players WHERE SteamID = ${darkrpBank.escape(sid)}`, (err, results) => {
                    if (err) {
                        reject();
                    };

                    if (!results) {
                        resolve({Balance: 0});
                    }
                    else {
                        resolve(results[0]);
                    };
                });

                break; 
        };
    });
};

async function getCreditsData(sid: string, server: "DRP" | "PrisonRP"): Promise<any> {
    return new Promise(async (resolve, reject) => {
        switch (server) {
            case "DRP":
                darkrpCredits.query(`SELECT * FROM users WHERE steamID64 = ${darkrpCredits.escape(sid)}`, (err, results) => {
                    if (err) {
                        reject();
                    };

                    if (!results) {
                        resolve({credits: 0});
                    }
                    else {
                        resolve(results[0]);
                    };
                });

                break;

            case "PrisonRP":
                hubCredits.query(`SELECT * FROM Users WHERE steamid = ${hubCredits.escape(sid)}`, (err, results) => {
                    if (err) {
                        reject();
                    };

                    if (!results) {
                        resolve({credits: 0});
                    }
                    else {
                        resolve(results[0]);
                    };
                });

                break;
        };
    });
};

async function getBansData(sid: string, server: "DRP" | "MBRP" | "PrisonRP"): Promise<any> {
    return new Promise(async (resolve, reject) => {
        switch (server) {
            case "DRP":
                dadminD.query(`SELECT * FROM da_bans WHERE SteamID = ${dadminD.escape(sid)} ORDER BY Time DESC`, (err, results) => {
                    if (err) {
                        reject();
                    };

                    if (!results) {
                        resolve(undefined);
                    };

                    resolve(results);
                });

                break;
            
            case "MBRP":
                dadminM.query(`SELECT * FROM da_bans WHERE SteamID = ${dadminM.escape(sid)} ORDER BY Time DESC`, (err, results) => {
                    if (err) {
                        reject();
                    };

                    if (!results) {
                        resolve(undefined);
                    };

                    resolve(results);
                });

                break;

            case "PrisonRP":
                dadminP.query(`SELECT * FROM da_bans WHERE SteamID = ${dadminP.escape(sid)} ORDER BY Time DESC`, (err, results) => {
                    if (err) {
                        reject();
                    };

                    if (!results) {
                        resolve(undefined);
                    };

                    resolve(results);
                });

                break;
        };
    });
};

async function getData(sid: string, server: string): Promise<PlayerProfile> {
    return new Promise(async (resolve, reject) => {
        if (!isValidID(sid)) reject("Invalid SID64");
        
        switch(server) {
            case "drp":
                let darkrpData = await getServerData(sid, "DRP");
                if (!darkrpData) reject("Never Played");

                let darkrpDadmin = await getDadminData(convertToSID32(sid), "DRP");
                if (!darkrpDadmin) reject("Never Played");

                let bankData = await getBankData(sid, "DRP");
                if (!bankData) bankData = {Balance: 0};

                let creditsData = await getCreditsData(sid, "DRP");
                if (!creditsData) creditsData = {credits: 0};
                
                let darkrpBans = await getBansData(convertToSID32(sid), "DRP");
                if (!darkrpBans) darkrpBans = undefined;

                let darkrpLookup: PlayerProfile = {
                    game: {
                        rpname: darkrpData.rpname,
                        wallet: darkrpData.wallet,
                        uid: darkrpData.uid,
                    },
                    dadmin: {
                        rank: darkrpDadmin.Rank,
                        time: darkrpDadmin.Time,
                        lastTime: darkrpDadmin.LastTime,
                    },
                    bank: bankData.Balance || 0,
                    credits: creditsData.credits || 0,
                    bans: darkrpBans
                };

                resolve(darkrpLookup);
                break;
            
            case "mbrp":
                let mbrpData = await getServerData(sid, "MBRP");
                if (!mbrpData) reject("Never Played");
                
                let mbrpDadmin = await getDadminData(convertToSID32(sid), "MBRP");
                if (!mbrpDadmin) reject("Never Played");

                let mbrpBans = await getBansData(convertToSID32(sid), "MBRP");
                if (!mbrpBans) mbrpBans = undefined;

                let mbrpLookup: PlayerProfile = {
                    game: {
                        rpname: mbrpData.rpname,
                        wallet: mbrpData.wallet,
                        uid: mbrpData.uid,
                    },
                    dadmin: {
                        rank: mbrpDadmin.Rank,
                        time: mbrpDadmin.Time,
                        lastTime: mbrpDadmin.LastTime,
                    },
                    bank: 0,
                    credits: 0,
                    bans: mbrpBans
                };

                resolve(mbrpLookup);
                break;

                case "prisonrp":
                    let prisonData = await getServerData(sid, "PrisonRP");
                    if (!prisonData) reject("Never Played");
                    
                    let prisonDadmin = await getDadminData(convertToSID32(sid), "PrisonRP");
                    if (!prisonDadmin) reject("Never Played");
    
                    let prisonBans = await getBansData(convertToSID32(sid), "PrisonRP");
                    if (!prisonBans) prisonBans = undefined;

                    let prisonCredits = await getCreditsData(sid, "PrisonRP");
                    if (!prisonCredits) prisonCredits = {credits: 0};
    
                    let prisonLookup: PlayerProfile = {
                        game: {
                            rpname: prisonData.rpname,
                            wallet: prisonData.wallet,
                            uid: prisonData.uid,
                        },
                        dadmin: {
                            rank: prisonDadmin.Rank,
                            time: prisonDadmin.Time,
                            lastTime: prisonDadmin.LastTime,
                        },
                        bank: 0,
                        credits: prisonCredits.credits,
                        bans: prisonBans
                    };
    
                    resolve(prisonLookup);
                    break;

            default: {
                reject("Invalid Type");
            };
        };
    });
};

export {PlayerProfile, getData, isValidID, getBanCount, ownsGmod};

util.log("INIT", "Loaded utils/lookup.ts");