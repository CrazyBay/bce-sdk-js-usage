/**
 * @file prepare.js.js
 * @author leeight
 *
 * 根据 config.json 生成不同 backend 的配置文件
 */

var fs = require('fs');
var path = require('path');

var u = require('underscore');
var sdk = require('bce-sdk-js');
var config = require('./config');

var DEFAULT_CORS_CONFIG = {
    allowedOrigins: ['http://*', 'https://*'],
    allowedMethods: ['GET', 'HEAD', 'POST', 'PUT'],
    allowedHeaders: ['*'],
    allowedExposeHeaders: [
      'ETag',
      'x-bce-request-id',
      'x-bce-next-append-offset',
      'x-bce-object-type'
    ],
    maxAgeSeconds: 1800
};

/**
 * 从 config.json 生成 PHP 的配置文件
 *
 * @param {string} dest PHP Config class
 */
function toPHPConfig(dest) {
    var code = [
        '<?php',
        'class Config {'
    ];
    for (var key in config) {
        if (config.hasOwnProperty(key)) {
            var value = config[key];
            if (typeof value === 'string') {
                value = JSON.stringify(value);
            }
            code.push('    const ' + key + ' = ' + value + ';');
        }
    }
    code.push('}\n');
    fs.writeFileSync(path.join(__dirname, dest), code.join('\n'));
    console.log('Generated %s', dest);
}

function getJavaType(value) {
    switch (typeof value) {
        case 'number':
            if (value % 1 === 0) {
                return 'int';
            }
            return 'float';
        case 'string':
            return 'String';
        case 'boolean':
            return 'boolean';
        default:
            throw new Error('unsupported type');
    }
}

/**
 * 从 config.json 生成 java 的配置文件
 *
 * @param {string} dest Java Config class
 */
function toJavaConfig(dest) {
    var code = [
        'package com.baidu.inf.bce;',
        '',
        'public class Config {',
    ];
    for (var key in config) {
        if (!config.hasOwnProperty(key)) {
            continue;
        }
        var value = config[key];
        var type = getJavaType(value);
        if (type === 'String') {
            value = JSON.stringify(value);
        }
        code.push('    public static final ' + type + ' ' + key + ' = ' + value + ';');
    }
    code.push('}\n');
    fs.writeFileSync(path.join(__dirname, dest), code.join('\n'));
    console.log('Generated %s', dest);
}

/**
 * 往 bucket 中上传一个 crossdomain.xml 文件，在 IE 下面，使用 moxie.swf 上传文件的时候，
 * 需要这个 crossdomain.xml 文件，角色类似 CORS 的配置
 *
 * @param {string} bucket The bucket name.
 */
function uploadCrossDomainXml(bucket) {
    var xbos = new sdk.BosClient({
        endpoint: 'https://bj.bcebos.com',
        credentials: {
            ak: config.ak,
            sk: config.sk
        }
    });

    xbos.setBucketCannedAcl(bucket, 'public-read')
        .then(function () {
            console.log('Set public-read to bos://%s', bucket);
            var file = path.join(__dirname, 'crossdomain.xml');
            return xbos.putObjectFromFile(bucket, 'crossdomain.xml', file);
        })
        .then(function () {
            console.log('crossdomain.xml to bos://%s/crossdomain.xml', bucket);
        })
        .catch(function (error) {
            console.error(error);
        });
}

/**
 * 自动给 bucket 添加 cors 的配置
 *
 * @param {string} bucket The bucket name.
 */
function prepareCorsConfig(bucket) {
    var xbos = new sdk.BosClient({
        endpoint: 'https://bj.bcebos.com',
        credentials: {
            ak: config.ak,
            sk: config.sk
        }
    });
    var options = {
        bucketName: bucket,
        params: {
            cors: ''
        }
    };
    xbos.sendRequest('GET', options)
        .then(function (response) {
            var corsConfiguration = (response.body.corsConfiguration || []);
            var found = u.find(corsConfiguration, item => u.isEqual(item, DEFAULT_CORS_CONFIG));
            if (!found) {
                corsConfiguration.push(DEFAULT_CORS_CONFIG);
                return xbos.sendRequest('PUT', u.extend({
                    body: JSON.stringify({
                        corsConfiguration: corsConfiguration
                    })
                }, options));
            }
        })
        .then(function () {
            console.log('Add cors config to bos://%s', bucket);
        })
        .catch(function (error) {
            console.error(error);
        });
}

toPHPConfig('backend/php/Config.php');
toJavaConfig('backend/java/src/main/java/com/baidu/inf/bce/Config.java');
uploadCrossDomainXml(config.bucket);
prepareCorsConfig(config.bucket);
