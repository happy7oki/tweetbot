const {CronJob} = require('cron');
const twModule = require('./lib/twitter.js');
const COMMON = require('./lib/common.js');
const CONST = require('./lib/const.js');
let tw = new twModule();

new CronJob('0 0 5 * * *', async() => {
  try {
    await tw.readAndSave();
    await tw.new_tweet();
  } catch(e) {
    tw.errorLog(e);
  }
}, null, true);

async function streamOn() {
  // Public APIで取得したTLからアカウントIDを含む文字列を取得する
  await tw.client.stream('statuses/filter', {track : CONST.BOT_ID }, async function(stream) {
    // フィルターされたデータのストリームを受け取り、ツイートのテキストを表示する
    stream.on('data', async function(data) {
      var text = data.text; // ツイートのテキスト
      var textCleaned = '@' + data.user.screen_name + text.replace( /@<アカウントID>/g, "" );
      tw.log(data.id_str);
      await tw.createFav(data.id_str);
      // 相手にオウム返しのリプライを投稿
      await tw.client.post(
        'statuses/update', {status: textCleaned+CONST.KKR, in_reply_to_status_id: data.id_str},
        async function(error, tweet, response) {
          if (error) {
            tw.errorLog(e);
          }
        }
      )
    });
  });
}

streamOn();
