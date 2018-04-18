```
type Mutation{

    #视频保存格式配置字段
    videoFormat(format:VideoFormat,resolution:VideoResolution):ConfigData

}
```
```
#视频编码格式枚举
enum VideoFormat {

  #保存为上传格式
  raw

  vp9

  h264

  h265

}
```
```
#视频分辨率枚举，p1080代表通常意义上的1080p
enum VideoResolution {

  #保存为上传分辨率
  raw

  #1080p
  p1080

  #720p
  p720

  #480p
  p480

}
```