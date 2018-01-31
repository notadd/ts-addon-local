type Mutation{
    #视频保存格式配置字段
    #format：视频编码格式枚举之一
    #resolution：视频分辨率枚举之一
    videoFormat(format:VideoFormat,resolution:VideoResolution):ConfigData
}

#视频编码格式枚举
enum VideoFormat {
  raw
  vp9
  h264
  h265
}

#视频分辨率枚举，p1080代表通常意义上的1080p
enum VideoResolution {
  raw
  p1080
  p720
  p480
}