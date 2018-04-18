```
type Mutation{

    #删除文件字段
    #bucketName：所属空间
    #name：文件存储名
    #type：文件扩展名
    deleteFile(bucketName:String,name:String,type:String):DeleteFileData

}
```
```
#返回数据
type DeleteFileData{

    #错误码
    code:Int

    #错误信息
    message:String
    
}
```