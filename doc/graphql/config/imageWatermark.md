```
type Mutation{

    #图片水印配置字段
    #name：水印图片名称
    #base64：水印图片base64编码
    #gravity：图片加水印的方位，九宫格枚举之一
    #opacity：水印透明度1-100
    #x：水印图片横轴偏移
    #y：水印图片纵轴偏移
    #ws：水印图片与原图的短边自适应比例
    imageWatermark(name:String,base64:String,gravity:Gravity,opacity:Int,x:Int,y:Int,ws:Int):ConfigData

}
```
```
#水印方位枚举，九宫格
enum Gravity {

  #西北
  northwest
  
  #北
  north
  
  #东北
  northeast
  
  #西
  west
  
  #中心
  center
  
  #东
  east

  #西南
  southwest
  
  #南
  south
  
  #东南
  southeast
  
}
```