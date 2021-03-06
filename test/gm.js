var spawn = require('child_process').spawn;
const gm = require('gm').subClass({
    imageMagick: true
});
const ori = require('gm')
const path = require('path')
const fs = require('fs')


let p  = path.resolve(__dirname,'../../','test.jpeg')

/* gm缩放，直接指定宽高，缩放模式为等比缩放，最后结果的宽高不大于指定宽高
let g= gm(p).resize(100,200).write('../../resize.jpeg',err=>{
    console.log(err)
}) */

/* gm水印，可以通过composite方法添加两张水印图片，通过链式调用设置水印位置、水印透明度，但是还不知道偏移如何设置
 let g= gm(p).composite('../../tu/shuiyin.jpeg').gravity('SouthEast').dissolve(30).write('../../composite.jpeg',err=>{
    console.log(err)
}) */
const sharp = require('sharp')
async function create(){
    //let buffer = await sharp('../../tu/shuiyin.jpeg').resize(300,200).toBuffer()
    //fs.writeFileSync('../../shuiyin.jpeg',buffer)
    let g= gm('../../kb2.png').composite('../../shuiyin.jpeg')
    .gravity('Center')
    .geometry('+0+0')
    //.page()
    .dissolve(30)
    //.geometry(1024,640)
    //.watermark(10)
    //.resize(100,100)
    //.rotate(90)
    //.size(100,err=>{})
    .write('../../com.jpeg',function (err){
        console.log(err)
    })
}
function format(){
    gm('../../test.jpeg').write('../../test.png',function (err){
        console.log(err)
    })
}


function png32(){
    gm('../../test.png').define('png:format=png32').write('../../test32.png',err=>{
        console.log(err)
    })
}
//png32()
//console.log( gm('../../test.png').define('png:format','png32'))

function alpha(){
    gm('../../test32.png').channel('alpha')
    //.fx('0.5')
    .write('../../alpha.png',function (err){
        console.log(err)
    })
}
//alpha()

function  rotate(){
    gm('../../test.jpeg').rotate('black',30).write('../../rotate.jpeg',err=>{
        console.log(err)
    })
}
rotate()