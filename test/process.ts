import { ImageProcessUtil } from '../src/local/util/ImageProcessUtil'
import { ImagePostProcessInfo } from '../src/local/interface/file/ImageProcessInfo'
import { KindUtil } from '../src/local/util/KindUtil'
import { buckets } from './bucket'
let process = new ImageProcessUtil(new KindUtil)
let info:ImagePostProcessInfo = {
    resize:{
        mode:'scale',
        data:{
            scale:40
        }
    }
}
process.processAndStore({code:200,data:''},'../../test.jpeg',buckets[1],info)