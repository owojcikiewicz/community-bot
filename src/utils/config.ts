import * as path from "path";
import * as fs from "fs"; 
import * as dotenv from "dotenv"; dotenv.config();
import {ConfigSetting} from "./types";

let config = JSON.parse(fs.readFileSync(path.join(__dirname, "../../config.json"), "utf8"));

function getSetting(info: ConfigSetting): any {
    return config[info.table][info.key];
};

export {getSetting};