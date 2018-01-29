import { Component, HttpException } from '@nestjs/common';
import * as fs from 'fs'

/* 异步操作文件的封装工具类 */
@Component()
export class FileUtil {

    constructor() { }

    async write(path: string, buffer: Buffer) {
        let ex: HttpException
        await new Promise((resolver, reject) => {
            fs.writeFile(path, buffer, (err) => {
                if (err) {
                    reject(new HttpException('文件写入磁盘错误:' + err.toString(), 407))
                }
                resolver()
            })
        }).catch(err => {
            ex = err
        })
        if (ex) {
            throw ex
        }
    }

    async deleteIfExist(path:string){
        
    }

} 