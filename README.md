# bce-sdk-js samples

## 初始化

运行 sample 代码之前，首先需要修改一下 `config.json`，添加 `ak`, `sk`, `bucket` 的配置：

|*项目*|*默认值*|
|-------|--------|
|port|8800|
|uptoken_url|http://localhost:8801/ack|
|enable_sts|true|
|ak|`<your ak>`|
|sk|`<your sk>`|
|bucket|`<your bos bucket>`|

**安装依赖**

```
npm install
```

**根据配置文件 config.json，自动生成一些代码**

```
npm run prepare
```

## 启动 server

|*类别*|*命令*|
|------|------|
|frontend|node frontend/main.js|
|Node.js backend|cd backend/nodejs; node main.js|
|php backend|cd backend/php; php main.php|
|java backend|cd backend/java; mvn clean install exec:java -Dexec.mainClass=com.baidu.inf.bce.App|

然后在浏览器里面打开 <http://localhost:8800/moe/3in1.html> 即可

## 关于 crossdomain.xml

IE下面跨域请求是通用 moxie.swf 发起的，因此涉及到一些 crossdomain.xml 文件的配置。

|*地址*|*作用*|*状态*|
|------|------|------|
|http://doc.baidubce.com/crossdomain.xml|DocClient.Document.createFromBos()|正常|
|http://vod.baidubce.com/crossdomain.xml|VodClient.Media.apply()|正常|
|http://vod-gfsc6mdbcfkc35xq.bj.bcebos.com/crossdomain.xml|BosClinet.putObject...|**需要初始化**|
|http://`<my-bucket>`.bj.bcebos.com/crossdomain.xml|BosClinet.putObject....|`npm run prepare`自动初始化|
|http://foobar.exp.bcevod.com/crossdomain.xml|Flash播放器|**需要初始化，另外访问权限受到策略组防盗链的影响**|


