import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity()
export class Misc {
    @PrimaryColumn()
    id: string; 

    @Column()
    data: string;
};