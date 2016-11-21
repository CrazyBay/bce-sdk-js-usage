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

var AK = G_AK;
var SK = G_SK;
var SESSION_TOKEN = G_SESSION_TOKEN;
var VOD_ENDPOINT = getQuery('vod.endpoint', 'http://vod.baidubce.com');

var vod = new baidubce.sdk.VodClient.Player({
  endpoint: VOD_ENDPOINT,
  credentials: {ak: AK, sk: SK},
  sessionToken: SESSION_TOKEN
});


var mediaId = getQuery('id');
if (!mediaId) {
  alert('No mediaId found.');
}
else {
  vod.setMediaId(mediaId).code({width: 800, height: 500, autostart: true, ak: AK}).then(function (response) {
    var codes = response.body.codes;
    var codesMap = {};
    for (var i = 0; i < codes.length; i++) {
      codesMap[codes[i].codeType] = codes[i].sourceCode;
    }

    if (!codesMap['file'] || !codesMap['cover']) {
      $('#player').html('file or cover is undefined.');
      return;
    }

    cyberplayer('player').setup({
        width: 800,
        height: 500,
        file: codesMap['file'],
        image: codesMap['cover'],
        autostart: true,
        stretching: "uniform",
        repeat: false,
        volume: 100,
        controls: true,
        ak: AK
    });
  });
}










/* vim: set ts=4 sw=4 sts=4 tw=120: */
