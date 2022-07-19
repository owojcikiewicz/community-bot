import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity()
export class User {
    @PrimaryColumn()
    discordID: string; 

    @Column()
    steamID: string; 

    @Column()
    nitro: number;
};