/**
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var fs = require('fs');
var path = require('path');
var http = require('http');

var STS = require('bce-sdk-js').STS;
var mime = require('mime');
var config = require('../config');

var server = http.createServer((req, res) => {
  console.log('[%s]: %s', new Date(), req.url);

  var url = req.url.replace(/\?.*/, '');
  if (url === '/get_sts_token') {
    res.writeHead(200, {'content-type': 'text/javascript'});

    if (!config.enable_sts) {
      res.end(`
        var G_ROOT_AK = "${config.ak}";
        var G_AK = "${config.ak}";
        var G_SK = "${config.sk}";
        var G_SESSION_TOKEN = null;
        var G_BUCKET = "${config.bucket}";
        var G_UPTOKEN_URL = "${config.uptoken_url}";
      `);
      return;
    }

    var stsClient = new STS({
      endpoint: 'https://sts.bj.baidubce.com',
      credentials: {
        ak: config.ak,
        sk: config.sk
      }
    });
    var acls = true ? null : {
      accessControlList: [
        {
          service: 'bce:bos',
          resource: [config.bucket + '/*'],
          region: '*',
          effect: 'Allow',
          permission: ['READ', 'WRITE', 'LIST', 'GetObject']
        }
      ]
    };
    stsClient.getSessionToken(60000, acls).then(function (response) {
      res.end(`
        var G_ROOT_AK = "${config.ak}";
        var G_AK = "${response.body.accessKeyId}";
        var G_SK = "${response.body.secretAccessKey}";
        var G_SESSION_TOKEN = "${response.body.sessionToken}";
        var G_BUCKET = "${config.bucket}";
        var G_UPTOKEN_URL = "${config.uptoken_url}";
      `);
    });
  }
  else {
    var file = path.join(__dirname, url);
    if (!fs.existsSync(file)) {
      res.writeHead(404);
      res.end();
    }
    else {
      res.writeHead(200, {
        'content-type': mime.lookup(file)
      });
      fs.createReadStream(file).pipe(res);
    }
  }
});
server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(config.port);
console.log('Node.js ' + process.version + ' Development Server started at ' + new Date());
console.log('Listening on http://localhost:' + config.port);
console.log('Document root is ' + __dirname);
console.log('Press Ctrl-C to quit.');
