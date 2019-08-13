const fs = require("fs");
const path = require('path');
const twitter = require('twitter');

const dbModule = require('./db.js');
const Log = require('./log.js');
const CONST = require('./const.js');
const COMMON = require('./common.js');

require('dotenv').config();

class Twitter extends Log{
  constructor () {
    super();
    this.db = new dbModule();
    this.client = new twitter({
      consumer_key: process.env.CONSUMER_KEY,
      consumer_secret:  process.env.CONSUMER_SECRET,
      access_token_key: process.env.ACCESS_TOKEN_KEY,
      access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    });
  }
  async readAndSave() {
    this.log('readAndSave start');
    let array = fs.readFileSync(path.join(__dirname, '../config/neta.txt'), 'utf8').toString().split(/\r\n|\n|\r/).filter(v => v);
    console.log('array.length='+(array.length));
    let dbAllText = await COMMON.promise(this.db.selectAllTweet, null);
    for (let dbText of dbAllText) {
      if (array.indexOf(dbText["text"]) === -1) {
        await COMMON.promise(this.db.delete, dbText["text"]);
      }
    }
    for (let text of array) {
      let split = text.split(',');
      let neta = split.shift(); // 先頭のみ取得
      let imgPaths = (split.length > 0) ? split.join(',') : null;
      let state = await COMMON.promise(this.db.isNewOrChanged, neta, imgPaths);
      if (CONST.STATE.IS_NOT_CHANGED !== state) { // 変更あればUPSERT
        await COMMON.promise(this.db.upSert, neta, imgPaths);
      }
      if (array[(array.length-1)] === neta) {
        this.log('readAndSave end');
      }
    };
  }
  async new_tweet() {
    this.log('new_tweet start');
    let row = await COMMON.promise(this.db.selectOneTweet, null);
    let text = row["text"];
    let imgPaths = (row["imgPaths"]) ? row["imgPaths"].split(',') : null;
    let cnt = row["cnt"];
    await this.post_tweet(CONST.PRE_OHA+text, imgPaths, cnt);
    await COMMON.promise(this.db.cntUp, text);
    this.log('new_tweet end');
  }
  async post_tweet(text, imgPaths=[], cnt, reply_id="") {
    this.log('post_tweet start='+text);
    let media_ids = (imgPaths) ? await this.post_media(imgPaths) : "";
    let tweetText = (cnt === 0) ? text+CONST.KKR+CONST.LF+CONST.HASH_TAG : text+CONST.KKR;
    let r = await this.client.post('statuses/update', {status: tweetText, media_ids: media_ids, in_reply_to_status_id: reply_id}, function(error, tweet, response){
      if (!error) {
        this.log(tweet);
      }
    });
    this.log('post_tweet end');
  }
  async post_media(imgPaths) {
    this.log('post_media start');
    let media_ids = "";
    for (let imgPath of imgPaths) {
      let f = fs.createReadStream(path.join(__dirname, 'images/',imgPath));
      let file = {media: f};
      let r_media = await this.client.post('media/upload', file);
      media_ids += r_media.media_id_string + ",";
      f.close();
    };
    this.log('post_media end');
    return media_ids;
  }
  async createFav(tweetId) { // ふぁぼる！
    this.log('fav='+tweetId);
    await this.client.post("favorites/create",{"id" : tweetId});
  }
}

module.exports = Twitter;
