// Web API経由でアプリのサーバ登録
const Mastodon = require('mastodon-api')
// APIのたたき方→https://github.com/vanita5/mastodon-api
const fs = require('fs')
const path = require('path')

const instanceUri = 'https://pawoo.net' // mixi公式インスタンス
const clientName = 'MastodonApp'
const saveFile = path.join(__dirname, 'cli-app.json')

// Web APIの呼び出し
Mastodon.createOAuthApp(instanceUri+'/api/v1/apps', clientName)
  .catch(err => console.error(err))
  .then(res => {
    console.log(res)
    fs.writeFileSync(saveFile, JSON.stringify(res))
  })
