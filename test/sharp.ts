import * as sharp from 'sharp'

async function  resize():Promise<void>{
  /* 指定宽高缩放，成功*/
  let result = await sharp('../../test.jpeg')
    .resize(300, 200)
    .toFile('../../resize.jpeg');
    console.log(result)
}

//resize()

function sharpen() {
  /* 锐化，暂时看不出来，图片变大 
     不添加参数时，进行快速温和的锐化
  */
  sharp('../../test.jpeg')
    .sharpen()
    .toFile('../../sharpen.jpeg', (err) => {
      console.log(err)
    })
}

function crop() {
  /* 裁剪，不缩放直接裁剪，大小不变，没效果 */
  sharp('../../test.jpeg')
    //.resize(200, 200)
    .crop(sharp.gravity.southeast)
    .toFile('../../crop.jpeg', (err) => {
      console.log(err)
    })
}

function embed() {
  /* 内嵌，看不出效果 */
  sharp('../../test.jpeg')
    .resize(200, 300)
    .background({ r: 100, g: 100, b: 100, alpha: 0 })
    .embed()
    .toFile('../../embed.jpeg', (err) => {
      console.log(err)
    })
}


function max() {
  /* 等比缩放，resize中的参数为宽高最大值，即缩放后图片要能放进指定宽高的矩形当中，成功 
     如果图片宽高已经小于指定大小，则不变
  */
  sharp('../../test.jpeg')
    .resize(200, 200)
    .max()
    .toFile('../../max.jpeg', (err) => {
      console.log(err)
    })
}

function min() {
  /* 等比缩放，resize中的参数为宽高最小值，即缩放后图片要能包含指定宽高的矩形，成功 
     如果图片宽高已经大于指定大小，不变
  */
  sharp('../../test.jpeg')
    .resize(1200, 1200)
    .min()
    .toFile('../../min.jpeg', (err) => {
      console.log(err)
    })
}


function rotate() {
  /* 旋转测试，旋转参数为角度，只能为90的倍数,都则会报错
  */
  sharp('../../test.jpeg')
    .rotate(90)
    .toFile('../../rotate.jpeg', (err) => {
      console.log(err)
    })
}


function extract() {
  /* 指定左偏移、顶部偏移、图片宽高，来提取图片的一个区域，作用等效为裁剪 */
  sharp('../../test.jpeg')
    .extract({ left: 512, top: 0, width: 512, height: 640 })
    .toFile('../../extract.jpeg', (err) => {
      console.log(err)
    });
}


function flip() {
  /* 翻转图片，即根据中心y轴镜像图片，注意y轴为水平轴*/
  sharp('../../test.jpeg')
    .flip(true)
    .toFile('../../flip.jpeg', (err) => {
      console.log(err)
    });
}


function flop() {
  /* 翻转图片，即根据中心x轴镜像图片，x轴为垂直轴*/
  sharp('../../test.jpeg')
    .flop(true)
    .toFile('../../flop.jpeg', (err) => {
      console.log(err)
    });
}


function blur() {
  /* 高斯模糊，不提供参数时，进行快速轻微的锐化，提供标准差参数可以进行缓慢准确的锐化*/
  sharp('../../test.jpeg')
    .blur(23)
    .toFile('../../blur.jpeg', (err) => {
      console.log(err)
    });
}


function extend() {
  /* 扩展图片边缘，即加上边框*/
  sharp('../../test.jpeg')
    .background({ r: 0, g: 0, b: 0, alpha: 0 })
    .extend({ top: 10, bottom: 20, left: 10, right: 10 })
    .toFile('../../extend.jpeg', (err) => {
      console.log(err)
    });

}

function negate() {
  /* 产生图像的反面，是rgb颜色上的反面*/
  sharp('../../test.jpeg')
    .negate(true)
    .toFile('../../negate.jpeg', (err) => {
      console.log(err)
    });
}


function format() {
  /* 强制转换格式为png*/
  sharp('../../test.jpeg')
    .toFormat('png')
    .toFile('../../test.png', (err) => {
      console.log(err)
    });

  /* 强制转换格式为webp*/
  sharp('../../test.jpeg')
    .toFormat('webp')
    .toFile('../../test.webp', (err) => {
      console.log(err)
    });

  /* 强制转换格式为webp*/
  sharp('../../test.jpeg')
    .toFormat('tiff')
    .toFile('../../test.tiff', (err) => {
      console.log(err)
    });
}

function png() {
  /* 强制转换格式为png*/
  sharp('../../test.jpeg')
    .png({
      progressive: true,
      force: true
    })
    .toFile('../../test1.png', (err) => {
      console.log(err)
    })
}


function webp() {
  sharp('../../test.jpeg')
    .webp({
      force: true,
      lossless: true
    })
    .toFile('../../test1.webp', (err) => {
      console.log(err)
    });
}

function metadata() {
  /*获取图片元数据,主要为宽高格式,不能获取处理之后元数据*/
  sharp('../../test.jpeg')
    //.resize(200,200)
    .metadata()
    .then((metadata) => {
      console.log(metadata)
    })
}
//metadata()

async function overlayWith() {
  /* 添加水印*/
  sharp('../../test.jpeg')
    .overlayWith(await sharp('../../tu/shuiyin.jpeg').toBuffer(), {
      left: 100,
      top: 0,
      raw:{
        width:200,
        height:300,
        channels:1
      }
    })
    .toFile('../../overlay.jpeg', (err) => {
      console.log(err)
    });
}
//overlayWith()
function buffer() {
  /* 测试字节输出*/
  sharp('../../test.jpeg')
    .toBuffer()
    .then((value) => {
      console.log(value.toString('hex'))
    })
}
/* import * as fs from 'fs'
fs.stat('../../test.jpeg',(err,stats)=>{
  console.log(err)
  console.log(stats)
}) */

function extractChannel(){
   /* 添加水印*/
   sharp('../../test.jpeg')
   .extractChannel(2)
   .toFile('../../channel2.jpeg', (err) => {
     console.log(err)
   });
}

function create(){
  sharp({
    create: {
      width: 300,
      height: 200,
      channels: 4,
      background: { r:0, g: 100, b: 0, alpha: 0 }
    }
  }).toFile('../../kb2.png',(err,info)=>{
    console.log(info)
  })
}


async function join(){
  let buffer = await sharp({
    create: {
      width: 500,
      height: 200,
      channels: 4,
      background:  { r:0, g: 100, b: 0, alpha: 0.5 }
    }
  }).toFormat('png').toBuffer()

  sharp('../../1.png').joinChannel(buffer).toFile('../../ch.png',(err,info)=>{
    console.log(err)
    console.log(info)
  })
}

join()