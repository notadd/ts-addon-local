
import { ExceptionFilter, Catch } from '@nestjs/common';
import { HttpException } from '@nestjs/common';

/*错误码表
  400：缺少参数、参数不正确
  401：指定空间不存在
  402：请求解析错误
  403：上传文件名不符
  404：文件不存在于磁盘上
  405：文件读、写磁盘错误
  406：文件删除错误
  407：获取文件状态错误、创建目录错误
  408：图片处理信息错误
  409：JSON解析错误
  410：数据库操作错误
  411：上传文件名、文件md5校验失败 
  412: 访问私有空间文件需要token
  413：token验证错误
  414：token超时
  500：意外错误，即未预料出现错误
*/
@Catch(HttpException)
export class LocalExceptionFilter implements ExceptionFilter {

  catch(exception: HttpException, response) {
    let status = exception.getStatus()
    let message = exception.getResponse()
    console.log(exception)
    response
      .status(status)
      .json({
        code: status,
        message: message
      }); 
   /*  return {
      code : exception.getStatus(),
      message: exception.getResponse()
    } */
  }
}