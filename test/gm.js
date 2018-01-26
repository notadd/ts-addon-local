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

let g= gm(p).dissolve(30).write('../../alpha.jpeg',err=>{
    console.log(err)
})
