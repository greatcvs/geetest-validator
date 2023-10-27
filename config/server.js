const fs = require('fs');
const express = require("express")
const bodyParser = require('body-parser');
const app = express()
//axios
const axios = require('axios')
//moment
const moment=require('moment')
const Uuid = require('uuid');

app.use(bodyParser.urlencoded({extended: true, limit: "200mb", parameterLimit: 500000}))
//静态资源 /public
app.use("/public",express.static('public'))
//跨域
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
const host = process.env.HOST
function logs(msg,req=null,isEed=false){
    let consoleMsg = moment().format('YYYY-MM-DD HH:mm:ss') + " " + msg
    if (req){
        try {
            let ip = req.headers['x-forwarded-for']|| req.headers['x-real-ip'] || req.connection.remoteAddress|| req.socket.remoteAddress || req.connection.socket.remoteAddress|| req.ip || req.ips[0]|| '未知Ip'
            //去掉::ffff:
            ip = ip.replace('::ffff:', '')
            //判断host是否包含ip
            if (host.length > 0 && host.includes(ip)) {
                return
            }
            //统一长度255.255.255.255
            ip = ip.padEnd(12, ' ')
            //获取url
            let url = req.originalUrl
            url=url.replace(/\?.*/,'')

            const endMsg=isEed?"返回结果":"请求参数"
            msg="\n"+endMsg+":"+String(msg)
            // console.log(msg)
            consoleMsg =moment().format('YYYY-MM-DD HH:mm:ss') + " " + ip + " "+ url +msg
        }catch (error) {
            console.log(error)
        }
        //获取请求ip
    }
    console.log(consoleMsg)
}


//定义map 现在100个 用于存储gt和challenge 对应的validate, 并且设置过期时间
const map = new Map()
// 短链Map
const shortMap = new Map()
//设置过期时间
const expireTime = 1000 * 60 * 5
//定时清除过期的数据
setInterval(() => {
    const now = Date.now()
    map.forEach((value, key) => {
        if (now - value.time > expireTime) {
            map.delete(key)
            logs("删除过期数据"+key)
        }
    })

    shortMap.forEach((value, key) => {
        if (now - value.time > expireTime) {
            shortMap.delete(key)
            logs("删除过期数据"+key)
        }
    })

}, 1000 * 60)


//geetest 验证 参数（gt，challenge）
app.get('/geetest', (req, res) => {
    let retData = {
        code: 0,
        msg: "success",
        data: {}
    }
    if (req.query){
        logs(JSON.stringify(req.query),req,false)
    }
    const gt = req?.query?.gt
    const challenge= req?.query?.challenge
    if (!gt || !challenge) {
        retData.code =-1
        retData.msg = "gt 或 challenge 不能为空"
        res.send(retData)
        return
    }

    if (gt.length !== 32 || challenge.length !== 32) {
        retData.code =-1
        retData.msg = "gt 或 challenge 长度错误"
        res.send(retData)
        return
    }

    //转发的index.html
    const html = fs.readFileSync('./views/index.html', 'utf-8')
    res.type('html')
    res.send(html)
})

//接受geetest 验证 validate
app.post('/sendValidate', (req, res) => {
    let retData = {
        code: 0,
        msg: "success",
        data: {}
    }
    if (req.body){
        logs(JSON.stringify(req.body),req,false)
    }
    const gt = req?.body?.gt
    const challenge = req?.body?.challenge
    const validate = req?.body?.validate
    if (!gt || !challenge || !validate) {
        retData.code = -1
        retData.msg = "gt 或 challenge 或 validate 不能为空"
        logs(JSON.stringify(retData),req,true)
        res.send(retData)
        return
    }

    if (gt.length !== 32 || challenge.length !== 32) {
        retData.code = -1
        retData.msg = "gt 或 challenge 长度错误"
        logs(JSON.stringify(retData),req,true)
        res.send(retData)
        return
    }
    if (map.size > 100) {
        //清除最早的数据
        let minTime = Date.now()
        let minKey = ''
        map.forEach((value, key) => {
            if (value.time < minTime) {
                minTime = value.time
                minKey = key
            }
        })
        map.delete(minKey)
    }
    //存储到map中
    map.set(gt + challenge, {validate, time: Date.now()})
    logs(JSON.stringify(retData),req,true)
    res.send(retData)
})
app.get('/test', (req, res) => {
    let urlList = [
        'https://www.geetest.com/demo/gt/register-fullpage?t=',
        'https://www.geetest.com/demo/gt/register-phrase?t=',
        'https://account.geetest.com/api/captchademo?captcha_type=slide',
        'https://www.geetest.com/demo/gt/register-slide-official?t=',
        'https://www.geetest.com/demo/gt/register-click-official?t=',
        'https://www.geetest.com/demo/gt/register-icon?t=',
        'https://www.geetest.com/api/user/show/register-space?t=',
        'https://account.geetest.com/api/captchademo?captcha_type=click:icon-l1-zh',
        'https://account.geetest.com/api/captchademo?captcha_type=click:nine-l1-en',
        'https://account.geetest.com/api/captchademo?captcha_type=click:nine-l1-zh'
    ]
    let url = urlList[Math.floor(Math.random() * urlList.length)]
    if (url.indexOf('t=') > -1) {
        url = url + 't=' + Date.now()
    }
    axios.get(url).then((response) => {
        const gt = response?.data?.gt|| response?.data?.data?.gt
        const challenge = response?.data?.challenge|| response?.data?.data?.challenge
        if (!gt || !challenge) {
            res.send(response.data)
            return
        }
        logs(JSON.stringify(response.data),req,true)
        //获取短链
        axios.get(`http://${req.headers.host }/shortUrl?gt=${gt}&challenge=${challenge}`).then((response) => {
            const shortUrl = response?.data?.data?.shortUrl
            if (!shortUrl) {
                res.send(response.data)
                return
            }
            res.redirect(shortUrl)
        }).catch((error) => {
            res.redirect('/geetest?gt=' + gt + '&challenge=' + challenge)
        })
    }).catch((error) => {
        console.log(error)
        res.send(error)
    })
});
//callback
app.get('/callback', (req, res) => {
    let retData = {
        code: 0,
        msg: "success",
        data: {}
    }
    const gt = req?.query?.gt
    const challenge = req?.query?.challenge
    if (!gt || !challenge ) {
        retData.code = -1
        retData.msg = "gt 或 challenge 不能为空"
        logs(JSON.stringify(retData),req,true)
        res.send(retData)
        return
    }
    if (gt.length !== 32 || challenge.length !== 32) {
        retData.code = -1
        retData.msg = "gt 或 challenge 长度错误"
        logs( JSON.stringify(retData),req,true)
        res.send(retData)
        return
    }
    //从map中获取validate
    const validateObj = map.get(gt + challenge)
    if (!validateObj) {
        retData.code = -1
        retData.msg = "validate 不存在"
        res.send(retData)
        return
    }
    retData.data = {
        validate: validateObj.validate
    }
    logs(JSON.stringify(retData),req,true)
    // console.log(moment().format('YYYY-MM-DD HH:mm:ss'),"callback返回结果", JSON.stringify(retData))
    res.send(retData)
})

