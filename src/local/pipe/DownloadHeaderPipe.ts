
import { PipeTransform, Pipe, ArgumentMetadata, HttpException } from '@nestjs/common';
import { HeaderParam } from '../interface/file/HeaderParam';


@Pipe()
export class DownloadHeaderPipe implements PipeTransform<any> {
    transform(value: HeaderParam, metadata: ArgumentMetadata) {
        console.log(value)
        let { bucketName, fileName } = value
        if (!bucketName) {
            throw new HttpException('缺少参数bucketName', 400)
        }
        if (!fileName) {
            throw new HttpException('缺少参数fileName', 400)
        }
        return value;
    }
}