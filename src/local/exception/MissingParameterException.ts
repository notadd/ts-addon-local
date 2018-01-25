import { HttpException } from '@nestjs/common'

export class MissingParameterException extends HttpException{
    constructor(){
        super('缺少参数',400)
    }
}