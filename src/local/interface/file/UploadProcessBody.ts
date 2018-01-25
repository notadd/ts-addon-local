import { ImagePreProcessInfo } from './ImageProcessInfo'

export interface UploadProcessBody {
    bucket_name: string
    md5: string
    contentName: string
    contentSecret?: string
    tags?: string[]
    imagePreProcessInfo?: ImagePreProcessInfo
}