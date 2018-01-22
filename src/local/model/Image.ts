import { Entity, Column, PrimaryGeneratedColumn, Index, OneToOne, JoinColumn, ManyToOne ,CreateDateColumn,UpdateDateColumn} from 'typeorm';
import { AbstractFile } from './AbstractFile'
import { Bucket } from './Bucket'

@Entity({
  name: 'image'
})
@Index('name_bucket_id',['name','bucketId'],{unique:true})
export class Image extends AbstractFile{

  @Column({
    name: 'width',
    type: 'int',
    nullable: true
  })
  width: number;

  @Column({
    name: 'height',
    type: 'int',
    nullable: true
  })
  height: number;


  @Column({nullable:true})
  bucketId:number

  @ManyToOne(type => Bucket, bucket => bucket.images, {
    cascadeInsert:false,
    cascadeRemove: false,
    cascadeUpdate:false,
    nullable: false,
    lazy:false
  })
  @JoinColumn()
  bucket: Bucket
}