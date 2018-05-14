import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { AbstractFile } from "./abstract.file";
import { Bucket } from "./bucket.entity";

@Entity("image")
// 同一空间下name不能重复，创建唯一性约束
@Index("name_bucket_id", ["name", "bucketId"], { unique: true })
export class Image extends AbstractFile {

    @Column({ nullable: true })
    width: number;

    @Column({ nullable: true })
    height: number;

    @Column({ nullable: true })
    bucketId: number;

    @ManyToOne(type => Bucket, bucket => bucket.images, {
        cascade: false,
        nullable: false,
        lazy: false,
        eager: false
    })
    @JoinColumn()
    bucket: Bucket;
}
