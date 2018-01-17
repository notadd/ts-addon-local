import * as sharp from 'sharp'

/* 指定宽高缩放，成功*/
sharp('../../test.jpeg')
.resize(300, 200)
.toFile('../../resize.jpeg', (err)=>{
  console.log(err)
});

/* 锐化，暂时看不出来，图片变大 */
sharp('../../test.jpeg')
.sharpen()
.toFile('../../sharpen.jpeg', (err)=>{
  console.log(err)
})

/* 裁剪，不缩放直接裁剪，大小不变，没效果 */
sharp('../../test.jpeg')
//.resize(200, 200)
.crop(sharp.gravity.southeast)
.toFile('../../crop.jpeg', (err)=>{
  console.log(err)
})

/* 内嵌，看不出效果 */
sharp('../../test.jpeg')
.resize(200, 300)
.background({r: 100, g: 100, b: 100, alpha: 0})
.embed()
.toFile('../../embed.jpeg', (err)=>{
  console.log(err)
})

/* 等比缩放，resize中的参数为宽高最大值，即缩放后图片要能放进指定宽高的矩形当中，成功 
   如果图片宽高已经小于指定大小，则不变
*/
sharp('../../test.jpeg')
.resize(200, 200)
.max()
.toFile('../../max.jpeg', (err)=>{
  console.log(err)
})

/* 等比缩放，resize中的参数为宽高最小值，即缩放后图片要能包含指定宽高的矩形，成功 
   如果图片宽高已经大于指定大小，不变
*/
sharp('../../test.jpeg')
.resize(1200, 1200)
.min()
.toFile('../../min.jpeg', (err)=>{
  console.log(err)
})