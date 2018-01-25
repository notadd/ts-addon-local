export interface UploadProcessData{
    code:number
    message:string
    method: string
    url:string
    form: {
      imagePreProcessString?:string
      contentSecret?: string
      tagsString?: string
      bucket_name:string
      fileName:string
      md5:string
    }
}