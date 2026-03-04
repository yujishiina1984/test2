# 天気予報ウェブアプリケーション 設計書

## 1. 概要

本ドキュメントは、天気予報ウェブアプリケーションのシステム設計について記述する。本アプリケーションは、OpenWeatherMap APIを利用して世界中の都市の現在の天気情報を取得・表示するWebアプリケーションである。

ローカル実行版（スタンドアロン）とAWSクラウドデプロイ版の2つの構成をサポートする。

---

## 2. システムアーキテクチャ

### 2.1 全体構成

本システムは以下の2つのデプロイ形態を持つ。

#### ローカル版（スタンドアロン）

```
┌─────────────┐          ┌─────────────────────┐
│   ブラウザ    │─────────▶│   OpenWeatherMap    │
│  (ユーザー)   │◀─────────│   API (外部)        │
└─────────────┘          └─────────────────────┘
      │
      ▼
┌─────────────┐
│ ローカルファイル │
│ (HTML/CSS/JS) │
└─────────────┘
```

- ブラウザからOpenWeatherMap APIに直接リクエストを送信する
- APIキーはフロントエンドのJavaScriptに埋め込む

#### AWS版（クラウドデプロイ）

```
┌─────────────┐     ┌─────────────────┐     ┌───────────────┐     ┌─────────────────┐
│   ブラウザ    │────▶│   Amazon S3     │     │  API Gateway  │────▶│  AWS Lambda     │
│  (ユーザー)   │◀────│ (静的ファイル)    │     │  (REST API)   │◀────│  (Node.js)      │
└─────────────┘     └─────────────────┘     └───────────────┘     └─────────────────┘
       │                                            ▲                      │
       └────────────────────────────────────────────┘                      │
                     APIリクエスト                                           ▼
                                                              ┌─────────────────────┐
                                                              │   OpenWeatherMap    │
                                                              │   API (外部)        │
                                                              └─────────────────────┘
```

- フロントエンドはS3で静的ウェブサイトとしてホスティング
- API GatewayとLambdaを経由してOpenWeatherMap APIにアクセス
- APIキーはLambda環境変数として安全に管理

---

## 3. ディレクトリ構成

```
test2/
├── index.html                          # ローカル版 メインHTMLファイル
├── styles.css                          # ローカル版 CSSスタイル
├── script.js                           # ローカル版 JavaScriptロジック
├── README.md                           # プロジェクトドキュメント
├── design.md                           # 本設計書
└── aws/                                # AWSデプロイ用ディレクトリ
    ├── README.md                       # AWSデプロイガイド
    ├── architecture.drawio             # アーキテクチャ図（Draw.io形式）
    ├── frontend/                       # AWS版フロントエンド
    │   ├── index.html                  # メインHTMLファイル
    │   ├── styles.css                  # CSSスタイル
    │   └── script.js                   # JavaScriptロジック（API Gateway経由）
    ├── lambda/                         # Lambda関数
    │   └── index.js                    # 天気API プロキシ関数
    └── cloudformation/                  # Infrastructure as Code
        ├── template.yaml               # CloudFormationテンプレート
        └── parameters.example.json     # パラメータテンプレート
```

---

## 4. フロントエンド設計

### 4.1 HTML構造 (`index.html`)

シングルページアプリケーション（SPA）構成で、以下の主要セクションから成る。

| セクション | 要素 | 説明 |
|-----------|------|------|
| ヘッダー | `<header>` | アプリケーションタイトルとサブタイトル |
| 検索セクション | `<form id="search-form">` | 都市名入力フォームと検索ボタン |
| エラーメッセージ | `<div id="error-message">` | エラー表示領域（デフォルト非表示） |
| 天気カード | `<div id="weather-card">` | 天気情報表示カード（デフォルト非表示） |
| ローディング | `<div id="loading">` | 読み込み中スピナー（デフォルト非表示） |
| フッター | `<footer>` | OpenWeatherMap クレジット表示 |

