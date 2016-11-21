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

## 运行 Node.js 的例子
## 启动 server

|*类别*|*命令*|
|------|------|
|frontend|node frontend/main.js|
|Node.js backend|cd backend/nodejs; node main.js|
|php backend|cd backend/php; php main.php|
|java backend|cd backend/java; mvn clean install exec:java -Dexec.mainClass=com.baidu.inf.bce.App|

然后在浏览器里面打开 <http://localhost:8800/moe/3in1.html> 即可


