# 天気予報ウェブアプリケーション

ブラウザ上で直接動作する、シンプルでクリーンなレスポンシブ天気予報アプリケーションです。世界中のあらゆる都市の現在の天気情報を取得できます。

## 機能

- 🔍 都市名で天気を検索
- 🌡️ 現在の気温を摂氏で表示
- ☁️ 天気の説明とビジュアルアイコン
- 💧 湿度（パーセンテージ）
- 💨 風速（m/s）
- 🌡️ 体感温度
- 👁️ 視程（キロメートル）
- 📱 あらゆる画面サイズに対応したレスポンシブデザイン
- 🌙 ダークモード対応（システム設定に従う）
- ⚠️ ユーザーフレンドリーなエラーハンドリング

## 前提条件

- モダンなウェブブラウザ（Safari、Chrome、Firefox、Edge）
- OpenWeatherMap APIキー（無料枠あり）

## セットアップ手順

### ステップ1：APIキーを取得する

1. [OpenWeatherMap](https://openweathermap.org/)にアクセス
2. 「Sign In」または「Sign Up」をクリックして無料アカウントを作成
3. サインイン後、プロフィールに移動し「API keys」を選択
4. 新しいAPIキーを生成（または提供されるデフォルトのキーを使用）
5. 注意：新しいAPIキーが有効になるまで数時間かかる場合があります

### ステップ2：アプリケーションを設定する

1. テキストエディタで`script.js`ファイルを開く
2. ファイルの上部付近にある以下の行を見つける：
   ```javascript
   const API_KEY = 'YOUR_API_KEY_HERE';
   ```
3. `YOUR_API_KEY_HERE`を実際のAPIキーに置き換える：
   ```javascript
   const API_KEY = 'your_actual_api_key_here';
   ```
4. ファイルを保存する

### ステップ3：アプリケーションを実行する

**オプション1：ファイルを直接開く**
- `index.html`をダブルクリックしてデフォルトのブラウザで開く
- または`index.html`を右クリックして「プログラムから開く」→ 希望のブラウザを選択

**オプション2：ローカルサーバーを使用する（開発時に推奨）**

Pythonがインストールされている場合：
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

ブラウザで`http://localhost:8000`を開きます。

Node.jsがインストールされている場合：
```bash
# npxを使用（インストール不要）
npx serve

# またはserveをグローバルインストール
npm install -g serve
serve
```

## 使用ガイド

1. **都市を検索する**
   - 検索ボックスに都市名を入力（例：「Tokyo」、「New York」、「London」）
   - Enterキーを押すか「Search」ボタンをクリック

2. **天気情報を見る**
   - 以下を含む現在の天気状況が表示されます：
     - 都市名と国
     - 現在の日時
     - 天気アイコンと説明
     - 気温
     - 湿度、風速、体感温度、視程

3. **エラーハンドリング**
   - 都市が見つからない場合、エラーメッセージが表示されます
   - APIキーが無効な場合、設定を確認するよう促されます
   - ネットワークエラーはユーザーフレンドリーなメッセージで適切に処理されます

## ファイル構造

```
test2/
├── index.html      # アプリケーション構造を持つメインHTMLファイル
├── styles.css      # ユーザーインターフェース用のCSSスタイル
├── script.js       # 天気データの取得と表示を行うJavaScriptロジック
└── README.md       # このドキュメントファイル
```

## ブラウザ互換性

以下のブラウザでテスト済み・動作確認済み：
- Safari（macOS）
- Google Chrome
- Mozilla Firefox
- Microsoft Edge

## API情報

このアプリケーションは[OpenWeatherMap Current Weather Data API](https://openweathermap.org/current)を使用しています。

**無料枠の制限：**
- 1分あたり60回のリクエスト
- 1ヶ月あたり1,000,000回のリクエスト

## トラブルシューティング

### 「Invalid API key」エラー
- `YOUR_API_KEY_HERE`を実際のAPIキーに置き換えたか確認してください
- 新しいAPIキーは有効になるまで最大2時間かかる場合があります
- OpenWeatherMapアカウントでAPIキーが正しいか確認してください

### 「City not found」エラー
- 都市名のスペルを確認してください
- 「City, Country Code」形式を試してください（例：「Paris, FR」）
- 小さな都市はデータベースに含まれていない場合があります

### 天気アイコンが読み込まれない
- インターネット接続を確認してください
- アイコンはOpenWeatherMapのサーバーから読み込まれます

### アプリケーションが読み込まれない
- すべてのファイル（index.html、styles.css、script.js）が同じディレクトリにあることを確認してください
- ブラウザの開発者コンソール（F12）を開いてエラーを確認してください

## ライセンス

このプロジェクトはオープンソースであり、個人および教育目的で使用できます。

## 謝辞

- 天気データ提供：[OpenWeatherMap](https://openweathermap.org/)
- 天気アイコン提供：OpenWeatherMap
