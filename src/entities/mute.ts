import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity()
export class Mute {
    @PrimaryColumn()
    discordID: string; 

    @Column()
    reason: string; 

    @Column()
    timestamp: number;
};