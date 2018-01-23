import { Query, Resolver, ResolveProperty, Mutation } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ConfigService } from '../../service/ConfigService';
import { FileService } from '../../service/FileService';
import { KindUtil } from '../../util/KindUtil'
import { Document } from '../../model/Document'
import { Bucket } from '../../model/Bucket';
import { Audio } from '../../model/Audio'
import { Video } from '../../model/Video'
import { Image } from '../../model/Image';
import { File } from '../../model/File'
import * as  path from 'path'

/*文件Resolver，包含了文件下载预处理、上传预处理、下载、上传、获取单个文件url、获取多个文件信息以及url、删除文件等接口
*/

@Resolver('File')
export class FileResolver {

    constructor(
        private readonly kindUtil: KindUtil,
        private readonly fileService: FileService,
        private readonly configService: ConfigService,
        @InjectRepository(File) private readonly fileRepository: Repository<File>,
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>) {
    }

}