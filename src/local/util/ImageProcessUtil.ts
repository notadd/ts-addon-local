import { Component, Inject } from '@nestjs/common';
import { isArray } from 'util';
import { Bucket } from '../model/Bucket'
import { ImagePostProcessInfo,ImagePreProcessInfo } from '../interface/file/ImageProcessInfo'


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

    getMetadata(imagePath:string){

    }

    process(imagePath,imageProcessInfo){

    }

}