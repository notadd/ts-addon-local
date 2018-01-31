#缩放数据
input ResizeData{
    #等比缩放比例
    scale:Int
    #宽度缩放比例
    wscale:Int
    #高度缩放比例
    hscale:Int
    #宽度
    width:Int
    #高度
    height:Int
    #像素
    pixel:Int
}

#缩放模式枚举
enum ResizeMode{
    #等比缩放
    scale
    #宽度缩放，高度不变
    wscale
    #高度缩放，宽度不变
    hscale
    #指定宽高缩放
    both
    #指定宽度等比缩放
    fw
    #指定高度等比缩放
    fh
    #指定像素等比缩放
    fp
    #指定宽高最大值等比缩放
    fwfh
    #指定宽高最小值等比缩放
    fwfh2
}

#缩放信息
input Resize{
    #缩放模式
    mode:ResizeMode
    #缩放数据
    data:ResizeData
}

#裁剪信息
input Tailor{
    #是否在缩放之前裁剪
    isBefore:Boolean
    #裁剪图片宽度
    width:Int
    #裁剪图片高度
    height:Int
    #裁剪图片横轴偏移
    x:Int
    #纵轴偏移
    y:Int
    #裁剪图片方位，九宫格枚举之一
    gravity:Gravity
}

#模糊信息
input Blur{
    #模糊半径，为了与又拍云统一，sharp库不支持这个参数，这里设置了也没用
    redius:Int
    #模糊标准差，10以及很模糊了
    sigma:Int
}


#图片上传预处理信息，图片上传时除了要进行预处理还要根据保存格式保存
#只包含缩放、裁剪、水印、旋转四种处理
input ImagePreProcessInfo{
    #缩放
    resize:Resize
    #裁剪
    tailor:Tailor
    #是否进行水印，这个指定了上传时是否加水印
    watermark:Boolean
    #旋转，角度
    rotate:Int
}

#获取图片访问url时后处理信息，包含了所有处理模式
input ImagePostProcessInfo{
    #缩放
    resize:Resize
    #裁剪
    tailor:Tailor
    #水印，这个水印可以覆盖默认的水印启用配置
    watermark:Boolean
    #旋转
    rotate:Int
    #模糊
    blur:Blur
    #锐化
    sharpen:Boolean
    #输出格式
    format:String
    #是否无损输出，只有webp支持这个参数
    lossless:Boolean
    #图片质量
    quality:Int
    #渐进显示
    progressive:Boolean
    #去除元数据
    strip:Boolean
}