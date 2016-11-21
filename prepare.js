/**
 * @file prepare.js.js
 * @author leeight
 *
 * 根据 config.json 生成不同 backend 的配置文件
 */

var fs = require('fs');
var path = require('path');

var config = require('./config');

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
}

toPHPConfig('backend/php/Config.php');
toJavaConfig('backend/java/src/main/java/com/baidu/inf/bce/Config.java');

