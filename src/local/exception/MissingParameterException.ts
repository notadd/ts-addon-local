import { HttpException } from '@nestjs/common'

export class MissingParameterException extends HttpException{
    constructor(name?:string){
        super('缺少参数'+(name?name:''),400)
    }
}