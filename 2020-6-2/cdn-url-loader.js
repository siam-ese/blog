const { getOptions } = require('loader-utils');
const { validate } = require('schema-utils');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const path = require('path');
const schema = {
  additionalProperties: true,
  properties: {
    min: {
      description: "文件最小限制，小于min的文件不上传服务器，改用fallback方案处理",
      anyOf: [
        {
          type: "number"
        },
        {
          instanceof: "Function"
        }
      ]
    },
    upload: {
      description: "上传文件上服务器的方法，接受一个callback，调用后异步loader就完成了",
      anyOf: [
        {
          instanceof: "Function"
        }
      ]
    },
    fallback: {
      description: "fallback方案的config, 有loader和options两个属性，分配配置fallback方案的loader使用，默认为url-loader",
      anyOf: [
        {
          type: "object"
        },
        {
          instanceof: "Function"
        }
      ]
    }
  }
}



function loader(content) {
  const options = getOptions(this) || {}

  validate(schema, options);

  options.min = options.min || 0
  // content的大小不能小于设定的最小值，且配置有upload方法上传文件
  if (content.length >= options.min && typeof options.upload === 'function') {

    const callback = this.async(); // 调用loader的async,告诉loader runner是异步loader 它会返回一个callback 等同于this.callback

    readFile(this.resourcePath)
      .then(file => {
        const uploadData = {
          file,
          filename: path.basename(this.resourcePath),
          done: (url) => {
            callback(null, options.esModule ? `export default '${url}'` : `module.exports='${url}'`)
          },
        }

        options.upload.call(this, uploadData)
      })


  } else { // 没有的话改fallback方案处理，默认是url-loader
    const { loader = 'url-loader', options: fallbackOptions = {} } = options.fallback || {}

    const urlLoader = require(loader)
    const urlLoaderContext = Object.assign({}, this, {
      query: fallbackOptions
    })

    return urlLoader.call(urlLoaderContext, content)
  }
}

module.exports = loader;
module.exports.raw = true; // raw 为true时，context传入的为二进制格式