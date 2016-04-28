var http = require('http');
var url = require('url');
var util = require('util');

var sdk = require('bce-sdk-js');

var kCredentials = {
    ak: process.env.AK,
    sk: process.env.SK
};

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
        credentials: kCredentials,
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
    var auth = new sdk.Auth(kCredentials.ak, kCredentials.sk);
    policy = new Buffer(policy).toString('base64');
    signature = auth.hash(policy, kCredentials.sk);

    return sdk.Q.resolve({
        accessKey: kCredentials.ak,
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

    var auth = new sdk.Auth(kCredentials.ak, kCredentials.sk);
    var xbceDate = new Date(2016, 3, 23, 10, 30, 30);
    var timestamp = xbceDate.getTime() / 1000;
    signature = auth.generateAuthorization(httpMethod, path, queries, headers, timestamp);

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
}).listen(1337);
console.log('Server running at http://0.0.0.0:1337/');
