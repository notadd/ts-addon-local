import { ImagePostProcessInfo } from '../interface/file/ImageProcessInfo';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpException } from '@nestjs/common';
import { FileUtil } from '../util/FileUtil';
import { KindUtil } from '../util/KindUtil';
import { Bucket } from '../model/Bucket';
import { Image } from '../model/Image';
import { Repository } from 'typeorm';
import * as path from 'path';

class StoreComponent {

    constructor(
        private readonly kindUtil: KindUtil,
        private readonly fileUtil: FileUtil,
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>
    ) { }

    async delete(bucketName: string, name: string, type: string): Promise<void> {
        //验证参数
        if (!bucketName || !name || !type) {
            throw new HttpException('缺少参数', 400)
        }
        let bucket: Bucket = await this.bucketRepository.findOne({ name: bucketName })
        if (!bucket) {
            throw new HttpException('指定空间' + bucketName + '不存在', 401)
        }
        //根据文件种类，查找、删除数据库
        let kind = this.kindUtil.getKind(type)
        if (kind === 'image') {
            let image: Image = await this.imageRepository.findOne({ name, bucketId: bucket.id })
            if (!image) {
                throw new HttpException('文件' + name + '不存在于数据库中', 404)
            }
            await this.imageRepository.delete({ name, bucketId: bucket.id })
        } else {
            //其他类型暂不支持
        }
        //删除目录下存储文件
        let realPath = path.resolve(__dirname, '../../', 'store', bucketName, name + '.' + type)
        if (!this.fileUtil.exist(realPath)) {
            throw new HttpException('要删除的文件不存在', 404)
        }
        await this.fileUtil.delete(realPath)
    }
    async upload(bucketName: string, rawName: string, base64: string): Promise<{ bucketName: string, name: string, type: string }> {

    }
    async getUrl(bucketName: string, name: string, type: string, imageProcessInfo: ImagePostProcessInfo): Promise<string> {

    }
}

export const storeComponentProvider = {
    provider: 'StoreComponent',
    useClass: StoreComponent
}