**天気カード内の表示項目：**
- 都市名・国名
- 現在の日時
- 天気アイコン・天気説明
- 気温（摂氏）
- 湿度（%）
- 風速（m/s）
- 体感温度（摂氏）
- 視程（km）

### 4.2 CSSスタイル設計 (`styles.css`)

#### デザインシステム

CSS カスタムプロパティ（変数）を使用したテーマシステムを採用。

```css
:root {
    --primary-color: #4a90d9;
    --primary-hover: #357abd;
    --background-color: #f0f4f8;
    --card-background: #ffffff;
    --text-primary: #2d3748;
    --text-secondary: #718096;
    --error-color: #e53e3e;
    --error-background: #fed7d7;
    --border-radius: 12px;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    --transition: all 0.3s ease;
}
```

#### レスポンシブデザイン

3つのブレークポイントで画面サイズに応じたレイアウトを提供。

| ブレークポイント | 対象デバイス | 主な変更 |
|----------------|------------|---------|
| `max-width: 600px` | モバイル | 検索フォーム縦配置、天気詳細1カラム、フォントサイズ縮小 |
| `601px - 900px` | タブレット | コンテナ幅 450px |
| `min-width: 901px` | デスクトップ | コンテナ幅 520px、中央配置、フォントサイズ拡大 |

#### ダークモード

`prefers-color-scheme: dark` メディアクエリにより、OSのシステム設定に連動したダークモードを自動適用。

| プロパティ | ライトモード | ダークモード |
|-----------|------------|------------|
| 背景色 | `#f0f4f8` | `#2d3748` |
| カード背景 | `#ffffff` | `#1a202c` |
| テキスト（主） | `#2d3748` | `#f7fafc` |
| テキスト（副） | `#718096` | `#a0aec0` |

#### アニメーション

| アニメーション名 | 用途 | 効果 |
|---------------|------|------|
| `fadeIn` | エラーメッセージ表示 | 不透明度 0→1 |
| `slideUp` | 天気カード表示 | 下から上へスライドイン + フェードイン |
| `spin` | ローディングスピナー | 360度回転（無限ループ） |

### 4.3 JavaScript設計

#### ローカル版 (`script.js`)

**モジュール構成（関数ベース）：**

| 関数名 | 役割 | 備考 |
|--------|------|------|
| `init()` | アプリケーション初期化 | DOMContentLoaded イベントで実行 |
| `handleSearch(event)` | 検索フォーム送信処理 | 入力バリデーション + API呼び出し |
| `fetchWeatherData(city)` | OpenWeatherMap API呼び出し | async/await, Fetch API使用 |
| `displayWeatherData(data)` | 天気データのDOM反映 | APIレスポンスをUIに表示 |
| `getErrorMessage(status, errorData)` | HTTPステータスに応じたエラーメッセージ生成 | 401, 404, 429, 5xx対応 |
| `getCountryName(countryCode)` | 国コードから国名への変換 | `Intl.DisplayNames` API使用 |
| `formatDate(date)` | 日付フォーマット | `toLocaleDateString` 使用（en-US） |
| `showError(message)` / `hideError()` | エラーメッセージ表示/非表示 | hidden クラスの切り替え |
| `showLoading()` / `hideLoading()` | ローディング表示/非表示 | hidden クラスの切り替え |
| `showWeatherCard()` / `hideWeatherCard()` | 天気カード表示/非表示 | hidden クラスの切り替え |
| `clearError()` | 入力時のエラーメッセージクリア | input イベントで実行 |

**API呼び出しフロー：**

```
ユーザー入力 → handleSearch() → fetchWeatherData()
    │                                  │
    ├─ バリデーション                     ├─ showLoading()
    │  - 空文字チェック                   ├─ hideError()
    │  - APIキー未設定チェック             ├─ hideWeatherCard()
    │                                  │
    │                                  ├─ fetch() → OpenWeatherMap API
    │                                  │     │
    │                                  │     ├─ 成功 → displayWeatherData()
    │                                  │     └─ 失敗 → showError()
    │                                  │
    │                                  └─ hideLoading()
```

