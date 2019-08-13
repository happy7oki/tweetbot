# tweetbot

- おはよーネタを定期投稿する機能(デフォルト毎朝05:00JST)
- 指定IDに対するリプにオウム返し機能

## 前提条件
- node.jsが実行できる環境
- Twitter投稿用のAPIキーは取得済み

## 環境構築
```
# 必要ライブラリ一式をインストール
npm i

# APIキー設定
vim .env

# 投稿ネタを記述(ネタ,画像ファイル名(任意。コンマ区切りで複数可) ※画像はimages/配下に配置)
vim config/neta.txt
```

## 実行
```
forever start app.js
```

## 補足
```
# 定期実行間隔は「app.js」の以下の部分の記述を変更で可能
new CronJob('0 0 5 * * *', async() => {

変更後は以下でリスタート
forever restart app.js
```
