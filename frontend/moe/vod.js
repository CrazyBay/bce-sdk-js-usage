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

function toUrl(object) {
  var url = [
    BOS_ENDPOINT,
    BOS_BUCKET,
    encodeURIComponent(object).replace(/%2F/gi, '/')
  ].join('/');
  return url;
}

var AK = getQuery('ak', 'afe4759592064eee930682e399249aba');
var SK = getQuery('sk', '7785ea912b06449f8cbd084998a1e400');
var VOD_ENDPOINT = getQuery('vod.endpoint', 'http://vod.baidubce.com');
var BOS_ENDPOINT = getQuery('bos.endpoint', 'http://bj.bcebos.com');
var BOS_BUCKET = getQuery('bos.bucket', 'vod-gauddsywyhn713kc');

var CHUNK_SIZE = '5m';

var vod = new baidubce.sdk.VodClient({
  endpoint: VOD_ENDPOINT,
  credentials: {ak: AK, sk: SK}
});

function getVodKey(file) {
  var localKey = [AK, file.name, file.size, CHUNK_SIZE].join('&');
  var localValue = localStorage.getItem(localKey);
  if (!localValue) {
    return vod.buildRequest('POST', null, 'apply').then(function (response) {
      var mediaId = response.body.mediaId;
      var bucket = response.body.sourceBucket;
      var key = response.body.sourceKey;
      localStorage.setItem(localKey, JSON.stringify(response.body));
      file.__mediaId = mediaId;
      return {
        bucket: bucket,
        key: key
      };
    })['catch'](function (error) {
      uploader._invoke('Error', [error, uploader._currentFile]);
      uploader._uploadNext();
      throw error;
    });
  }
  else {
    localValue = JSON.parse(localValue);
    file.__mediaId = localValue.mediaId;
    return {
      bucket: localValue.sourceBucket,
      key: localValue.sourceKey
    };
  }
}

var uploader = new baidubce.bos.Uploader({
  browse_button: '#file',
  multi_selection: true,
  bos_bucket: BOS_BUCKET,
  bos_endpoint: BOS_ENDPOINT,
  bos_ak: AK,
  bos_sk: SK,
  max_file_size: '1Gb',
  chunk_size: CHUNK_SIZE,
  dir_selection: false,
  flash_swf_url: '../bower_components/moxie/bin/flash/Moxie.swf',
  init: {
    FilesFilter: function (_, files) {
      // 添加更多的过滤规则，比如文件大小之类的
    },
    FilesAdded: function (_, files) {
      FilesAdded(_, files);
    },
    BeforeUpload: function (_, file) {
      file.__startTime = new Date().getTime();
      var row = getRowById(file.__id);
      row.setStatus('circle-arrow-up');
    },
    UploadProgress: function (_, file, progress, event) {
      var row = getRowById(file.__id);
      row.setProgress(progress);
    },
    Key: function (_, file) {
      return getVodKey(file);
    },
    FileUploaded: function (_, file, info) {
      var time = ((new Date().getTime() - file.__startTime) / 1000).toFixed(2);
      var row = getRowById(file.__id);
      var url = toUrl(info.body.object);
      row.setStatus('ok-circle', true);
      row.setUrl(url);
      row.setTime(time);

      var localKey = [AK, file.name, file.size, CHUNK_SIZE].join('&');
      localStorage.removeItem(localKey);

      vod._internalCreateMediaResource(file.__mediaId, file.name, '测试文件')
          .then(function () {
              row.setMediaId(file.__mediaId);
          });
    },
    NetworkSpeed: function (_, bytes, time, pendings) {
      var speed = bytes / (time / 1000);
      var html = '上传速度：' + humanize.filesize(speed) + '/s';
      var seconds = pendings / speed;
      if (seconds > 1) {
        var dhms = baidubce.utils.toDHMS(Math.ceil(seconds));
        html += '，剩余时间：' + [
          humanize.pad(dhms.HH, 2, '0'),
          humanize.pad(dhms.MM, 2, '0'),
          humanize.pad(dhms.SS, 2, '0')
        ].join(':');
      }

      $('.network-speed').html(html);
    },
    UploadComplete: function () {
      $('button[type=submit]').attr('disabled', true);
    },
    Error: function (_, error, file) {
      var row = getRowById(file.__id);
      if (error.status_code === 0) {
        row.setStatus('pause', true);
      }
      else {
        row.setStatus('remove-circle', false);
        var errorMessage = $.isPlainObject(error) ? JSON.stringify(error) : String(error);
        row.setErrorMessage(errorMessage);
      }
    }
  }
});

$('table#vods').on('click', 'a[data-cmd]', function () {
  var link = $(this);
  var mediaId = link.data('vod-id');
  var cmd = link.data('cmd');
  if (cmd === 'DELETE') {
    link.text('删除中...');
    var row = $(this).parents('tr');
    vod.deleteMediaResource(mediaId)
      .then(function () {
        row.remove();
      })
      .catch(function (error) {
        alert(String(error));
        link.text('删除');
      });
  }
  return false;
});

$('#view-all').click(function () {
  var btn = $(this);
  btn.text('努力加载中...').attr('disabled', true);

  var options = {
    params: {
      pageNo: 1,
      pageSize: 10,
      status: 'PUBLISHED'
    }
  };
  vod.listMediaResources(options).then(function (response) {
    var medias = response.body.media;
    var html = [];
    for (var i = 0; i < medias.length; i++) {
      var item = medias[i];
      var title = item.attributes.title || '-';
      if (item.status === 'PUBLISHED') {
        title = '<a target="_blank" href="vod-viewer.html?id=' + item.mediaId +
          '&title=' + encodeURIComponent(title) + '">' + title + '</a>'
      }
      html.push(
        '<tr>'
        + '<td>' + (i + 1) + '</td>'
        + '<td class="doc-name">' + (title) + '</td>'
        + '<td>' + humanize.filesize(item.meta.sizeInBytes) + '</td>'
        + '<td>' + item.meta.durationInSeconds + '</td>'
        + '<td>' + (item.status) + '</td>'
        + '<td>' + (item.createTime) + '</td>'
        + '<td>' + (item.publishTime || '-') + '</td>'
        + '<td><a data-cmd="DELETE" data-vod-id="' + item.mediaId + '" href="javascript:void(0)">删除</a></td>'
        + '</tr>'
      );
    }
    $('table#vods tbody').html(html.join(''));
  }).fin(function () {
    btn.text('查看视频列表').attr('disabled', false);
  });
  return false;
});

$('button[type=submit]').click(function () {
  uploader.start();
  return false;
});

if (getQuery('admin') == '1' && uploader._xhr2Supported) {
    $('[hidden]').removeAttr('hidden');
}





/* vim: set ts=4 sw=4 sts=4 tw=120: */
