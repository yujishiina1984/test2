# アーキテクチャ図

天気予報ウェブアプリケーションのアーキテクチャドキュメントです。  
本プロジェクトは、**スタンドアロン版**と**AWS版**の2つの構成を持っています。

---

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [スタンドアロン版アーキテクチャ](#スタンドアロン版アーキテクチャ)
3. [AWS版アーキテクチャ](#aws版アーキテクチャ)
4. [コンポーネント説明](#コンポーネント説明)
5. [データフロー](#データフロー)
6. [ファイル構成](#ファイル構成)

---

## プロジェクト概要

本プロジェクトは、[OpenWeatherMap API](https://openweathermap.org/api) を利用して世界中の都市の天気情報を表示するウェブアプリケーションです。

| 項目 | スタンドアロン版 | AWS版 |
|------|-----------------|-------|
| ホスティング | ローカルファイル / ローカルサーバー | Amazon S3 (静的ウェブホスティング) |
| API呼び出し | ブラウザから直接 OpenWeatherMap API | API Gateway + Lambda 経由 |
| APIキー管理 | クライアント側 (script.js に埋め込み) | サーバー側 (Lambda 環境変数) |
| バックエンド | なし | AWS Lambda (Node.js 18.x) |
| インフラ管理 | なし | Terraform (IaC) |
| デフォルトリージョン | - | ap-northeast-1 (東京) |

---

## スタンドアロン版アーキテクチャ

ブラウザから直接 OpenWeatherMap API を呼び出すシンプルな構成です。

```mermaid
graph LR
    subgraph クライアント
        A["🌐 ブラウザ<br/>(HTML / CSS / JS)"]
    end

    subgraph 外部サービス
        B["☁️ OpenWeatherMap API<br/>api.openweathermap.org<br/>/data/2.5/weather"]
    end

    A -- "HTTP GET<br/>?q={city}&appid={API_KEY}&units=metric" --> B
    B -- "JSON レスポンス<br/>(天気データ)" --> A
```

### スタンドアロン版の特徴

- サーバー不要で動作（`index.html` をブラウザで直接開くだけ）
- APIキーはクライアント側の `script.js` に埋め込み
- OpenWeatherMap Current Weather Data API を使用
- レスポンシブデザイン、ダークモード対応

---

## AWS版アーキテクチャ

AWS のマネージドサービスを活用したサーバーレス構成です。  
APIキーをサーバー側で管理し、セキュリティを強化しています。

### 全体構成図

```mermaid
graph TB
    subgraph ユーザー
        USER["👤 ユーザー<br/>(ブラウザ)"]
    end

    subgraph AWS["☁️ AWS (ap-northeast-1)"]
        subgraph S3["Amazon S3<br/>静的ウェブホスティング"]
            S3_FILES["📄 index.html<br/>📄 styles.css<br/>📄 script.js"]
        end

        subgraph APIGW["Amazon API Gateway<br/>REST API (REGIONAL)"]
            APIGW_RES["/weather<br/>GET / OPTIONS"]
        end

        subgraph LAMBDA["AWS Lambda<br/>Node.js 18.x"]
            LAMBDA_FN["⚡ weather-app-api<br/>メモリ: 128MB<br/>タイムアウト: 30秒"]
        end

        subgraph IAM["IAM"]
            IAM_ROLE["🔑 Lambda 実行ロール<br/>AWSLambdaBasicExecutionRole"]
        end

        subgraph CW["Amazon CloudWatch"]
            CW_LOGS["📋 ログ<br/>/aws/lambda/weather-app-api<br/>保持期間: 14日"]
        end
    end

    subgraph 外部サービス
        OWM["☁️ OpenWeatherMap API<br/>api.openweathermap.org"]
    end

    USER -- "1. 静的ファイル取得<br/>HTTP" --> S3_FILES
    USER -- "2. API リクエスト<br/>GET /weather?city={city}" --> APIGW_RES
    APIGW_RES -- "3. Lambda プロキシ統合<br/>(POST)" --> LAMBDA_FN
    LAMBDA_FN -- "4. 天気データ取得<br/>HTTPS GET" --> OWM
    OWM -- "5. JSON レスポンス" --> LAMBDA_FN
    LAMBDA_FN -- "6. レスポンス<br/>(CORS ヘッダー付き)" --> APIGW_RES
    APIGW_RES -- "7. JSON レスポンス" --> USER
    IAM_ROLE -. "権限付与" .-> LAMBDA_FN
    LAMBDA_FN -. "ログ出力" .-> CW_LOGS
```

### AWS サービス関連図

```mermaid
graph LR
    subgraph Terraform["🔧 Terraform (IaC)"]
        TF["main.tf<br/>AWS Provider ~> 5.0<br/>リージョン: ap-northeast-1"]
    end

    subgraph AWSリソース
        S3["🪣 S3 バケット<br/>weather-app-frontend-{hex}"]
        APIGW["🌐 API Gateway<br/>REST API"]
        LAMBDA["⚡ Lambda<br/>weather-app-api"]
        IAM["🔑 IAM ロール"]
        CW["📋 CloudWatch Logs"]
        STAGE["📦 API ステージ<br/>production"]
    end

    TF --> S3
    TF --> APIGW
    TF --> LAMBDA
    TF --> IAM
    TF --> CW

    APIGW --> STAGE
    APIGW -- "プロキシ統合" --> LAMBDA
    IAM -- "実行ロール" --> LAMBDA
    LAMBDA -- "ログ書き込み" --> CW
```

### CORS リクエストフロー

```mermaid
sequenceDiagram
    participant B as ブラウザ
    participant AG as API Gateway
    participant L as Lambda
    participant OWM as OpenWeatherMap API

    Note over B,AG: CORS プリフライトリクエスト
    B->>AG: OPTIONS /weather
    AG-->>B: 200 OK (CORS ヘッダー)<br/>Allow-Origin: *<br/>Allow-Methods: GET, OPTIONS

    Note over B,OWM: 天気データ取得リクエスト
    B->>AG: GET /weather?city=Tokyo
    AG->>L: Lambda プロキシ統合 (POST)
    L->>OWM: HTTPS GET /data/2.5/weather?q=Tokyo&appid={key}&units=metric
    OWM-->>L: 200 OK (天気データ JSON)
    L-->>AG: 200 OK + CORS ヘッダー + 天気データ
    AG-->>B: 200 OK (天気データ JSON)
```

---

## コンポーネント説明

### スタンドアロン版

| コンポーネント | 説明 |
|---------------|------|
| **index.html** | アプリケーションのメインHTMLファイル。検索フォーム、天気カード表示領域を定義 |
| **styles.css** | UIスタイル定義。レスポンシブデザイン、ダークモード対応 |
| **script.js** | アプリケーションロジック。OpenWeatherMap API への直接リクエスト、データ表示処理 |

### AWS版

| コンポーネント | 役割 | 詳細 |
|---------------|------|------|
| **Amazon S3** | 静的ウェブホスティング | フロントエンドファイル (HTML, CSS, JS) を配信。パブリックアクセスを有効化し、ウェブサイトホスティングを設定 |
| **API Gateway** | APIエンドポイント | REST API (REGIONAL) として `/weather` リソースを公開。GET メソッド (Lambda プロキシ統合) と OPTIONS メソッド (CORS Mock 統合) を提供 |
| **AWS Lambda** | バックエンド処理 | Node.js 18.x ランタイムで動作。入力バリデーション、OpenWeatherMap API 呼び出し、エラーハンドリング、CORSヘッダー付与を担当。メモリ 128MB、タイムアウト 30秒 |
| **IAM ロール** | 権限管理 | Lambda 実行ロール。`AWSLambdaBasicExecutionRole` ポリシーを付与し、CloudWatch Logs への書き込みを許可 |
| **CloudWatch Logs** | ログ管理 | Lambda 関数の実行ログを保存。ロググループ `/aws/lambda/weather-app-api`、保持期間 14日 |
| **Terraform** | インフラ管理 | IaC (Infrastructure as Code) で全 AWS リソースを管理。バージョン >= 1.0.0、AWS Provider ~> 5.0 |

### 外部サービス

| サービス | 用途 |
|---------|------|
| **OpenWeatherMap API** | 天気データの提供元。Current Weather Data API (`/data/2.5/weather`) を使用。無料枠: 60リクエスト/分、1,000,000リクエスト/月 |

---

## データフロー

### スタンドアロン版

```mermaid
flowchart LR
    A["ユーザーが都市名を入力"] --> B["script.js が<br/>API リクエスト生成"]
    B --> C["OpenWeatherMap API<br/>に直接リクエスト"]
    C --> D["JSON レスポンス<br/>を受信"]
    D --> E["天気データを<br/>UIに表示"]
```

1. ユーザーが検索フォームに都市名を入力し、検索を実行
2. `script.js` が OpenWeatherMap API へ直接 HTTP GET リクエストを送信
3. APIからJSON形式の天気データを受信
4. 受信したデータをパースし、UIに表示（気温、湿度、風速、体感温度、視程）

### AWS版

```mermaid
flowchart TB
    A["ユーザーがブラウザで<br/>S3 URL にアクセス"] --> B["S3 から静的ファイル<br/>(HTML/CSS/JS) を取得"]
    B --> C["ユーザーが<br/>都市名を入力"]
    C --> D["script.js が API Gateway<br/>に GET リクエスト送信"]
    D --> E["API Gateway が<br/>Lambda を呼び出し"]
    E --> F["Lambda が<br/>OpenWeatherMap API<br/>に HTTPS リクエスト"]
    F --> G["OpenWeatherMap から<br/>天気データ受信"]
    G --> H["Lambda が CORS ヘッダー付きで<br/>レスポンスを返却"]
    H --> I["API Gateway 経由で<br/>ブラウザにレスポンス"]
    I --> J["天気データを<br/>UIに表示"]
```

1. ユーザーがブラウザで S3 の静的ウェブサイト URL にアクセス
2. S3 からフロントエンドファイル (HTML, CSS, JS) をダウンロード
3. ユーザーが都市名を入力し、検索を実行
4. `script.js` が API Gateway の `/weather?city={cityName}` に GET リクエストを送信
5. API Gateway が Lambda プロキシ統合で Lambda 関数を呼び出し
6. Lambda が環境変数の API キーを使用して OpenWeatherMap API に HTTPS リクエスト
7. OpenWeatherMap API から天気データ (JSON) を受信
8. Lambda が CORS ヘッダーを付与してレスポンスを返却
9. API Gateway 経由でブラウザにレスポンスが返される
10. フロントエンドが天気データをUIに表示

### エラーハンドリングフロー

Lambda 関数では以下のエラーハンドリングを実施:

| OpenWeatherMap レスポンス | Lambda の返却ステータス | ユーザーへのメッセージ |
|--------------------------|----------------------|---------------------|
| 200 OK | 200 | 天気データを表示 |
| 401 Unauthorized | 500 | Weather service authentication failed |
| 404 Not Found | 404 | City not found |
| 429 Too Many Requests | 429 | Rate limit exceeded |
| その他のエラー | 502 | Unexpected response |
| 接続エラー / タイムアウト | 503 | Unable to fetch weather data |

---

## ファイル構成

```
test2/
├── ARCHITECTURE.md              # 本ドキュメント（アーキテクチャ図）
├── index.html                   # スタンドアロン版 - メインHTML
├── styles.css                   # スタンドアロン版 - CSSスタイル
├── script.js                    # スタンドアロン版 - JS (OpenWeatherMap API直接呼び出し)
├── README.md                    # スタンドアロン版 - ドキュメント
└── aws/                         # AWS版
    ├── architecture.drawio      # Draw.io形式のアーキテクチャ図 (XML)
    ├── README.md                # AWS デプロイガイド
    ├── frontend/                # S3 にデプロイするフロントエンドファイル
    │   ├── index.html           #   メインHTML
    │   ├── styles.css           #   CSSスタイル
    │   └── script.js            #   JS (API Gateway 経由で天気データ取得)
    ├── lambda/                  # Lambda 関数のソースコード
    │   └── index.js             #   ハンドラー (Node.js 18.x)
    └── terraform/               # Infrastructure as Code
        ├── main.tf              #   全 AWS リソースの定義
        └── terraform.tfvars.example  # 変数設定のサンプル
```

### 各ディレクトリの役割

| ディレクトリ | 役割 |
|-------------|------|
| `/` (ルート) | スタンドアロン版のアプリケーションファイル |
| `/aws/` | AWS版の全ファイル |
| `/aws/frontend/` | S3 にデプロイする静的ファイル (スタンドアロン版と同じUI、API呼び出し先が異なる) |
| `/aws/lambda/` | Lambda 関数のソースコード (外部依存なし、Node.js 標準の `https` モジュールのみ使用) |
| `/aws/terraform/` | Terraform による AWS リソース定義 (S3, API Gateway, Lambda, IAM, CloudWatch) |
