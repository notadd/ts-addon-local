```
type Mutation{

    #音频保存格式配置字段
    audioFormat(format:AudioFormat):ConfigData

}
```
```
#音频保存格式的枚举
enum AudioFormat {

  #保存为原始格式
  raw

  #mp3格式
  mp3

  #aac格式
  aac

}
```