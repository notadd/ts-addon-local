import { Component, Inject } from '@nestjs/common';
import { ImagePostProcessInfo,ImagePreProcessInfo,Resize,Tailor,Blur } from '../interface/file/ImageProcessInfo'
import { ImageMetadata } from '../interface/file/ImageMetadata'
import { Bucket } from '../model/Bucket'
import { isArray } from 'util';
import * as sharp from 'sharp'
import { SharpInstance } from 'sharp' 
import * as crypto from 'crypto'
import * as path from 'path'
import * as fs from 'fs'

/* 图片处理工具类 */
@Component()
export class ImageProcessUtil {
    private readonly gravity:Set<string>
    private readonly font:Map<string,string>
    private readonly colorRegex:RegExp
    private readonly borderRegex:RegExp
    private readonly format:Set<string>
    constructor(){
        //重心集合，在裁剪与水印中使用
       this.gravity = new Set(['northwest','north','northeast','west','center','east','southwest','south','southeast'])
       //字体集合，在文字水印中使用
       this.font = new Map([['宋体','simsun'],['黑体','simhei'],['楷体','simkai'],['隶书','simli'],['幼圆','simyou'],['仿宋','simfang'],['简体中文','sc'],['繁体中文','tc'],['Arial','arial'],['Georgia','georgia'],['Helvetica','helvetica'],['Times-New-Roman','roman']]) 
       //验证RGB颜色的正则表达式
       this.colorRegex = new RegExp('^[0-9A-F]{6}$','g') 
       //验证文字描边的正则表达式
       this.borderRegex = new RegExp('^[0-9A-F]{8}$','g') 
       //图片后处理保存格式集合
       this.format = new Set(['jpeg','png','webp'])
    }

    //获取指定图片、字节缓冲的图片元数据
    async getMetadata(pathOrBuffer:string|Buffer):Promise<ImageMetadata>{
        if((typeof pathOrBuffer)==='string'){
            let name = crypto.createHash('sha256').update(fs.readFileSync(pathOrBuffer)).digest('hex')
        }else{
            let name = crypto.createHash('sha256').update(pathOrBuffer).digest('hex')
        }
        let {format,width,height}  = await sharp(pathOrBuffer).metadata()
        return {
            name,
            format,
            width,
            height
        }
    }

    //根据图片处理信息处理指定路径图片，并且按照配置保存它，返回处理后图片元数据
    async processAndStore(data:any,imagePath:string,bucket:Bucket,imageProcessInfo:ImagePostProcessInfo|ImagePreProcessInfo):Promise<ImageMetadata>{
        //根据处理信息处理图片，获取处理后Buffer
        let temp:Buffer = await this.processAndOutput(data,imagePath,imageProcessInfo)
        if(data.code !==200){
            return null
        }
        //获取处理后元数据
        let metadata:ImageMetadata = await this.getMetadata(temp)
        //保存处理后图片
        let absolute_path:string = path.resolve(__dirname,'../','store',bucket.directory,metadata.name+'.'+metadata.format)
        await new Promise((resolve,reject)=>{
            fs.writeFile(absolute_path,temp,(err)=>{
                if(err) {
                    data.code = 402
                    data.message = '文件写入错误'
                }
                resolve()
            })
        })
        //出现错误返回null
        if(data.code !==200){
            return null
        }
        return metadata
    }

    //根据图片处理信息处理指定路径图片，返回内存中字节存储
    async processAndOutput(data:any,imagePath:string,imageProcessInfo:ImagePostProcessInfo|ImagePreProcessInfo):Promise<Buffer>{
        let {resize,tailor,watermark,rotate,roundrect,blur,sharpen,format,lossless,strip,quality,progressive} = imageProcessInfo as ImagePostProcessInfo
        //获取处理之前元数据
        let metadata:ImageMetadata = await this.getMetadata(imagePath)
        let instance:SharpInstance = sharp(imagePath)
        try{
            if(tailor&&tailor.isBefore) this.tailor(instance,tailor)
            if(resize) this.resize(instance,metadata,resize)
            if(tailor&&!tailor.isBefore) this.tailor(instance,tailor)
            this.watermark(instance,watermark)
            if(rotate) this.rotate(instance,rotate)
            if(roundrect) this.roundrect(instance,roundrect)
            if(blur) this.blur(instance,blur)
            if(sharpen) this.sharpen(instance,sharpen)
            if(format) this.format(instance,format,lossless)
            if(strip) this.strip(instance,strip)
            if(quality||progressive) this.output(instance,quality,progressive)
            return await instance.toBuffer()
        }catch(err){
            data.code = 404
            data.message = err.toString()
            return null
        }
    }

    resize(instance:SharpInstance,metadata:ImageMetadata,resize:Resize):void{
        let {mode,data} = resize
        let width,height
        //等比缩放
        if(mode == 'scale'){
            if(data.scale&&Number.isInteger(data.scale)&&data.scale>=1&&data.scale<=1000){
               width = metadata.width*data.scale/100
               height = metadata.height*data.scale/100
            }
            else{
                throw new Error('缩放比例错误')
            }
        }
        //只缩放宽度
        else if(mode == 'wscale'){
            if(data.wscale&&Number.isInteger(data.wscale)&&data.wscale>=1&&data.wscale<=1000){
               width = metadata.width*data.wscale/100
               height = metadata.height
            }else{
               throw new Error('宽度缩放比例错误')
            }
        }
        //只缩放高度
        else if(mode == 'hscale'){
            if(data.hscale&&Number.isInteger(data.hscale)&&data.hscale>=1&&data.hscale<=1000){
                width = width
                height = metadata.height*data.hscale/100
            }else{
                throw new Error('高度缩放比例错误')
            }
        }
        //指定宽高缩放
        else if(mode == 'both'){
            if(data.width&&Number.isInteger(data.width)&&data.height&&Number.isInteger(data.height)){
                width = metadata.width
                height = metadata.height
            }else{
                throw new Error('宽高参数错误')
            }
        }
        //指定宽度等比缩放
        else if(mode == 'fw'){
            if(data.width&&Number.isInteger(data.width)){
                width = data.width
                height = metadata.height*data.width/metadata.width
            }else{
                throw new Error('宽度参数错误')
            }
        }
        //指定高度等比缩放
        else if(mode == 'fh'){
            if(data.height&&Number.isInteger(data.height)){
                height = data.height
                width = metadata.width*data.width/metadata.width
            }else{
                throw new Error('高度参数错误')
            }
        }
        //指定像素等比缩放
        else if(mode == 'fp'){
            if(data.pixel&&Number.isInteger(data.pixel)&&data.pixel>=1&&data.pixel<=25000000){
                height = Math.sqrt(data.pixel*metadata.height/metadata.width)
                width = data.pixel/height
            }else{
                throw new Error('像素参数不正确')
            }
        }else if(mode == 'fwfh'){
            if(data.width&&Number.isInteger(data.width)&&data.height&&Number.isInteger(data.height)){
                width = data.width
                height = data.height
            }else{
                throw new Error('宽高参数不正确')
            }
        }else if(mode == 'fwfh2'){
            if(data.width&&Number.isInteger(data.width)&&data.height&&Number.isInteger(data.height)){
                width = data.width
                height = data.height
            }else{
                throw new Error('宽高参数不正确')
            }
        }else{
            throw new Error('缩放模式不正确')
        }

        instance.resize(width,height)
        if(mode == 'fwfh'){
            instance.max()
        }else if(mode == 'fwfh2'){
            instance.min()
        }
        return
    }

    tailor(instance:SharpInstance,tailor:Tailor){
        
    }
}