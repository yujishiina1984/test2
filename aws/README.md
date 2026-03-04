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
├── cloudformation/              # Infrastructure as Code (CloudFormation)
│   ├── template.yaml
│   └── parameters.example.json
└── README.md               # このファイル
```

## 前提条件

1. **AWS アカウント**: 有効なAWSアカウントが必要です
2. **AWS CLI**: [AWS CLI](https://aws.amazon.com/cli/) がインストールされ、認証情報が設定されていること
3. **CloudFormation**: AWS CLIに組み込まれているため、追加のインストールは不要です
4. **OpenWeatherMap API キー**: [OpenWeatherMap](https://openweathermap.org/api) から取得

## デプロイ手順

### 1. CloudFormation の設定

```bash
cd aws/cloudformation

# parameters.example.json をコピー
cp parameters.example.json parameters.json

# parameters.json を編集してAPIキーを設定
# OpenWeatherMapApiKey の ParameterValue を実際のAPIキーに変更
```

### 2. CloudFormation スタックの作成

```bash
# スタックの作成
aws cloudformation create-stack \
  --stack-name weather-app \
  --template-body file://template.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM

# スタック作成完了を待機
aws cloudformation wait stack-create-complete --stack-name weather-app

# 出力値の確認
aws cloudformation describe-stacks --stack-name weather-app --query 'Stacks[0].Outputs'
```

デプロイが完了すると、以下の出力が表示されます：
- `s3_website_url`: フロントエンドのURL
- `api_gateway_url`: API GatewayのエンドポイントURL
- `lambda_function_name`: Lambda関数名
- `s3_bucket_name`: S3バケット名

### 3. フロントエンドファイルのアップロード

CloudFormationではS3へのファイルアップロードは行われません。スタック作成後に手動でアップロードしてください：

```bash
# 出力からバケット名を取得
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name weather-app --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' --output text)

# フロントエンドファイルをアップロード
aws s3 sync ../frontend/ s3://$BUCKET_NAME/
```

### 4. フロントエンドの API URL 設定

1. CloudFormationの出力から `ApiGatewayUrl` をコピー
2. `aws/frontend/script.js` を編集
3. `API_GATEWAY_URL` を実際のURLに更新：

```javascript
const API_GATEWAY_URL = 'https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/production/weather';
```

4. 変更をS3にアップロード：

```bash
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name weather-app --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' --output text)
aws s3 cp frontend/script.js s3://$BUCKET_NAME/script.js --content-type "application/javascript"
```

### 5. Lambda関数コードのデプロイ

CloudFormationテンプレートにはプレースホルダーコードが含まれています。実際のLambda関数コードをデプロイしてください：

```bash
cd ../lambda
zip function.zip index.js
FUNCTION_NAME=$(aws cloudformation describe-stacks --stack-name weather-app --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' --output text)
aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://function.zip
```

### 6. 動作確認

ブラウザで `s3_website_url` にアクセスし、都市名を入力して天気情報が表示されることを確認します。

## リソースの削除

```bash
aws cloudformation delete-stack --stack-name weather-app
aws cloudformation wait stack-delete-complete --stack-name weather-app
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

`parameters.json` で `Environment` パラメータを変更するか、スタック作成時にリージョンを指定：

```bash
aws cloudformation create-stack \
  --stack-name weather-app \
  --template-body file://template.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

### 環境の追加

`parameters.json` で `Environment` の `ParameterValue` を変更：

```json
{
  "ParameterKey": "Environment",
  "ParameterValue": "staging"
}
```

## ライセンス

このプロジェクトはオープンソースであり、個人および教育目的で使用できます。
