import { Entity,Column,PrimaryGeneratedColumn,Index,ManyToOne,JoinColumn,OneToOne,CreateDateColumn,UpdateDateColumn} from 'typeorm';
import { Bucket } from './Bucket'


export class AbstractFile{
    
    @PrimaryGeneratedColumn({
        name:'id',
        type:'int'
    })
    id: number;
  
    @Column({ 
        name:'raw_name',
        type:'varchar',
        length: 50,
        nullable:false
    })
    raw_name: string;

    @Column({ 
        name:'tags',
        type:'simple-array',
        nullable:true,
    })
    tags: string[];
  
    @Column({ 
        name:'md5',
        type:'varchar',
        length: 50,
        nullable:false 
    })
    sha256: string;
  
    @Column({ 
        name:'type',
        type:'varchar',
        length: 20,
        nullable:true
    })
    type: string;
  
    @Column({
        name:'size',
        type:'int',
        nullable:true
    })
    size: number;
  
    //访问密钥
    @Column({
        name:'content_secret',
        type:'varchar',
        length:'50',
        nullable:true
    })
    content_secret: string;

    @CreateDateColumn({
        name:'create_date',
        type:'date'
    })
    create_date:Date;

    @UpdateDateColumn({
        name:'update_date',
        type:'date'
    })
    update_date:Date;

}
