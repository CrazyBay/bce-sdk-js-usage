/**
 * @file backend/nodejs/main.js
 * @author leeight
 */

var http = require('http');
var url = require('url');
var util = require('util');

var sdk = require('bce-sdk-js');
var config = require('../../config');

function safeParse(text) {
    try {
        return JSON.parse(text);
    }
    catch (ex) {
        return null;
    }
}

function buildStsResponse(sts) {
    var stsClient = new sdk.STS({
        credentials: {
            ak: config.ak,
            sk: config.sk
        },
        region: 'bj'
    });
    return stsClient.getSessionToken(60 * 60 * 24, safeParse(sts)).then(function (response) {
        var body = response.body;
        return {
            AccessKeyId: body.accessKeyId,
            SecretAccessKey: body.secretAccessKey,
            SessionToken: body.sessionToken,
            Expiration: body.expiration
        };
    });
}

function buildPolicyResponse(policy) {
    var auth = new sdk.Auth(config.ak, config.sk);
    policy = new Buffer(policy).toString('base64');
    var signature = auth.hash(policy, config.sk);

    return sdk.Q.resolve({
        accessKey: config.ak,
        policy: policy,
        signature: signature
    });
}

function buildNormalResponse(query) {
    if (!(query.httpMethod && query.path && query.queries && query.headers)) {
        return sdk.Q.resolve({statusCode: 403});
    }

    if (query.httpMethod === 'DELETE') {
        // 只允许 PUT/POST/GET Method
        return sdk.Q.resolve({statusCode: 403});
    }

    var httpMethod = query.httpMethod;
    var path = query.path;
    var queries = safeParse(query.queries) || {};
    var headers = safeParse(query.headers) || {};

    var auth = new sdk.Auth(config.ak, config.sk);
    var xbceDate = new Date();
    var timestamp = xbceDate.getTime() / 1000;
    var signature = auth.generateAuthorization(httpMethod, path, queries, headers, timestamp);

    return sdk.Q.resolve({
        statusCode: 200,
        signature: signature,
        xbceDate: xbceDate.toISOString().replace(/\.\d+Z$/, 'Z')
    });
}

http.createServer(function (req, res) {
    console.log(req.url);

    var query = url.parse(req.url, true).query;

    var promise = null;
    if (query.sts) {
        promise = buildStsResponse(query.sts);
    }
    else if (query.policy) {
        promise = buildPolicyResponse(query.policy);
    }
    else {
        promise = buildNormalResponse(query);
    }

    promise.then(function (payload) {
        res.writeHead(200, {
            'Content-Type': 'text/javascript; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        });

        if (query.callback) {
            res.end(util.format('%s(%s)', query.callback, JSON.stringify(payload)));
        }
        else {
            res.end(JSON.stringify(payload));
        }
    });
}).listen(config.port + 1);
console.log('Node.js ' + process.version + ' Development Server started at ' + new Date());
console.log('Listening on http://0.0.0.0:' + (config.port + 1) + '/');
console.log('Press Ctrl-C to quit.');
