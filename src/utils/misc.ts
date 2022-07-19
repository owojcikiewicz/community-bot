import {createCipher, createDecipher} from "crypto";
import {MysqlError} from "mysql";

const algorithm = "aes-256-ctr";
const key = process.env.APP_AUTH_KEY;
const inputEncoding = "utf8";
const outputEncoding = "hex";

function log(type: string, message: any): void {
    console.log(`[${type}] ${message}`);
};

function logsql(message: MysqlError): void {
    console.log(`[SQL] ${message}`)
};

const error = (err) => {
    console.error("[ERROR] ", err);
};

function numberToComma(x: number): string {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

function convertUnix(timestamp: number): string {
    let a = new Date(timestamp * 1000);
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let year = a.getFullYear();
    let month = months[a.getMonth()];
    let date = a.getDate();
    let hour = a.getHours();
    let min = a.getMinutes();
    let time = date + " " + month + " " + year + " - " + hour + ":" + min;
    
    return time;
};

function encrypt(value: any) {
    const cipher = createCipher(algorithm, key);
    let crypted = cipher.update(value, inputEncoding, outputEncoding);
    crypted += cipher.final(outputEncoding);

    return crypted;
};

function decrypt(value: any) {
    const decipher = createDecipher(algorithm, key);
    //@ts-ignore
    let dec = decipher.update(value, outputEncoding, inputEncoding);
    //@ts-ignore
    dec += decipher.final(inputEncoding);

    return dec;
};

export {log, logsql, error, numberToComma, convertUnix, encrypt, decrypt};

log("INIT", "Loaded utils/misc.ts");