**APIリクエスト仕様（ローカル版）：**

| 項目 | 値 |
|------|-----|
| エンドポイント | `https://api.openweathermap.org/data/2.5/weather` |
| メソッド | GET |
| パラメータ | `q` (都市名), `appid` (APIキー), `units=metric` |
| レスポンス形式 | JSON |

#### AWS版 (`aws/frontend/script.js`)

ローカル版との主な差異：

| 項目 | ローカル版 | AWS版 |
|------|----------|-------|
| API接続先 | OpenWeatherMap API 直接 | API Gateway エンドポイント |
| 設定値 | `API_KEY` | `API_GATEWAY_URL` |
| クエリパラメータ | `q`, `appid`, `units` | `city` |
| ネットワークエラー処理 | 標準エラーハンドリング | `TypeError: Failed to fetch` の個別処理あり |
| リクエストヘッダー | なし | `Accept: application/json` 明示 |

---

## 5. バックエンド設計（AWS Lambda）

### 5.1 Lambda関数 (`aws/lambda/index.js`)

**ランタイム：** Node.js 18.x

**関数仕様：**

| 項目 | 値 |
|------|-----|
| ハンドラ | `index.handler` |
| タイムアウト | 30秒 |
| メモリ | 128MB |
| 環境変数 | `OPENWEATHERMAP_API_KEY` |

**処理フロー：**

```
API Gateway イベント受信
    │
    ├─ OPTIONS メソッド → CORS プリフライトレスポンス (200)
    │
    ├─ APIキー未設定チェック → 500 エラーレスポンス
    │
    ├─ city パラメータ取得・バリデーション
    │   ├─ パラメータなし → 400 エラーレスポンス
    │   └─ 文字数制限 (100文字超) → 400 エラーレスポンス
    │
    └─ OpenWeatherMap API 呼び出し
        ├─ 200: 天気データ返却
        ├─ 401: 500 エラー（APIキー無効、内部エラーとして返却）
        ├─ 404: 404 エラー（都市が見つからない）
        ├─ 429: 429 エラー（レート制限）
        ├─ その他: 502 エラー（予期しないレスポンス）
        └─ 例外: 503 エラー（サービス利用不可）
```

**CORS レスポンスヘッダー：**

```
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token
Access-Control-Allow-Methods: GET,OPTIONS
```

**外部API通信：**
- Node.js 標準 `https` モジュールを使用（外部依存なし）
- リクエストタイムアウト: 10秒
- Promise ベースの非同期処理

---

## 6. インフラストラクチャ設計（CloudFormation）

### 6.1 使用AWSリソース一覧

| リソース | 用途 | 主な設定 |
|---------|------|---------|
| **S3 バケット** | 静的ウェブサイトホスティング | パブリックアクセス有効、ウェブサイトホスティング有効 |
| **S3 オブジェクト** | フロントエンドファイル配置 | index.html, styles.css, script.js |
| **Lambda関数** | 天気API プロキシ | Node.js 18.x, 128MB, 30秒タイムアウト |
| **API Gateway (REST)** | APIエンドポイント | REGIONAL、`/weather` パス |
| **IAM ロール** | Lambda 実行権限 | AWSLambdaBasicExecutionRole |
| **CloudWatch Logs** | Lambda ログ | 保持期間14日 |

### 6.2 CloudFormationパラメータ

| 変数名 | 型 | デフォルト値 | 説明 |
|--------|-----|------------|------|
| `aws_region` | string | `ap-northeast-1` | AWSリージョン |
| `environment` | string | `production` | 環境名 |
| `openweathermap_api_key` | string (sensitive) | なし | OpenWeatherMap APIキー |
| `app_name` | string | `weather-app` | アプリケーション名 |

### 6.3 リソース命名規則

