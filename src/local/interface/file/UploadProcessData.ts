export interface UploadProcessData{
    code:number
    message:string
    method: string
    url:string
    form: {
      imagePreProcessString:string
      contentSecret: string
      tagsString: string
      md5:string
    }
}