# Geetest-Validator
极验手动验证器

预览地址：[https://guss.gay ](https://s.guss.gay/test)
项目运行端口：12124

## 使用方法

### 1、转短链
``` 
http://域名或ip+端口/shortUrl?gt={{gt}}&challenge={{challenge}}
```
### 2、请求返回的链接

### 3、请求验证回调
``` 
http://域名或ip+端口/callback?gt={{gt}}&challenge={{challenge}}
```
### 4、完成

## 安装方法

1、克隆项目并安装

### gitee
```
git clone --depth=1 https://gitee.com/greatcvs/geetest-validator.git
```
```
git clone --depth=1 git@gitee.com:greatcvs/geetest-validator.git
```
### github
```
git clone --depth=1 https://github.com/greatcvs/geetest-validator.git
```
```
git clone --depth=1 git@github.com:greatcvs/geetest-validator.git
```

2、安装依赖
```
npm install
```
3、运行
```
node app
```
4、后台运行
```
npm start
```

## 致谢
@[geetest-validator  ](https://github.com/Colter23/geetest-validator)

