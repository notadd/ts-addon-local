```
type Mutation{

    #图片保存格式配置字段，决定了上传图片在服务器的保存格式
    imageFormat(format:ImageFormat!):ConfigData

}
```
```
#图片保存格式枚举
enum ImageFormat {

  #保存为原图
  raw

  #保存为webp有损 
  webp_damage

  #保存为webp无损
  webp_undamage

}
```