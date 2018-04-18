```
StoreComponent是本地存储模块提供的供其他模块使用的存储组件，可以通过以下方式注入这个组件：
```
```
@Inject("StoreComponentToken") private readonly storeComponent: StoreComponent
```
```
这个组件与又拍云模块中StoreComponent是可以互相替代的，注入的token同为StoreComponentToken，其方法参数、返回值都是一样的
```
```
本地存储中StoreComponent组件方法为：
```
```
upload(bucketName: string, rawName: string, base64: string, imagePreProcessInfo: ImagePreProcessInfo): Promise<{ bucketName: string, name: string, type: string }>
上传指定文件到本地存储，参数为空间名、文件原名、文件base64编码、图片预处理信息，返回存储文件名、类型
```
```
delete(bucketName: string, name: string, type: string): Promise<void>
删除指定文件，会将数据库与磁盘内容一并删除
```
```
getUrl(req: any, bucketName: string, name: string, type: string, imagePostProcessInfo: ImagePostProcessInfo): Promise<string>
获取带有后处理字符串的访问url
```