| リソース | 命名パターン | 例 |
|---------|------------|-----|
| S3バケット | `{app_name}-frontend-{random_hex}` | `weather-app-frontend-a1b2c3d4` |
| Lambda関数 | `{app_name}-api` | `weather-app-api` |
| IAMロール | `{app_name}-api-role` | `weather-app-api-role` |
| API Gateway | `{app_name}-api` | `weather-app-api` |

### 6.4 CloudFormation出力値

| 出力名 | 説明 |
|--------|------|
| `s3_website_url` | S3静的ウェブサイトURL |
| `s3_bucket_name` | S3バケット名 |
| `api_gateway_url` | API Gatewayエンドポイント（`/weather`パス付き） |
| `lambda_function_name` | Lambda関数名 |
| `api_gateway_id` | API Gateway ID |

### 6.5 デフォルトタグ

すべてのAWSリソースに以下のタグが付与される。

| タグキー | 値 |
|---------|-----|
| `Project` | `weather-app` |
| `Environment` | 変数 `environment` の値 |
| `ManagedBy` | `cloudformation` |

---

## 7. API設計

### 7.1 外部API（OpenWeatherMap）

| 項目 | 値 |
|------|-----|
| API名 | Current Weather Data API |
| ベースURL | `https://api.openweathermap.org/data/2.5/weather` |
| 認証 | APIキー（`appid` パラメータ） |
| レート制限 | 60リクエスト/分、1,000,000リクエスト/月（無料枠） |

**主要レスポンスフィールド：**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `name` | string | 都市名 |
| `sys.country` | string | 国コード（ISO 3166-1 alpha-2） |
| `weather[0].icon` | string | 天気アイコンコード |
| `weather[0].description` | string | 天気説明文 |
| `main.temp` | number | 気温（摂氏） |
| `main.humidity` | number | 湿度（%） |
| `main.feels_like` | number | 体感温度（摂氏） |
| `wind.speed` | number | 風速（m/s） |
| `visibility` | number | 視程（メートル） |

### 7.2 内部API（API Gateway + Lambda）

| 項目 | 値 |
|------|-----|
| エンドポイント | `GET /weather` |
| クエリパラメータ | `city` (必須、最大100文字) |
| レスポンス形式 | JSON（OpenWeatherMap APIレスポンスをそのまま返却、またはエラーオブジェクト） |
| 統合タイプ | Lambda プロキシ統合（AWS_PROXY） |

**エラーレスポンス形式：**

```json
{
    "error": "エラー種別",
    "message": "ユーザー向けエラーメッセージ"
}
```

**HTTPステータスコード：**

| コード | 条件 |
|--------|------|
| 200 | 正常レスポンス / CORSプリフライト |
| 400 | cityパラメータ不正（未指定、100文字超） |
| 404 | 都市が見つからない |
| 429 | OpenWeatherMap APIレート制限超過 |
| 500 | APIキー未設定、APIキー無効 |
| 502 | OpenWeatherMap APIからの予期しないレスポンス |
| 503 | OpenWeatherMap APIへの接続失敗 |

---

## 8. データフロー

### 8.1 ローカル版

```
1. ユーザーが都市名を入力し「Search」ボタンをクリック
2. handleSearch() が呼び出され、入力バリデーションを実施
3. fetchWeatherData() が OpenWeatherMap API に GET リクエストを送信
   URL: https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric
4. APIレスポンス（JSON）を受信
5. displayWeatherData() がレスポンスデータをDOM要素に反映
6. 天気カードが表示される
```

### 8.2 AWS版

```
1. ユーザーがS3でホストされたウェブサイトにアクセス
2. ブラウザがHTML/CSS/JSファイルをS3から取得
3. ユーザーが都市名を入力し「Search」ボタンをクリック
4. fetchWeatherData() が API Gateway に GET リクエストを送信
   URL: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/weather?city={city}
5. API Gateway が Lambda関数を呼び出し
6. Lambda関数が OpenWeatherMap API に HTTPS リクエストを送信
7. OpenWeatherMap API のレスポンスを Lambda が処理
8. Lambda が API Gateway にレスポンスを返却（CORSヘッダー付き）
9. API Gateway がブラウザにレスポンスを返却
10. displayWeatherData() がレスポンスデータをDOM要素に反映
```

