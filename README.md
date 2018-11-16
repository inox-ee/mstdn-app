※このREADMEは[ブログ](http://puyobyee18.hatenablog.com/entry/2018/09/24/113439)と同一のものです

# Electron + ReactでMastodonクライアントを作る

Reactの勉強を始めて早1ヶ月。環境構築やAtomのクラッシュなどの困難を乗り越えた夏休み…

ようやくElectronまでたどり着いたのでMastodonクライアントを作ってみた。

ソースコードは「いまどきのJSプログラマーのためのNode.jsとReactアプリケーション(クジラ飛行船, 2017)」を参考にしています

# 環境

* Windows 10 Home
* Node.js v8.11.1
* React v16.5.2
* electron v3.0.0

# まずはAPIを叩いてみる

## アプリの認証(本来は「認可」というべきらしい。)

[mastodon-api](https://github.com/vanita5/mastodon-api)を用いてMastodonのWeb API利用する。インスタンスは、Pixivが運営する https://pawoo.net にした。

このWeb APIはOAuth2という認証方法(*1)を行うため、以下の手順が必要。
1. アプリをインスタンスに登録
2. ユーザが認証し、アクセストークンを発行
3. アクセストークンを用いてAPIにアクセス

正直mastodon-apiのライブラリがexampleファイルを用意してくれてるので適当にコピペすればおｋ。ということで割愛。

## タイムラインの取得

先ほどのアクセストークンを利用して以下のようなプログラムを書くと簡単にタイムラインを表示できる

```javascript
// MastodonのAPIクライアントの作成
const Mstdn = new Mastodon({
access_token: token,
timeout_ms: 60 * 1000,
api_url: instanceUri + '/api/v1/'
})

// タイムラインの読み込み
Mstdn.get('timelines/public', {})   
.then(res => {
    const data = res.data
    console.log(data)
})
```

ちなみにtimelines/homeにすればホームタイムラインが、timelines/publicにすれば公開タイムラインが表示されます。

## トゥートしてみる

トゥートするのも簡単。そう、mastodon-apiならね。

```js
// MastodonのAPIクライアントの作成
const Mstdn = new Mastodon({
  access_token: token,
  timeout_ms: 60 * 1000,
  api_url: instanceUri + '/api/v1/'
})

// Toot
let message = process.argv[2]
Mstdn.post('statuses',
  {status: message},
  (err, data, res) => {
    if (err) {
      console.error(err)
      return
    }
  })
```

結論：`GET`メソッドと`POST`メソッドが優秀すぎる。

# アプリ成型

## 構成

構成はいたってシンプル。Electronを立ち上げ、アクティブになったらindex.htmlを読み込むだけ。

index.htmlからReactで書いたindex.jsxを呼んであげましょう。

## Electronの立ち上げ

テンプレプログラムそのまま。ちなみに`createWindow()`のなかのprotocolでコロンを書き忘れ、2時間溶かしました。つらい。

```javascript
// Electron
let mainWindow
app.on('ready', createWindow)
app.on('window-all-closed', () => app.quit())
app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

// ウィンドウの作成
function createWindow () {
  mainWindow = new BrowserWindow({width: 600, height: 800})
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}
```

## 表示するページ

Electronから呼ばれるindex.htmlですが、のちのちindex.jsxをwebpackでビルドしてあげるので`./out/index.js`を読み込むようにしてあげましょう。プログラムは割愛。

## メインコンポネント

長すぎるので大幅に割愛してます。

1. constructor()

まずはconstructor。`loadInfo()`内では、前項で取得したアクセストークンを読み込み、APIクライアントを作成。状態(state)にはトゥート内容を格納する`tootdata`と、タイムラインを構築する`timelines`を設定してあげる。

```jsx
constructor(props) {
    super(props)
    this.apiUri = 'https://pawoo.net/api/v1/'
    this.loadInfo()
    this.state = {
        tootdata: '',
        timelines: []
    }
}
```

2. componentWillMount()

そして次にコンポネントがマウントしたときの動作を書いたのですが、`componentWillMount()`ってReact v16.3.0以降は非推奨、v17.0.0から撤廃されるらしいですね…。

> Deprecation warnings will be enabled with a future 16.x release, but the legacy lifecycles will continue to work until version 17.
> Even in version 17, it will still be possible to use them, but they will be aliased with an “UNSAFE_” prefix to indicate that they might cause issues. We have also prepared an automated script to rename them in existing code.
> 
> 出典: [React v16.3.0: New lifecycles and context API
March 29, 2018 by Brian Vaughn](https://reactjs.org/blog/2018/03/29/react-v-16-3.html)

書き終わってからeslintに指摘されて気が付きました。ググってもイマイチ理解できなかったので新しいライフサイクルがどのようになるのか誰か教えて～

ちなみにcomponentWillMount内ではタイムラインを読み込む`loadTimelines()`を30秒に1回リロードしています。

3. handleText(e) & tootFunc(e)

あと必要なのはトゥート処理。これも前項で紹介した`POST`メソッドを使い、「statuses」APIに投稿したのち、テキストボックスとタイムラインを更新してあげればよい。

4. render()

いよいよ描画。アプリの顔を作っていきましょう。

デザインにはあまり凝らなかったので、とりあえずトップに投稿フォーム、その下にタイムラインを表示するという構成に。以下のようにプログラムすれば十分でしょう。タイムライン表示の`renderTimelines()`は後述。

```jsx
render () {
    return (
        <div>
            <div>
                <h1>Mastodon Client</h1>
                <textarea
                value={this.state.tootdata}
                onChange={e => this.handleText(e)} />
                <div>
                <button onClick={e => this.tootFunc(e)}>Toot</button>
                </div>
            </div>
            <div style={{marginTop: 120}}></div>
            {this.renderTimelines()}
        </div>
    )
}
```

5. renderTimelines()

一番難しい、、、というか写経したあとなるほどな～って勉強してた()

タイムラインを構築するコツはmapメソッドを使うところですかね。あと`GET`メソッドで返ってくるHTTPレスポンスはHTMLタグで囲まれています(Reactではエスケープされる)。__これを`dangerouslySetInnerHTML`を利用して直接span要素に指定する__ という発想はなかった。というかそもそもプロパティが全く分からないのも苦労した…。下記参考リンクを見つけなければ迷宮入りしてたよ。(`account`がトゥートした投稿者を表すオブジェクト、`content`がトゥート内容)

というわけでプログラム。

```jsx
renderTimelines () {
    const lines = this.state.timelines.map(e => {
        console.log(e)
        // when boosted
        let memo = null
        if (e.reblog) {
            memo = (<p>{e.account.display_name}さんがブーストしました</p>)
            e = e.reblog
        }
        // content every toot
        return (
        <div key={e.id}>
            <img　src={e.account.avatar} />
            <div>{memo}{e.account.display_name}<span dangerouslySetInnerHTML={{__html: e.content}} /></div>
            <div style={{clear: 'both'}} />
        </div>
        )
    })
    return (
        <div>
            <h2>TimeLines</h2>
            {lines}
        </div>
    )
}
```

むずかしいね

6. css

お好みで。

## アプリの実行

あとはwebpackでビルドして`electron .`で実行してあげるだけ。

以下のように立ち上がったら完成です。


# 参考サイト一覧

API
* http://info-i.net/mastodon-get-timeline (プロパティの解説が充実しているのでかなり参考になった)

OAuth2
* https://qiita.com/TakahikoKawasaki/items/e37caf50776e00e733be

* https://www.slideshare.net/ph1ph2sa25/oauth20-46144252