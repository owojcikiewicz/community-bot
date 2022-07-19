export type Case = "RDM" | "RDA";

export type Server = "DRP" | "MBBRP";

export interface Module {
    name: string;
    enabled: boolean;
    callback: Function;
};

export interface Command {
    name: string;
    description: string; 
    enabled: boolean;
    alias?: string[];
    check?: string[];
    callback: Function;
};

export interface ConfigSetting {
    table: string;
    key: string;
};

export interface GameData {
    rpname: string; 
    wallet: number; 
    uid: string;
};

export interface AdminData {
    rank: string; 
    time: number;
    lastTime: number; 
};

export interface PlayerProfile {
    game: GameData; 
    dadmin: AdminData;
    bank: number; 
    credits?: number;
    bans: any;
};

export interface GameServer {
    name: string; 
    ip: string; 
    port: number; 
    channel: string;
    game?: string;
};