---

## 9. セキュリティ設計

### 9.1 APIキー管理

| 構成 | 管理方法 | リスク |
|------|---------|--------|
| ローカル版 | JavaScriptファイルに直接埋め込み | クライアント側でAPIキーが露出する |
| AWS版 | Lambda環境変数として管理 | APIキーはサーバー側で保持され、クライアントに公開されない |

### 9.2 入力バリデーション

| レイヤー | バリデーション内容 |
|---------|-----------------|
| フロントエンド | 空文字チェック、`required` 属性 |
| Lambda | `city` パラメータの存在チェック、文字数制限（100文字） |
| API呼び出し | `encodeURIComponent()` によるURLエンコード |

### 9.3 エラーハンドリング

- Lambda内部エラーの詳細はクライアントに公開しない（401 APIキーエラーは500として返却）
- `console.error` によるCloudWatch Logsへのエラーログ記録
- ユーザーフレンドリーなエラーメッセージの表示

### 9.4 CORS設定

- API GatewayでCORSを設定（OPTIONSメソッドのモック統合）
- Lambda関数のレスポンスにもCORSヘッダーを付与（二重設定による確実なCORS対応）
- `Access-Control-Allow-Origin: *` （全オリジン許可）

### 9.5 S3バケットセキュリティ

- パブリック読み取りアクセスを許可（静的ウェブサイトホスティングのため）
- `s3:GetObject` のみ許可するバケットポリシー
- 書き込み権限は付与されていない

### 9.6 IAM権限

- Lambda実行ロールには最小権限の原則を適用
- `AWSLambdaBasicExecutionRole` のみ付与（CloudWatch Logsへの書き込み権限）

---

## 10. 非機能要件

### 10.1 パフォーマンス

| 項目 | 設定値 |
|------|--------|
| Lambda タイムアウト | 30秒 |
| Lambda メモリ | 128MB |
| OpenWeatherMap API リクエストタイムアウト（Lambda内） | 10秒 |
| CSS トランジション | 0.3秒 |
| CloudWatch Logs 保持期間 | 14日 |

### 10.2 ブラウザ互換性

- Safari (macOS)
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- 高解像度ディスプレイ対応 (`-webkit-min-device-pixel-ratio: 2`)

### 10.3 使用技術

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | HTML5, CSS3, Vanilla JavaScript (ES2017+) |
| バックエンド | Node.js 18.x, AWS Lambda |
| インフラ | AWS CloudFormation |
| API | OpenWeatherMap Current Weather Data API |
| Web API | Fetch API, Intl.DisplayNames |

---

## 11. 制限事項・既知の課題

1. **ローカル版のAPIキー露出**: ローカル版ではAPIキーがクライアント側に露出する。本番環境ではAWS版の使用を推奨。
2. **CORS全オリジン許可**: AWS版の `Access-Control-Allow-Origin: *` はセキュリティ上、特定ドメインに制限することが望ましい。
3. **認証・認可なし**: API Gatewayのエンドポイントに認証が設定されていない（`authorization = "NONE"`）。APIキーやCognitoによる認証の追加を検討。
4. **HTTPS未対応（S3）**: S3の静的ウェブサイトホスティングはHTTPのみ。CloudFrontの追加によるHTTPS対応を検討。
5. **キャッシュ未実装**: 同一都市への連続リクエストに対するキャッシュ機構がない。
6. **多言語未対応**: UIは英語のみ。`Intl.DisplayNames` と `toLocaleDateString` は `en-US` ロケール固定。
7. **テスト未実装**: 単体テスト、結合テスト、E2Eテストが未実装。
