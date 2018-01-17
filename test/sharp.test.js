const sharp = require('sharp')
sharp('../../test.jpeg')
.resize(300, 200)
.toFile('resize.jpeg', function(err) {
  console.log(err)
});