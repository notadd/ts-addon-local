export interface  BucketConfig{
    isPublic:boolean
    directory:string
    token_expire?:number
    token_secret_key?:string
}