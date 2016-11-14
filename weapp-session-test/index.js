const express = require('express');
const weappSession = require('./weappsession');

const app = express();

app.use(weappSession({
    appId: '',      // ΢��С���� APP ID
    appSecret: '',  // ΢��С���� APP Secret

    // ����ѡ��ָ������Щ����²�ʹ�� weapp-session ����
    ignore(req, res) {
        return /^\/static\//.test(req.url);
    }
}));

app.use((req, res) => {
    res.json({
        // �� req �����ֱ��ȡ��΢���û���Ϣ
        wxUserInfo: req.$wxUserInfo
    });
});

// ����ҵ�����
// ...

app.listen(3000);