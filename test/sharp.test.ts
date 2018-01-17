import * as sharp from 'sharp'
sharp('../../test.jpeg')
.resize(300, 200)
.toFile('../../resize.jpeg', (err)=>{
  console.log(err)
});

sharp('../../test.jpeg')
.sharpen()
.toFile('../../sharpen.jpeg', (err)=>{
  console.log(err)
})

