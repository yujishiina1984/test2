# Weather App - AWS Deployment Guide

このドキュメントでは、天気アプリをAWS上にデプロイする手順を説明します。

## アーキテクチャ概要

```
┌─────────────┐     ┌─────────────────┐     ┌───────────────┐     ┌─────────────────┐
│   Browser   │────▶│   Amazon S3     │     │  API Gateway  │────▶│  AWS Lambda     │
│   (User)    │◀────│ (Static Files)  │     │  (REST API)   │◀────│  (Node.js)      │
└─────────────┘     └─────────────────┘     └───────────────┘     └─────────────────┘
       │                                            ▲                      │
       │                                            │                      │
       └────────────────────────────────────────────┘                      │
                     API Request                                           │
                                                                           ▼
                                                              ┌─────────────────────┐
                                                              │   OpenWeatherMap    │
                                                              │   API (External)    │
                                                              └─────────────────────┘
```

詳細なアーキテクチャ図は `architecture.drawio` ファイルで確認できます。

## ファイル構成

```
aws/
├── architecture.drawio     # Draw.io形式のアーキテクチャ図
├── frontend/               # S3にデプロイするフロントエンドファイル
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── lambda/                 # Lambda関数のコード
│   └── index.js
├── terraform/              # Infrastructure as Code (Terraform)
│   ├── main.tf
│   └── terraform.tfvars.example
└── README.md               # このファイル
```

## 前提条件

1. **AWS アカウント**: 有効なAWSアカウントが必要です
2. **AWS CLI**: [AWS CLI](https://aws.amazon.com/cli/) がインストールされ、認証情報が設定されていること
3. **Terraform**: [Terraform](https://www.terraform.io/downloads) v1.0以上がインストールされていること
4. **OpenWeatherMap API キー**: [OpenWeatherMap](https://openweathermap.org/api) から取得

## デプロイ手順

### 1. Terraform の設定

```bash
cd aws/terraform

# terraform.tfvars.example をコピー
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvars を編集してAPIキーを設定
# openweathermap_api_key = "your_actual_api_key"
```

### 2. Terraform の初期化とデプロイ

```bash
# 初期化
terraform init

# 計画の確認
terraform plan

# デプロイの実行
terraform apply
```

デプロイが完了すると、以下の出力が表示されます：
- `s3_website_url`: フロントエンドのURL
- `api_gateway_url`: API GatewayのエンドポイントURL
- `lambda_function_name`: Lambda関数名
- `s3_bucket_name`: S3バケット名

### 3. フロントエンドの API URL 設定

1. Terraformの出力から `api_gateway_url` をコピー
2. `aws/frontend/script.js` を編集
3. `API_GATEWAY_URL` を実際のURLに更新：

```javascript
const API_GATEWAY_URL = 'https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/production/weather';
```

4. 変更をS3にアップロード（Terraformを再実行するか、AWS CLIで手動アップロード）：

```bash
aws s3 cp frontend/script.js s3://$(terraform output -raw s3_bucket_name)/script.js --content-type "application/javascript"
```

### 4. 動作確認

ブラウザで `s3_website_url` にアクセスし、都市名を入力して天気情報が表示されることを確認します。

## リソースの削除

```bash
cd aws/terraform
terraform destroy
```

## AWS リソース詳細

### Amazon S3

- **目的**: 静的ウェブサイトホスティング
- **コンテンツ**: HTML, CSS, JavaScript ファイル
- **設定**: パブリックアクセス有効、静的ウェブホスティング有効

### API Gateway

- **タイプ**: REST API
- **エンドポイント**: `/weather` (GET)
- **CORS**: 有効（すべてのオリジンからのアクセスを許可）
- **統合**: Lambda プロキシ統合

### AWS Lambda

- **ランタイム**: Node.js 18.x
- **タイムアウト**: 30秒
- **メモリ**: 128MB
- **環境変数**: `OPENWEATHERMAP_API_KEY`

### IAM

- **ロール**: Lambda実行ロール
- **ポリシー**: `AWSLambdaBasicExecutionRole`（CloudWatch Logsへの書き込み権限）

### CloudWatch

- **ログ保持期間**: 14日
- **ログ**: Lambda関数の実行ログ

## CORS 設定

API GatewayでCORSが適切に設定されています：

- `Access-Control-Allow-Origin`: `*`
- `Access-Control-Allow-Methods`: `GET, OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token`

## セキュリティ考慮事項

1. **APIキーの保護**: OpenWeatherMap APIキーはLambda環境変数として保存され、フロントエンドには公開されません
2. **入力検証**: Lambda関数で入力パラメータの検証を実施
3. **エラーハンドリング**: 内部エラーの詳細はクライアントに公開されません

## トラブルシューティング

### CORS エラー

ブラウザのコンソールにCORSエラーが表示される場合：
1. API Gatewayのデプロイが完了しているか確認
2. API Gatewayのステージを再デプロイ

### 404 エラー

- S3バケットのウェブサイトホスティングが有効か確認
- ファイルがS3にアップロードされているか確認

### Lambda タイムアウト

- CloudWatch Logsでエラーを確認
- OpenWeatherMap APIへの接続を確認

## カスタマイズ

### リージョン変更

`terraform.tfvars` で `aws_region` を変更：

```hcl
aws_region = "us-west-2"
```

### 環境の追加

`terraform.tfvars` で `environment` を変更：

```hcl
environment = "staging"
```

## ライセンス

このプロジェクトはオープンソースであり、個人および教育目的で使用できます。
