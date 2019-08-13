require('date-utils');
const sqlite = require('sqlite3').verbose();
const CONST = require('./const.js');
const db = new sqlite.Database('db.sqlite');
const dt = new Date();

class Db{
  constructor() {
    this.init();
  }
  init() {
    db.serialize(function() {
      // テーブルがなければ作成
      db.run('CREATE TABLE IF NOT EXISTS tweet(text TEXT primary key, cnt INTEGER, imgPaths TEXT, time TEXT)', (error, row) => {
        if (error) {
          console.log(error);
        }
      });
    });
  }
  async select(resolve, reject, text) {
    db.serialize(async function() {
      db.all('SELECT * FROM tweet', (error, row) => {
        if (error) {
          return reject(error);
        }
        return resolve(row);
      });
    });
  }
  async upSert(resolve, reject, text, imgPaths) {
    db.serialize(async function() {
      let stmt = null;
      if (imgPaths) { // 画像がある場合
        stmt = db.prepare('REPLACE INTO tweet (text, cnt, imgPaths, time) VALUES(?, ifnull((select cnt from tweet where text = ?),0), ?, datetime("now", "localtime"))');
        stmt.run([text, text, imgPaths], (error, row) => {
          if (error) {
            return reject(error);
          }
          return resolve(row);
        });
      } else {
        stmt = db.prepare('REPLACE INTO tweet (text, cnt, time) VALUES(?, ifnull((select cnt from tweet where text = ?),0), datetime("now", "localtime"))');
        stmt.run([text, text], (error, row) => {
          if (error) {
            return reject(error);
          }
          return resolve(row);
        });
      }
      stmt.finalize();
    });
  }
  async delete(resolve, reject, text) {
    db.serialize(async function() {
      // プリペアードステートメントでデータセレクト
      let stmt = db.prepare('DELETE FROM tweet where text = ?');
      stmt.run([text], (error, row) => {
        if (error) {
          return reject(error);
        }
        return resolve();
      });
      stmt.finalize();
    });
  }
  async selectOneTweet(resolve, reject, text) {
    db.serialize(async function() {
      db.each('SELECT * FROM tweet where cnt = (select min(cnt) from tweet) ORDER BY RANDOM()', (error, row) => {
        if (error) {
          return reject(error);
        }
        return resolve(row);
      });
    });
  }
  async selectAllTweet(resolve, reject, text) {
    db.serialize(async function() {
      db.all('SELECT text FROM tweet', (error, row) => {
        if (error) {
          return reject(error);
        }
        return resolve(row);
      });
    });
  }
  async cntUp(resolve, reject, text) {
    db.serialize(async function() {
      let stmt = db.prepare('UPDATE tweet SET cnt = cnt+1 where text like ?');
      stmt.run([text], (error, row) => {
        if (error) {
          return reject(error);
        }
        return resolve(row);
      });
      stmt.finalize();
    });
  }
  async isNewOrChanged(resolve, reject, text, imgPaths) {
    db.serialize(async function() {
      let val = CONST.STATE.IS_NEW;
      let stmt = db.prepare('SELECT ifnull(text,count(*)) as text,ifnull(cnt,count(*)) as cnt,imgPaths,ifnull(time,count(*)) as time FROM tweet where text = ?');
      await stmt.each([text], async(error, row) => {
        if (error) {
          return reject(error);
        }
        if (row["time"] === 0) {
          return resolve(val); // 存在しない場合⇛NEW
        }
        let dbText = row["text"];
        let dbimgPaths = row["imgPaths"];
        if (text !== dbText || imgPaths !== dbimgPaths) {
          val = CONST.STATE.IS_CHANGED;
        } else {
          val = CONST.STATE.IS_NOT_CHANGED;
        }
        return resolve(val);
      });
      stmt.finalize();
    });
  }
  async close(resolve, reject, text) {
    db.close((error, row) => {
      if (error) {
        return reject(error);
      }
      return resolve(true);
    });
  }
}

module.exports = Db;
