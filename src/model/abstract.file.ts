import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export class AbstractFile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 50,
        nullable: false,
    })
    rawName: string;

    @Column({
        nullable: true,
    })
    tags: Array<string>;

    // 本地存储中，文件名为它的sha256值有64位
    // 为了与云存储统一，也称做name,这里统一空间下name不可以重复
    @Column({
        length: 100,
        nullable: false,
    })
    name: string;

    @Column({
        length: 20,
        nullable: true,
    })
    type: string;

    @Column({
        nullable: true,
    })
    size: number;

    // 访问密钥
    @Column({
        length: "50",
        nullable: true,
    })
    contentSecret: string;

    @CreateDateColumn()
    createDate: Date;

    @UpdateDateColumn()
    updateDate: Date;
}
