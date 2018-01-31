type Mutation{
    #启用图片水印的字段，设置true为启用，启用之后访问图片默认加上水印，可以通过获取url时设置覆盖
    #enable是否启用，boolean值
    enableImageWatermark(enable:Boolean!):ConfigData
}