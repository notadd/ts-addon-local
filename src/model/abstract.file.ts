import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export class AbstractFile {

    @PrimaryGeneratedColumn({
        name: "id",
        type: "integer"
    })
    id: number;

    @Column({
        name: "rawName",
        type: "varchar",
        length: 50,
        nullable: false
    })
    rawName: string;

    @Column({
        name: "tags",
        type: "simple-array",
        nullable: true,
    })
    tags: Array<string>;

    // 本地存储中，文件名为它的sha256值有64位
    // 为了与云存储统一，也称做name,这里统一空间下name不可以重复
    @Column({
        name: "name",
        type: "varchar",
        length: 100,
        nullable: false
    })
    name: string;

    @Column({
        name: "type",
        type: "varchar",
        length: 20,
        nullable: true
    })
    type: string;

    @Column({
        name: "size",
        type: "integer",
        nullable: true
    })
    size: number;

    // 访问密钥
    @Column({
        name: "contentSecret",
        type: "varchar",
        length: "50",
        nullable: true
    })
    contentSecret: string;

    @CreateDateColumn({
        name: "createDate",
        type: "date"
    })
    createDate: Date;

    @UpdateDateColumn({
        name: "updateDate",
        type: "date"
    })
    updateDate: Date;

}
