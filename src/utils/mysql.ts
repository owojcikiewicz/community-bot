import * as config from "./config";
import * as util from "./misc";
import mysql from "mysql";
import {createConnection} from "typeorm";
import {User, Misc, Mute} from "../entities";

// Create the MySQL pool.
const conn: mysql.Pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "satbot"
});

// Create all functions. 
function query(query: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        if (process.env.BOT_DEBUG == "1") {
            util.log("SQL", "Ran query: " + query);
        };
        
        conn.query(query, (err, results) => {
            if (err) {
                reject(err);
            };

            resolve(results);
        });
    });
};

function pquery(strquery: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        query(strquery)
            .then(results => {
                resolve(results[0]);
            })
            .catch(err => {
                reject(err);
                util.logsql(err);
            });
    });
};

// Create the MySQL connection.
function setup(): void {
    createConnection({
        type: "mysql", 
        host: process.env.DB_HOST,
        port: 3306,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [
            User,
            Misc,
            Mute
        ],
        synchronize: true,
    })
        .then(async conn => {
            if (config.getSetting({table: "general", key: "generateData"}) == false) {
                return 
            };

            for (let i in config.getSetting({table: "general", key: "data"})) {
                let id = i;
                let data = config.getSetting({table: "general", key: "data"})[i];
                
                let misc = new Misc();
                misc.id = id;
                misc.data = data;
    
                await conn.manager.save(misc);
            };
        })
        .catch(err => {
            util.logsql(err);
        });
};

function setData(key: string, value: string | number): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        query(`SELECT * FROM misc WHERE id = ${mysql.escape(key)}`)
            .then(results => {
                if (results.length == 0) {
                    query(`INSERT INTO misc VALUES (${mysql.escape(key)}, ${mysql.escape(value)})`)
                        .catch(err => {
                            reject(err);
                        });
                } else {
                    query(`UPDATE misc SET data = ${mysql.escape(value)} WHERE id = ${mysql.escape(key)}`)
                        .then(results => {
                            if (process.env.BOT_DEBUG == "1") {
                                util.log("SQL", `Ran SET with key ${key} and value ${value}`);
                            };

                            resolve(true)
                        })
                        .catch(err => {
                            reject(err);
                        });
                };
            })
            .catch(err => {
                reject(err);
            });
    });
};

function getData(key: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        query(`SELECT * FROM misc WHERE id = ${mysql.escape(key)}`)
            .then(results => {
                if (process.env.BOT_DEBUG == "1") {
                    util.log("SQL", `Ran GET with key ${key}`);
                };

                resolve(results[0].data);
            })
            .catch(err => {
                reject(err);
                util.logsql(err);
            });
    });
};

const escape: Function = mysql.escape;

// Setup all necessary tables.
function StartDatabase(): void {
    setup();
};

export {StartDatabase, query, pquery, escape, setData, getData};

util.log("INIT", "Loaded utils/mysql.ts");