//长链转短链
app.get('/shortUrl', async (req, res) => {
    let retData = {
        code: 0,
        msg: "success",
        data: {}
    }
    if (req.query){
        logs(JSON.stringify(req.query),req)
    }
    const gt = req?.query?.gt
    const challenge = req?.query?.challenge
    if (!gt || !challenge ) {
        retData.code = -1
        retData.msg = "gt 或 challenge 不能为空"
        logs(JSON.stringify(retData),req,true)
        res.send(retData)
        return
    }

    if (gt.length !== 32 || challenge.length !== 32) {
        retData.code = -1
        retData.msg = "gt 或 challenge 长度错误"
        logs(JSON.stringify(retData),req,true)
        res.send(retData)
        return
    }
    let num = 0
    while (true) {
        // 生成5位随机uuid
        const uuid = Uuid.v4().replace(/-/g, '').substring(0, 5)
        if (!shortMap.has(uuid)) {
            shortMap.set(uuid, {
                gt: gt,
                challenge: challenge,
                time: Date.now()
            })
            retData.data = {
                shortUrl: 'http://'+req.headers.host + '/x/' + uuid
            }
            logs(JSON.stringify(retData),req,true)
            res.send(retData)
            return
        }else {
            num++
        }
        if(num>10){
            retData.code = -1
            retData.msg = "生成短链失败"
            logs( JSON.stringify(retData),req,true)
            res.send(retData)
            return
        }
    }
})

//防止域名误触
app.get('/x/:uuid', async (req, res) => {
    let retData = {
        code: 0,
        msg: "success",
        data: {}
    }
    if (req.params){
        logs(JSON.stringify(req.params),req)
        // console.log(moment().format('YYYY-MM-DD HH:mm:ss'),"sendValidate请求参数", JSON.stringify(req.body))
    }
    const uuid = req?.params?.uuid
    if (!uuid||!shortMap.get(uuid)) {
        retData.code = -1
        retData.msg = "短链不存在"
        logs(JSON.stringify(retData),req,true)
        // console.log(moment().format('YYYY-MM-DD HH:mm:ss'),"callback返回结果", JSON.stringify(retData))
        res.send(retData)
        return
    }
    //转发的index.html
    const html = fs.readFileSync('./views/link.html', 'utf-8')
    res.type('html')
    res.send(html)
})

//短链跳转
app.get('/s/:uuid', async (req, res) => {
    let retData = {
        code: 0,
        msg: "success",
        data: {}
    }
    if (req.params){
        logs(JSON.stringify(req.params),req)
        // console.log(moment().format('YYYY-MM-DD HH:mm:ss'),"sendValidate请求参数", JSON.stringify(req.body))
    }
    const uuid = req?.params?.uuid
    if (!uuid||!shortMap.get(uuid)) {
        retData.code = -1
        retData.msg = "短链不存在"
        logs(JSON.stringify(retData),req,true)
        // console.log(moment().format('YYYY-MM-DD HH:mm:ss'),"callback返回结果", JSON.stringify(retData))
        res.send(retData)
        return
    }
    const gt = shortMap.get(uuid).gt
    const challenge = shortMap.get(uuid).challenge
    res.redirect('/geetest?gt=' + gt + '&challenge=' + challenge)
})

//全部放进来
app.get('/*', (req, res) => {
    const host=req.headers.host
    const ipWithPortRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:\d+)?$/;
    if (host?.length > 0 && !ipWithPortRegex.test(host)) {
        const domain = host.split('.').slice(-2).join('.')
        res.redirect('http://'+domain)
    }else {
        res.redirect("https://www.geetest.com/show")
    }
});

const port = process.env.PORT || 12124;
app.listen(port, function () {
    // logs("监听端口12124成功....")
    logs("监听端口"+port+"成功....")
    //打印链接地址
    console.log(`http://127.0.0.1:${port}/test`)
})
