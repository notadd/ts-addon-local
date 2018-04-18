```
type Query{

    #获取指定空间下所有文件的字段
    #bucketName：空间名
    all(bucketName:String):AllData

}
```
```
#文件信息
type File{

    #id
    id:Int

    #原名
    raw_name:String

    #存储文件名
    name:String

    #文件所属标签数组
    tags:[String]

    #文件扩展名
    type:String

    #文件大小
    size:Int

    #文件密钥
    content_secret:String

    #创建日期
    create_date:String

    #更新日期
    update_date:String

    #访问文件的相对url，与baseUrl拼接即可访问
    url:String

}
```
```
#图片信息
type Image{

    id:Int

    raw_name:String

    name:String

    tags:[String]

    type:String

    size:Int

    create_date:String

    update_date:String

    width:Int

    height:Int

    url:String

}
```
```
#音频信息
type Audio{

    id:Int

    raw_name:String

    name:String

    tags:[String]

    md5:String

    type:String

    size:Int

    create_date:String

    update_date:String

    url:String

}
```
```
#视频信息
type Video{

    id:Int

    raw_name:String

    name:String

    tags:[String]

    type:String

    size:Int

    create_date:String

    update_date:String

    url:String

}
```
```
#文档信息
type Document{

    id:Int

    raw_name:String

    name:String

    tags:[String]

    type:String

    size:Int

    create_date:String

    update_date:String

    url:String

}
```
```
#返回数据
type AllData{

    #错误码
    code:Int

    #错误信息
    message:String

    #访问文件基本url
    baseUrl:String

    #文件信息数组
    files:[File]

    #图片信息数组 
    images:[Image]

    #音频信息数组
    audios:[Audio]

    #视频信息数组
    videos:[Video]

    #文档信息数组
    documents:[Document]
    
}
```