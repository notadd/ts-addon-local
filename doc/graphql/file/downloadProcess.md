```
type Query{

  #下载文件预处理字段
  #bucketName：所属空间名
  #name：文件存储名
  #type：文件扩展名
  downloadProcess(bucketName:String,name:String,type:String):DownloadProcessData

}
```
```
#返回数据
type DownloadProcessData{

   #错误码
   code:Int

   #错误信息
   message:String

   #下载请求方法
   method:String

   #下载请求url
   url:String

   #下载请求头信息，与又拍云统一，把参数放到头信息中去
   headers:DownloadHeaders

}
```
```
#下载请求头
type DownloadHeaders{

    #空间名
    bucketName:String

    #文件全名，包含扩展名
    fileName:String
    
}
```