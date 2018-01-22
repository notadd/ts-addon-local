import { Component, Inject } from '@nestjs/common';
import { ImagePostProcessInfo, ImagePreProcessInfo, Resize, Tailor, Blur } from '../interface/file/ImageProcessInfo'
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
    private readonly gravity: Set<string>
    private readonly font: Map<string, string>
    private readonly colorRegex: RegExp
    private readonly borderRegex: RegExp
    private readonly format: Set<string>
    constructor() {
        //重心集合，在裁剪与水印中使用
        this.gravity = new Set(['northwest', 'north', 'northeast', 'west', 'center', 'east', 'southwest', 'south', 'southeast'])
        //字体集合，在文字水印中使用
        this.font = new Map([['宋体', 'simsun'], ['黑体', 'simhei'], ['楷体', 'simkai'], ['隶书', 'simli'], ['幼圆', 'simyou'], ['仿宋', 'simfang'], ['简体中文', 'sc'], ['繁体中文', 'tc'], ['Arial', 'arial'], ['Georgia', 'georgia'], ['Helvetica', 'helvetica'], ['Times-New-Roman', 'roman']])
        //验证RGB颜色的正则表达式
        this.colorRegex = new RegExp('^[0-9A-F]{6}$', 'g')
        //验证文字描边的正则表达式
        this.borderRegex = new RegExp('^[0-9A-F]{8}$', 'g')
        //图片后处理保存格式集合
        this.format = new Set(['jpeg', 'png', 'webp'])
    }

    //获取指定图片、字节缓冲的图片元数据
    async getMetadata(pathOrBuffer: string | Buffer): Promise<ImageMetadata> {
        if ((typeof pathOrBuffer) === 'string') {
            let name = crypto.createHash('sha256').update(fs.readFileSync(pathOrBuffer)).digest('hex')
        } else {
            let name = crypto.createHash('sha256').update(pathOrBuffer).digest('hex')
        }
        let { format, width, height } = await sharp(pathOrBuffer).metadata()
        return {
            name,
            format,
            width,
            height
        }
    }

    //根据图片处理信息处理指定路径图片，并且按照配置保存它，返回处理后图片元数据
    async processAndStore(data: any, imagePath: string, bucket: Bucket, imageProcessInfo: ImagePostProcessInfo | ImagePreProcessInfo): Promise<ImageMetadata> {
        //根据处理信息处理图片，获取处理后Buffer
        let temp: Buffer = await this.processAndOutput(data, imagePath, imageProcessInfo)
        if (data.code !== 200) {
            return null
        }
        //获取处理后元数据
        let metadata: ImageMetadata = await this.getMetadata(temp)
        //保存处理后图片
        let absolute_path: string = path.resolve(__dirname, '../', 'store', bucket.directory, metadata.name + '.' + metadata.format)
        await new Promise((resolve, reject) => {
            fs.writeFile(absolute_path, temp, (err) => {
                if (err) {
                    data.code = 402
                    data.message = '文件写入错误'
                }
                resolve()
            })
        })
        //出现错误返回null
        if (data.code !== 200) {
            return null
        }
        return metadata
    }

    //根据图片处理信息处理指定路径图片，返回内存中字节存储
    async processAndOutput(data: any, imagePath: string, imageProcessInfo: ImagePostProcessInfo | ImagePreProcessInfo): Promise<Buffer> {
        let { resize, tailor, watermark, rotate, roundrect, blur, sharpen, format, lossless, strip, quality, progressive } = imageProcessInfo as ImagePostProcessInfo
        //获取处理之前元数据
        let metadata: ImageMetadata = await this.getMetadata(imagePath)
        let instance: SharpInstance = sharp(imagePath)
        try {
            //缩放与裁剪都需要之前一步得到的图片宽高
            //如果存在裁剪，且为缩放之前裁剪
            if (tailor && tailor.isBefore) {
                //裁剪，获取裁剪之后宽高
                let { width, height } = this.tailor(instance, tailor, metadata.width, metadata.height)
                //如果缩放存在，使用裁剪之后宽高，进行缩放
                if (resize) this.resize(instance, resize, width, height)
            }
            //如果裁剪存在，且为缩放之后裁剪
            else if (tailor && !tailor.isBefore) {
                //如果缩放存在
                if (resize) {
                    //先缩放，获取缩放后宽高
                    let { width, height } = this.resize(instance, resize, metadata.width, metadata.height)
                    //使用缩放后宽高进行裁剪
                    this.tailor(instance, tailor, width, height)
                } else {
                    //缩放不存在，直接使用原图大小进行裁剪
                    this.tailor(instance, tailor, metadata.width, metadata.height)
                }
            }
            //如果裁剪不存在
            else {
                //如果缩放存在
                if (resize) {
                    //直接使用原图大小缩放
                    let { width, height } = this.resize(instance, resize, metadata.width, metadata.height)
                }
            }
            this.watermark(instance, watermark)
            if (rotate) this.rotate(instance, rotate)
            if (roundrect) this.roundrect(instance, roundrect)
            if (blur) this.blur(instance, blur)
            if (sharpen) this.sharpen(instance, sharpen)
            if (format) this.format(instance, format, lossless)
            if (strip) this.strip(instance, strip)
            if (quality || progressive) this.output(instance, quality, progressive)
            return await instance.toBuffer()
        } catch (err) {
            data.code = 404
            data.message = err.toString()
            return null
        }
    }

    resize(instance: SharpInstance, resize: Resize, preWidth: number, preHeight: number): any {
        //获取参数
        let { mode, data } = resize
        //声明resize方法的参数
        let width, height
        //等比缩放
        if (mode == 'scale') {
            if (data.scale && Number.isInteger(data.scale) && data.scale >= 1 && data.scale <= 1000) {
                //等比缩放直接用原宽高乘以比例
                width = preWidth * data.scale / 100
                height = preHeight * data.scale / 100
            }
            else {
                throw new Error('缩放比例错误')
            }
        }
        //只缩放宽度
        else if (mode == 'wscale') {
            if (data.wscale && Number.isInteger(data.wscale) && data.wscale >= 1 && data.wscale <= 1000) {
                //只缩放宽度，给原宽度乘以比例
                width = preWidth * data.wscale / 100
                height = preHeight
            } else {
                throw new Error('宽度缩放比例错误')
            }
        }
        //只缩放高度
        else if (mode == 'hscale') {
            if (data.hscale && Number.isInteger(data.hscale) && data.hscale >= 1 && data.hscale <= 1000) {
                //只缩放高度，给高度乘以比例
                width = width
                height = preHeight * data.hscale / 100
            } else {
                throw new Error('高度缩放比例错误')
            }
        }
        //指定宽高缩放
        else if (mode == 'both') {
            if (data.width && Number.isInteger(data.width) && data.height && Number.isInteger(data.height)) {
                //指定宽高缩放，直接使用参数中宽高
                width = data.width
                height = data.height
            } else {
                throw new Error('宽高参数错误')
            }
        }
        //指定宽度等比缩放
        else if (mode == 'fw') {
            if (data.width && Number.isInteger(data.width)) {
                //指定宽度等比缩放，宽度为参数值
                width = data.width
                //高度为原高度乘以宽度缩放比
                height = preHeight * data.width / preWidth
            } else {
                throw new Error('宽度参数错误')
            }
        }
        //指定高度等比缩放
        else if (mode == 'fh') {
            if (data.height && Number.isInteger(data.height)) {
                //指定高度等比缩放，高度为参数值
                height = data.height
                //宽度为原宽度乘以高度缩放比
                width = preWidth * data.height / preHeight
            } else {
                throw new Error('高度参数错误')
            }
        }
        //指定像素等比缩放
        else if (mode == 'fp') {
            if (data.pixel && Number.isInteger(data.pixel) && data.pixel >= 1 && data.pixel <= 25000000) {
                //指定像素等比缩放，高度平方乘以宽高比等于像素值
                height = Math.sqrt(data.pixel * preHeight / preWidth)
                //宽高乘积为像素值
                width = data.pixel / height
            } else {
                throw new Error('像素参数不正确')
            }
        }
        //限制宽高最大值，如果宽高都已经小于限制值，那就不变
        //宽高有大于限制值的，按照宽、高中较小缩放比缩放，保证缩放结果宽高都小于限制值
        else if (mode == 'fwfh') {
            if (data.width && Number.isInteger(data.width) && data.height && Number.isInteger(data.height)) {
                //宽高都为参数值，后面要链式使用max函数
                width = data.width
                height = data.height
            } else {
                throw new Error('宽高参数不正确')
            }
        }
        //闲置宽高最小值，如果宽高都已经大于限制值，那就不变
        //宽高有小于限制值的，按照宽、高较大缩放比缩放，保证缩放结果宽高都大于限制值
        else if (mode == 'fwfh2') {
            if (data.width && Number.isInteger(data.width) && data.height && Number.isInteger(data.height)) {
                width = data.width
                height = data.height
            } else {
                throw new Error('宽高参数不正确')
            }
        } else {
            throw new Error('缩放模式不正确')
        }
        //为sharp实例添加缩放处理
        instance.resize(width, height)

        //下面要计算缩放后宽高，以及添加限制函数
        //只有fwfh、fwfh2两个模式要特殊处理
        //当限制宽高最大值时
        if (mode == 'fwfh') {
            instance.max()
            //如果高度大于限制值，宽度小于等于限制值
            if (data.width >= preWidth && data.height < preHeight) {
                //按照高度缩放比缩放
                height = data.height
                width = data.width * data.height / preHeight
            }
            //宽度大于，而高度小于等于时
            else if (data.width < preWidth && data.height >= preHeight) {
                //按照宽度缩放比缩放
                width = data.width
                height = data.height * data.width / preWidth
            }
            //两个都大于时
            else if (data.width < preWidth && data.height < preHeight) {
                //按照较小缩放比缩放
                let wscale = data.width / preWidth
                let hscale = data.height / preHeight
                let scale = wscale < hscale ? wscale : hscale
                width = preWidth * scale
                height = preHeight * scale
            }
            //两个都小于时
            else {
                //宽高为原始值
                width = preWidth
                height = preHeight
            }
        }
        //限制宽高最小值时
        else if (mode == 'fwfh2') {
            instance.min()
            //当宽度大于等于限制值，二高度小于限制值时
            if (data.width <= preWidth && data.height > preHeight) {
                //按照高度缩放比缩放
                height = data.height
                width = data.width * data.height / preHeight
            }
            //当宽度小于限制值，高度大于等于限制值时，按照宽度缩放比缩放
            else if (data.width > preWidth && data.height <= preHeight) {
                width = data.width
                height = data.height * data.width / preWidth
            }
            //当宽、高都小于限制值时
            else if (data.width > preWidth && data.height > preHeight) {
                //按照较大缩放比缩放
                let wscale = data.width / preWidth
                let hscale = data.height / preHeight
                let scale = wscale > hscale ? wscale : hscale
                width = preWidth * scale
                height = preHeight * scale
            }
            //当宽高都大于限制值时
            else {
                //宽高为原始值
                width = preWidth
                height = preHeight
            }
        }
        //返回缩放后宽高
        return { width, height }
    }

    //裁剪函数
    //裁剪原理：首先选定九宫格方位，然后在不同方位按照宽高选定裁剪区域，九宫格暂定按照三分之一线划分
    //四个角：northwest、southwest、northeast、southeast，宽度、高度都是相对于角点的
    //南北：north、south，高度从顶边、底边开始算，宽度对称于垂直中间线
    //东西：west、east，宽度从左边、右边开始算，高度对称于水平中间线
    //中心：center，宽度、高度分别对称于垂直、水平中间线
    //然后计算偏移，x正向为右、负向为左，y正向为下，负向为上，如果偏移后超出外边界，则自动丢弃
    //在测试中出现了超出内边界出现not found错误的问题，可能是暂时错误，暂时不管
    tailor(instance: SharpInstance, tailor: Tailor, preWidth: number, preHeight: number) {
        //获取参数，根据这些参数计算最后的左偏移、顶偏移、宽高
        let { x, y, gravity } = tailor
        //声明裁剪宽高，初始值为参数值
        let width = tailor.width
        let height = tailor.height
        //声明左偏移，顶部偏移，不能为负
        let left, top
        //方位为西北
        if (gravity === 'northwest') {
            //初始偏移为0、0
            left = 0
            top = 0
        }
        //方位为东北
        else if(gravity === 'northeast'){
            //初始偏移,左偏移为原始宽度减去裁剪宽度
            left = preWidth - width
            top = 0
        }
        //加上x、y
        left+=x
        top+=y
        //如果偏移为负，修改为0,同时修改宽高
        if(left<0){
            width +=left
            left = 0
        }
        if(top<0){
            height += top
            top = 0
        }
        //如果偏移加上宽度大于了原始宽度
        if((left+width)>preWidth){
            width  = preWidth - left
        }
        if((top+height)>preHeight){
            height = preHeight - top
        }

    }
}