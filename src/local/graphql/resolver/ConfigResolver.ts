import { Resolver, Query, Mutation } from '@nestjs/graphql'
import { ConfigService } from '../../service/ConfigService'
import { BucketConfig } from '../../interface/config/BucketConfig'
import { ImageFormat } from '../../interface/config/ImageFormat'
import { EnableImageWatermark   } from '../../interface/config/EnableImageWatermark'
import * as fs from 'fs'
import { KindUtil } from '../../util/KindUtil';

/* 本地存储配置的resolver */
@Resolver('Config')
export class ConfigResolver {

    private readonly gravity: Set<string>

    constructor(
        private readonly kindUtil:KindUtil,
        private readonly configService: ConfigService
    ) {
        this.gravity = new Set(['northwest', 'north', 'northeast', 'west', 'center', 'east', 'southwest', 'south', 'southeast'])
    }

    /* 空间配置的resolver，与云存储不同，只配置空间目录即可，私有空间要配置token超时与密钥 */
    @Mutation('bucket')
    async bucket(req: any, body: BucketConfig): Promise<any> {
        let data = {
            code: 200,
            message: ''
        }
        let { isPublic, directory, token_expire, token_secret_key } = body
        //验证参数
        if (isPublic === undefined || !directory) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        if (isPublic !== true && isPublic !== false) {
            data.code = 400
            data.message = 'isPublic参数不正确'
            return data
        }
        if (!isPublic && (!token_expire || !token_secret_key)) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        //进行保存,如果存在就更新
        await this.configService.saveBucketConfig(data, body)
        return data
    }

    /* 图片保存格式配置*/
    @Mutation('imageFormat')
    async  imageFormat(req:any, body:ImageFormat): Promise<any> {
        let data = {
            code: 200,
            message: ""
        }
        let format = body.format
        //验证参数
        if (format == undefined || format.length == 0) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        //保存格式
        await this.configService.saveImageFormat(data, body)
        //格式参数不正确、配置不存在、保存失败
        if (data.code == 401 || data.code == 402 || data.code == 403) {
            return data
        }
        return data
    }

    @Mutation('enableImageWatermark')
    async  enableImageWatermark(req:any, body:EnableImageWatermark):Promise<any>{
      let data = {
        code:200,
        message:''
      }
      //验证参数
      let {enable} = body
      if(enable===null||enable===undefined){
        data.code = 400
        data.message = '缺少参数'
        return data
      }
      if(enable!==true&&enable!==false){
        data.code = 400
        data.message  = '参数错误'
        return data
      }
      await this.configService.saveEnableImageWatermark(data,body)
      //保存启用水印到数据库失败，无法模仿这个错误
      if(data.code === 401 || data.code === 402){
        return data
      }
      return data
    }

    @Mutation('imageWatermark')
    async  imageWatermarkConfig(req:any, body):Promise<any>{
      let data = {
        code:200,
        message:''
      }
      let {name,base64,gravity,opacity,x,y,ws}  =body
      fs.writeFileSync(__dirname+'/'+name,Buffer.from(base64,'base64'))
      let obj:any = {}
      let file:any = {}
      obj.x = x
      obj.y = y
      obj.opacity = opacity
      obj.ws = ws
      obj.gravity = gravity
      file.name = name
      file.path = __dirname+'/'+name
      if(!this.gravity.has(obj.gravity)){
        data.code = 400
        data.message = '不允许的水印图片位置'
        return data
      }
      if(!Number.isInteger(obj.x)){
        data.code = 400
        data.message = 'x偏移不是整数'
        return data
      }
      if(!Number.isInteger(obj.y)){
        data.code = 400
        data.message = 'y偏移不是整数'
        return data
      }
      if(!Number.isInteger(obj.opacity)){
        data.code = 400
        data.message = '透明度不是整数'
        return data
      }else if(obj.opacity<=0){
        data.code = 400
        data.message = '透明度不大于0'
        return data
      }else if(obj.opacity>100){
        data.code = 400
        data.message = '透明度大于100'
        return data
      }else{
        
      }
      if(!Number.isInteger(obj.ws)){
        data.code = 400
        data.message = '短边自适应比例不是整数'
        return data
      }else if(obj.ws<=0){
        data.code = 400
        data.message = '短边自适应比例不大于0'
        return data
      }else{
        //暂定短边自适应比例可以大于100
      }
      if(!this.kindUtil.isImage(file.name.substr(file.name.lastIndexOf('.')+1))){
        data.code = 400
        data.message = '不允许的水印图片类型'
        return data
      }
      //保存后台水印配置
      await this.configService.saveImageWatermark(data,file,obj)
  
      if(data.code === 401 || data.code === 402|| data.code === 403 ){
        return data
      }
      return data
    }
}