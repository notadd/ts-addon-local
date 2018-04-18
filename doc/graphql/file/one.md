```
type Query{

    #获取单个文件访问url的字段，注意访问是在浏览器中显示，如果浏览器不支持文件MIME会弹出下载框
    #bucketName：所属空间名
    #name：文件存储名
    #type：文件扩展名
    #imagePostProcessInfo：图片后处理信息，只有访问的文件是图片时有效
    one(bucketName:String,name:String,type:String,imagePostProcessInfo:ImagePostProcessInfo):OneData

}
```
```
#返回数据
type OneData{

    #错误码
    code:Int

    #错误信息
    message:String

    #访问文件的全部url，包含了处理字段串与token
    url:String
    
} 
```