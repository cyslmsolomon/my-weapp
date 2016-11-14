const express = require('express');
const weappSession = require('./weappsession');

const app = express();

app.use(weappSession({
    appId: '',      // 微信小程序 APP ID
    appSecret: '',  // 微信小程序 APP Secret

    // （可选）指定在哪些情况下不使用 weapp-session 处理
    ignore(req, res) {
        return /^\/static\//.test(req.url);
    }
}));

app.use((req, res) => {
    res.json({
        // 在 req 里可以直接取到微信用户信息
        wxUserInfo: req.$wxUserInfo
    });
});

// 其它业务代码
// ...

app.listen(3000);