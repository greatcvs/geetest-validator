window.onload = function () {
    const wait = document.querySelector("#wait")
    const genBtn = document.querySelector("#gen")
    const successBtn = document.querySelector("#success")
    const resultBox = document.querySelector("#result")
    const resultBtn = document.querySelector("#result-btn")
    const toastBox = document.querySelector(".toast-box")

    const gtInput = document.querySelector("#gt")
    const challengeInput = document.querySelector("#challenge")
    const validateInput = document.querySelector("#validate")
    const seccodeInput = document.querySelector("#seccode")

    class GeeTest {
        constructor(gt, challenge) {
            this.gt = gt;
            this.challenge = challenge;
        }

        init(now = false) {
            initGeetest({
                gt: this.gt,
                challenge: this.challenge,
                offline: false,
                new_captcha: true,

                product: now ? "bind" : "popup",
                width: "100%",
            }, function (captchaObj) {
                if (now) setTimeout(() => {
                    hide(wait);
                    captchaObj.verify();
                }, Math.floor(Math.random() * 2000) + 1000);
                else captchaObj.appendTo("#captcha");

                captchaObj.onReady(() => {
                    if (!now) hide(wait);
                }).onSuccess(() => {
                    showToastBox("验证成功，正在发送请求，请稍等。。。",60000);
                    console.log("验证成功");

                    if (now) {
                        hide(wait);
                        show(successBtn);
                    }
                    const result = captchaObj.getValidate();
                    console.log("result",result)

                    validateInput.value = result.geetest_validate;
                    seccodeInput.value = result.geetest_seccode;
                    // show(resultBox)
                    sendValidate(result.geetest_validate, result.geetest_seccode);
                }).onError(err => {
                    console.log("验证失败");
                    console.log(err);
                    let msgErr = err.msg
                    if (msgErr === 'old challenge') {
                        msgErr = '该链接已被点击，请重新发起验证！'
                    }else {
                        msgErr = '验证失败 '+err.msg
                    }
                    showToastBox(msgErr, 3000);
                    if (now) {
                        hide(wait);
                        show(genBtn);
                    }
                });
            });
        }
    }
    let timer = null
    function showToastBox(text, timeout = 2000) {
        toastBox.innerHTML = text;
        toastBox.style.opacity = 1;
        toastBox.style.top = '50px';
        if (timer != null) clearTimeout(timer)
        timer = setTimeout(() => {
            toastBox.style.top = '-30px';
            toastBox.style.opacity = 0;
        }, timeout)
    }


    genBtn.onclick = () => {
        let gt = gtInput.value;
        let challenge = challengeInput.value;
        if (gt === undefined || gt === '' || challenge === undefined || challenge === '') {
            console.log("gt 和 challenge 不能为空");
            showToastBox("gt 和 challenge 不能为空", 3000);
            return;
        }
        if (gt.length !== 32 || challenge.length !== 32) {
            console.log("gt 或 challenge 长度错误");
            showToastBox("gt 或 challenge 长度错误", 3000);
            return;
        }

        hide(genBtn);
        show(wait);

        new GeeTest(gt, challenge).init(true);
    }

    const search = location.search;

    if (search !== '') {
        hide(genBtn);
        show(wait);

        let gt = '';
        let challenge = '';

        const arr = search.substring(1).split("&");
        for (const i in arr) {
            const t = arr[i].split("=");
            switch (t[0]) {
                case "gt": gt = t[1]; break;
                case "challenge": challenge = t[1]; break;
                default: break;
            }
        }
        if (gt !== '' && challenge !== '') {
            gtInput.value = gt;
            challengeInput.value = challenge;
            new GeeTest(gt, challenge).init();
            // showToastBox("点击下方按钮开始验证",30000);
        }else {
            console.log("未从URL中找到 gt 与 challenge");
            hide(wait);
            show(genBtn);
        }
    }

    resultBtn.onclick = () => {
        const text = "validate="+validateInput.value+"&seccode="+seccodeInput.value
        const clipboard = navigator.clipboard
        if (clipboard === undefined) {
            const el = document.createElement('input');
            el.setAttribute('value', text);
            document.body.appendChild(el);
            el.select();
            const res = document.execCommand('copy');
            document.body.removeChild(el);
            showToastBox(res? "复制成功" : "复制失败");
        } else clipboard.writeText(text).then(() => {
            console.log("复制成功");
            showToastBox("复制成功");
        }, err => {
            console.log("复制失败");
            console.log(err);
            showToastBox("复制失败");
        });

    }


    function hide(el) {
        el.classList.add("hide")
    }

    function show(el) {
        el.classList.remove("hide")
    }

    //验证成功发送到sendValidate 接口
    function sendValidate(validate){
        //js 发送请求
        const gt=gtInput.value;
        const challenge=challengeInput.value;
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/sendValidate', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send('gt='+gt+'&challenge='+challenge+'&validate='+validate);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const res = JSON.parse(xhr.responseText);
                console.log(res)
                if(res.code === 0){
                    showToastBox("验证成功，可以关闭页面了",60000);
                    // //自动关闭页面
                    // setTimeout(function(){
                    //     window.close();
                    //     //qq里面关闭页面
                    //     if (navigator.userAgent.indexOf("QQ/") > 0) {
                    //         window.open('about:blank', '_self').close();
                    //     }
                    // },3000)
                    //验证成功
                }else{
                    showToastBox("验证失败",3000);
                    //验证失败
                }
            }
        }


    }
}
