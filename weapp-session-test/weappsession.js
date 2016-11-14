const co = require('co');
const merge = require('merge');
const config = require('./config');
const { headers, errors } = require('./constants');
const makeStore = require('./lib/makeStore');
const sha1 = require('./lib/sha1');
const wrapError = require('./lib/wrapError');
const jscode2session = require('./lib/jscode2session');
var http = require('http');
var querystring = require('querystring');
var ip='lualu.carp.mopaasapp.com';

let store;

const handler = co.wrap(function *(req, res, next) {
    req.$wxUserInfo = null;

    if (config.ignore(req, res)) {
        return next();
    }

    let code = String(req.header(headers.WX_CODE) || '');
    let rawData = String(req.header(headers.WX_RAW_DATA) || '');
    let signature = String(req.header(headers.WX_SIGNATURE) || '');

    let wxUserInfo, sessionKey, openId;

    // 1、`code` not passed
    if (!code) {
        return next();
    }

    // 2、`rawData` not passed
    if (!rawData) {
        try {
			//XXX:change1
			var data1 = querystring.stringify({
				id:code
			});
			var options = {
				host: ip,
				path:'services/getUser.php',
				method: 'POST'
			};
			var req = http.request(options, function(res) {
				res.setEncoding('utf8');
				res.on('data', function (chunk) {
					wxUserInfo= chunk;
				});
			});
			req.write(data1);
			req.end();
            //wxUserInfo = yield store.get(code);
        } catch (error) {
            return next(error);
        }
		

        if (!wxUserInfo) {
            let error = new Error('`wxUserInfo` not found by `code`');
            return res.json(wrapError(error, { reason: errors.ERR_SESSION_EXPIRED }));
        }

        req.$wxUserInfo = wxUserInfo;
        return next();
    }

    // 3、both `code` and `rawData` passed

    try {
        rawData = decodeURIComponent(rawData);
        wxUserInfo = JSON.parse(rawData);
    } catch (error) {
        return res.json(wrapError(error));
    }

    if (config.ignoreSignature === true) {
        openId = ('PSEUDO_OPENID_' + sha1(wxUserInfo.avatarUrl)).slice(0, 28);
    } else {
        try {
            ({ sessionKey, openId } = yield jscode2session.exchange(code));
        } catch (error) {
            return res.json(wrapError(error, { reason: errors.ERR_SESSION_KEY_EXCHANGE_FAILED }));
        }

        // check signature
        if (sha1(rawData + sessionKey) !== signature) {
            let error = new Error('untrusted raw data');
            return res.json(wrapError(error, { reason: errors.ERR_UNTRUSTED_RAW_DATA }));
        }
    }

    try {
        wxUserInfo.openId = openId;
		////XXX:change2 read oldCode
		var data2 = querystring.stringify({
			id:code
		});
		var options = {	
			host: ip,
			path:'/callme/index.cfm/userService/command/getAuthenticode/',
			method: 'POST'
		};
		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				let oldCode= chunk;
			});
		});
		req.write(data2);
		req.end();
        //let oldCode = yield store.get(openId);
        //oldCode && (yield store.del(oldCode));
		////XXX:change3 save code table
        var data3 = querystring.stringify({
			id:code
		});
		var options = {	
			host: ip,
			path:'/callme/index.cfm/userService/command/getAuthenticode/',
			method: 'POST'
		};
		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
			});
		});
		req.write(data3);
		req.end();
		
		////XXX:change4 save openid table
		var data4 = querystring.stringify({
			id:code
		});
		var options = {	
			host: ip,
			path:'/callme/index.cfm/userService/command/getAuthenticode/',
			method: 'POST'
		};
		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
			});
		});
		req.write(data4);
		req.end();
		//yield store.set(code, wxUserInfo, config.redisConfig.ttl);
        //yield store.set(openId, code, config.redisConfig.ttl);

        req.$wxUserInfo = wxUserInfo;
        return next();

    } catch (error) {
        return next(error);
    }

});

module.exports = (options = {}) => {
    if (!store) {
        merge.recursive(config, options);
        store = makeStore(config.redisConfig);
        return handler;
    }

    throw new Error('weapp-session can only be called once.');
};