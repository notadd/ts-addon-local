type Query{
    #获取所有空间信息的查询字段
    buckets:BucketsData
}

#空间信息类型
type Bucket{
    #空间id，公有为1,私有为2
    id:Int
    #公有为public，私有为private
    public_or_private:String
    #空间名
    name:String
}

#返回数据
type BucketsData{
    #错误码
    code:Int
    #错误信息
    message:String
    #空间信息数组
    buckets:[Bucket]
}