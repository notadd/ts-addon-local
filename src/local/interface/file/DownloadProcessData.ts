export interface DownloadProcessData{
    code:number
    message:string
    method:string
    headers: {
        bucket_name:string
        fileName:string
    }
    url:string
}