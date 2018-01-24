import { Query, Resolver, ResolveProperty, Mutation } from '@nestjs/graphql';
import { DownloadProcess } from '../../interface/file/DownloadProcess';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OneData } from '../../interface/file/OneData';
import { FileService } from '../../service/FileService'
import { InjectRepository } from '@nestjs/typeorm';
import { TokenUtil } from '../../util/TokenUtil';
import { Document } from '../../model/Document'
import { KindUtil } from '../../util/KindUtil';
import { Bucket } from '../../model/Bucket';
import { Audio } from '../../model/Audio';
import { Video } from '../../model/Video';
import { Image } from '../../model/Image';
import { File } from '../../model/File';
import * as path from 'path';
import * as fs from 'fs'
/*文件Resolver，包含了文件下载预处理、上传预处理、下载、上传、
  获取单个文件url、获取多个文件信息以及url、根据url访问文件、删除文件等接口
*/
@Resolver('File')
export class FileResolver {

  constructor(
    private readonly kindUtil: KindUtil,
    private readonly tokenUtil: TokenUtil,
    private readonly fileService: FileService,
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
  async downloadProcess(req, body: DownloadProcess): Promise<any> {
    let data = {
      code: 200,
      message: '',
      method: 'get',
      headers: null,
      url: req.protocol + '://' + req.get('host') + '/local/file/download'
    }
    let { bucket_name, name, type } = body
    if (!bucket_name || !name || !type) {
      data.message = '缺少参数'
      return data
    }
    let bucket: Bucket = await this.bucketRepository.findOne({ name: bucket_name })
    //指定空间不存在
    if (!bucket) {
      data.code = 401
      data.message = '指定空间' + bucket_name + '不存在'
      return data
    }
    let kind
    let file: File | Audio | Video | Image | Document
    if (this.kindUtil.isImage(type)) {
      file = await this.imageRepository.findOne({ name, type, bucketId: bucket.id })
    } else {
      //其他类型暂不支持
    }
    if (!file) {
      data.code = 402
      data.message = '指定文件' + name + '不存在'
      return data
    }
    data.url += '/' + bucket.name + '/' + file.name + '.' + file.type
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
  async uploadProcess(req, body): Promise<any> {
    let data = {
      code: 200,
      message: '',
      method: 'post',
      url: req.protocol + '://' + req.get('host') + '/local/file/upload',
      form: {
        imagePreProcessString: '',
        contentSecret: '',
        tagsString: '',
        md5: ''
      }
    }
    //可以根据md5对文件内容进行校验
    let { bucket_name, md5, contentName, contentSecret, tags, imagePreProcessInfo } = body
    if (!bucket_name || !contentName) {
      data.code = 400
      data.message = '缺少参数'
      return data
    }
    let bucket: Bucket = await this.bucketRepository.findOne({ name: bucket_name })
    if (!bucket) {
      data.code = 401
      data.message = '指定空间' + bucket_name + '不存在'
      return data
    }
    data.url += '/' + bucket.name + '/' + contentName
    data.form.md5 = md5
    data.form.contentSecret = contentSecret
    data.form.tagsString = JSON.stringify(tags)
    data.form.imagePreProcessString = JSON.stringify(imagePreProcessInfo)
    return data
  }

  /* 获取访问单个文件url方法 ，从后台获取
     @Param bucket_name：空间名
     @Param name：       文件名，不包括扩展名
     @Param type:        文件类型
     @Param imagePostProcessInfo 图片后处理信息，转化为JSON字符串
     @Return data.code：状态码，200为成功，其他为错误
             data.message：响应信息
             data.url：访问文件的全部url，包括域名、目录、文件名、扩展名、token、处理字符串,访问图片方法必须是get，不说明
  */
  @Query('one')
  async  getFile(req, body): Promise<any> {
    let data: OneData = {
      code: 200,
      message: "获取文件url成功",
      url: req.protocol + '://' + req.get('host') + '/local/file/visit'
    }
    //空间名、目录数组、文件名
    let { bucket_name, name, type, imagePostProcessInfo } = body
    if (!bucket_name || !name || !type) {
      data.code = 400
      data.message = '缺少参数'
      return data
    }
    let bucket: Bucket = await this.bucketRepository.createQueryBuilder("bucket")
      .leftJoinAndSelect("bucket.image_config", "image_config")
      .leftJoinAndSelect("bucket.audio_config", "audio_config")
      .leftJoinAndSelect("bucket.video_config", "video_config")
      .where("bucket.name = :name", { name: bucket_name })
      .getOne()
    if (!bucket) {
      data.code = 401
      data.message = '空间不存在'
      return data
    }
    let kind = this.kindUtil.getKind(type)
    //处理图片类型
    if (kind === 'image') {
      let image: Image = await this.imageRepository.findOne({ name, bucketId: bucket.id })
      if (!image) {
        data.code = 402
        data.message = '指定图片不存在'
        return data
      }
      //所有文件调用统一的拼接Url方法 
      data.url += '/' + bucket_name + '/' + name + '.' + type
      //存储图片处理信息时
      if (imagePostProcessInfo) {
        //拼接图片处理的查询字符串
        data.url += '?imagePostProcessString=' + JSON.stringify(imagePostProcessInfo)
        //私有空间要拼接token，token使用它之前的完整路径计算
        if (bucket.public_or_private === 'private') {
          data.url += '&token=' + this.tokenUtil.getToken(data.url, bucket)
        }
      } else {
        if (bucket.public_or_private === 'private') {
          data.url += '?token=' + this.tokenUtil.getToken(data.url, bucket)
        }
      }
    } else {
      //暂不支持
    }
    console.log(data.url)
    return data
  }

  /* 获取指定空间下文件信息以及相关访问url
     @Param bucket_name：文件所属空间
     @Return data.code： 状态码，200为成功，其他为错误
            data.message：响应信息
            data.baseUrl：访问文件的基本url
            data.files    分页后的文件信息数组，里面添加了访问文件url信息，url不包含域名，包含了文件密钥、token
            data.imges：   图片信息数组
            data.audios:  音频信息数组
            data.videos:  视频信息数组
            data.documents: 文档信息数组
  */
  @Query('all')
  async  files(req, body): Promise<any> {
    let data = {
      code: 200,
      message: '获取空间下所有文件成功',
      baseUrl: req.protocol + '://' + req.get('host') + '/local/file/visit',
      files: [],
      images: [],
      audios: [],
      videos: [],
      documents: []
    }
    let { bucket_name } = body
    if (!bucket_name) {
      data.code = 400
      data.message = '缺少参数'
      return data
    }
    let bucket: Bucket = await this.bucketRepository.findOne({ name: bucket_name })
    if (!bucket) {
      data.code = 401
      data.message = '空间' + bucket_name + '不存在'
      return
    }
    await this.fileService.getAll(data, bucket)
    return data
  }

  /* 文件删除接口
     当客户端需要删除某个文件时使用，
     @Param bucket_name：文件所属空间名
     @Param type：       文件扩展名，即文件类型
     @Param name：       文件名
     @Return data.code：状态码，200为成功，其他为错误
             data.message：响应信息
  */
  @Mutation('deleteFile')
  async deleteFile(req, body): Promise<any> {
    let data = {
      code: 200,
      message: '删除成功'
    }
    let { bucket_name, type, name } = body
    if (!bucket_name || !name || !type) {
      data.code = 400
      data.message = '缺少参数'
      return data
    }
    let bucket: Bucket = await this.bucketRepository.findOne({ name: bucket_name })
    if (!bucket) {
      data.code = 401
      data.message = '空间' + bucket_name + '不存在'
      return data
    }
    let kind = this.kindUtil.getKind(type)
    if (kind === 'image') {
      let image: Image = await this.imageRepository.findOne({ name, bucketId: bucket.id })
      if (!image) {
        data.code = 402
        data.message = '文件' + name + '不存在于数据库中'
        return data
      }
      await this.imageRepository.delete({ name, bucketId: bucket.id })
    } else {
      //其他类型暂不支持
    }
    let realPath = path.resolve(__dirname, '../../', 'store', bucket_name, name + '.' + type)
    if (!fs.existsSync(realPath)) {
      data.code = 404
      data.message = '要删除的文件不存在'
      return data
    }
    fs.unlinkSync(realPath)
    return data
  }
}