```
type Mutation{

    #空间配置字段
    #isPublic：是否是公有空间
    #name    ：空间名，作为存储目录名使用
    #token_expire:只有私有空间才有，token超时，单位秒，不能大于1800
    #token_secret_key:token密钥，用来生成token
    bucket(isPublic:Boolean,name:String,token_expire:Int,token_secret_key:String):ConfigData

}
```
```
#所有配置字段的返回数据
type ConfigData{

    #错误码，200为成功，其他为错误
    code:Int

    #错误信息
    message:String
    
}
```