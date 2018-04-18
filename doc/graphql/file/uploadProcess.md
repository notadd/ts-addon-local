```
type Mutation{

   #文件上传预处理字段
   #bucketName：所属空间名
   #md5：文件md5值，为了校验文件
   #contentName：文件原名
   #contentSecret：文件密钥
   #tags：文件所属标签数组
   #imagePreProcessInfo：上传预处理信息
   uploadProcess(bucketName:String,md5:String,contentName:String,contentSecret:String,tags:[String]，imagePreProcessInfo:ImagePreProcessInfo):UploadProcessData

}
```
```
#上传时的表单字段类,上传时需要加上file字段
type UploadForm{

    #文件md5
    md5:String

    #空间名
    bucketName:String

    #文件原名
    rawName:String

    #文件密钥
    contentSecret:String

    #标签数组
    tagsString:String

    #图片预处理信息字符串
    imagePreProcessString:String  

}
```
```
#上传预处理返回数据，根据这些数据发起上传请求
type  UploadProcessData{

    #错误码
    code:Int

    #错误信息
    message:String

    #上传url
    url:String

    #上传请求方法
    method:String

    #上传表单数据
    form:UploadForm

}
```