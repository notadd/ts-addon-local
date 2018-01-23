import { Query, Resolver, ResolveProperty, Mutation } from '@nestjs/graphql';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DownloadProcess } from '../../interface/file/DownloadProcess'
import { KindUtil } from '../../util/KindUtil'
import { Document } from '../../model/Document'
import { Bucket } from '../../model/Bucket';
import { Audio } from '../../model/Audio'
import { Video } from '../../model/Video'
import { Image } from '../../model/Image';
import { File } from '../../model/File'
import * as  path from 'path'

/*文件Resolver，包含了文件下载预处理、上传预处理、下载、上传、
  获取单个文件url、获取多个文件信息以及url、根据url访问文件、删除文件等接口
*/

@Resolver('File')
export class FileResolver {

    constructor(
        private readonly kindUtil: KindUtil,
        @InjectRepository(File) private readonly fileRepository: Repository<File>,
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>) {
    }


    /* 文件下载预处理接口
     当客户端需要下载某个文件时使用
     返回下载文件的方法、url
     @Param bucket_name：文件所属空间名
     @Param type：       上传文件扩展名，即文件类型
     @Param name：       文件名
     @Return data.code：状态码，200为成功，其他为错误
             data.message：响应信息
             data.url：下载时的url
             data.method： 下载方法
  */
  @Query('downloadProcess')
  async downloadProcess(req , body:DownloadProcess):Promise<any>{
      let data = {
        code:200,
        message:'',
        //下载文件使用get方法
        method:'get',
        url:'http://'+req.headers.host+'/local/file/download'
      }
      let {bucket_name,name,type} =body
      if(!bucket_name || !name || !type){
        data.message = '缺少参数'
        return data
      }
      let bucket:Bucket = await this.bucketRepository.findOne({name:bucket_name})
      //指定空间不存在
      if(!bucket){
        data.code = 401
        data.message = '指定空间'+bucket_name+'不存在'
        return data
      }
      let kind
      let file:File|Audio|Video|Image|Document
      if(this.kindUtil.isImage(type)){
        file = await this.imageRepository.findOne({name,type,bucketId:bucket.id})
      }else{
        //其他类型暂不支持
      }
      if(!file){
        data.code = 402
        data.message  = '指定文件'+name+'不存在'
        return data
      }
      data.url += '/'+bucket.name+'/'+file.name+'.'+file.type
      data.message = '获取下载预处理信息成功'
      return data
    }

    /*文件表单上传预处理接口
    @Param bucket_name：上传空间名
    @Param md5：文件md5,在本地存储中没有用
    @Param contentName：文件名
    @Param tags:文件标签数组
    @Param contentSecret：文件密钥，暂时不支持这个功能
    @Param imagePreProcessInfo：图片预处理信息
    @Return data.code：状态码，200为成功，其他为错误
            data.message：响应信息
            data.u：上传时的url
            data.method： 上传方法
            data.form：   表单上传的字段对象，包含了imagePreProcessInfo字段，上传时需要加上file字段
  */
  @Mutation('uploadProcess')
  async uploadProcess(req , body):Promise<any>{
    let data = {
      code:200,
      message:'',
      method:'post',
      url:'http://'+req.headers.host+'/local/file/download',
      form:{
        imagePreProcessInfo:'',
        contentSecret:'',
        tags:'',
        md5:''
      }
    }
    //可以根据md5对文件内容进行校验
    let {bucket_name,md5,contentName,contentSecret,tags,imagePreProcessInfo} = body
    if(!bucket_name||!contentName){
      data.code = 400
      data.message = '缺少参数'
      return data
    }
    let bucket:Bucket = await this.bucketRepository.findOne({name:bucket_name})
    if(!bucket){
      data.code = 401
      data.message = '指定空间'+bucket_name+'不存在'
      return
    }
    data.url+='/'+bucket.name+'/'+contentName
    data.form.md5 = md5
    data.form.contentSecret = contentSecret
    data.form.tags = JSON.stringify(tags)
    data.form.imagePreProcessInfo = JSON.stringify(imagePreProcessInfo)
    return data
  }
}