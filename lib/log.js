var path = require('path');
var log4js = require('log4js');

log4js.configure(require(path.join(__dirname, '../config/log4js.json')), { reloadSecs: 300 });

class Log {
  constructor(logLevel) {
    this.logLevel = logLevel ? logLevel : 'system';
    // 出力するカテゴリの指定
    this.logger = log4js.getLogger(this.logLevel);
  }

  log(msg) {
    this.logger.info(msg);
  }

  retLog(msg) {
    this.logger.info(msg);
    return msg;
  }

  errorLog(msg) {
    this.logger.error(msg);
  }
}

module.exports = Log;
