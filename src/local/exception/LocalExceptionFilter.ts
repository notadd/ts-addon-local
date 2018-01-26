
import { ExceptionFilter, Catch } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
const graphql= require('graphql')

/*错误码表
  400：缺少参数、参数不正确
  401：指定空间不存在
  402：请求解析错误
  403：上传文件名不符
  404：文件不存在于磁盘上
  405：JSON解析错误
  406：数据库操作错误
  407：文件写入磁盘错误
  408：图片处理信息错误
  409：上传文件md5校验失败 
  410：获取文件状态错误
  411: 访问私有空间文件需要token
  412：token验证错误
  413：token超时
*/
@Catch(HttpException,graphql.GraphQLError)
export class LocalExceptionFilter implements ExceptionFilter {

  catch(exception: HttpException, response) {
    console.log('接收到异常：')
    console.log(exception)
    let status = exception.getStatus()
    let message = exception.getResponse()

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