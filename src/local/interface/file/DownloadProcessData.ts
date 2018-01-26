export interface DownloadProcessData{
    code:number
    message:string
    method:string
    headers: {
        bucket_name:string
        file_name:string
    }
    url:string
}