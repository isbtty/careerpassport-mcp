# careerpassport-mcp

Career Passport API v2 の MCP (Model Context Protocol) サーバー。
OpenClaw などの MCP クライアントから、キャリアパスポートの証明書発行・取得を行えます。

## 提供ツール

| ツール | 説明 |
|--------|------|
| `get-projects` | プロジェクト証明書一覧を取得 |
| `issue-project` | プロジェクト証明書を発行 |
| `get-feedbacks` | フィードバック証明書一覧を取得 |
| `issue-feedback` | フィードバック証明書を発行 |
| `get-gpas` | GPA 証明書一覧を取得 |
| `get-awards` | 受賞証明書一覧を取得 |
| `get-organizations` | 所属組織一覧を取得 |
| `rag-retrieval` | RAG 検索 |
| `rag-generation` | RAG 生成 |

## Raspberry Pi セットアップ

### 前提条件

- Node.js 18 以上
- GitHub アカウント (GitHub Packages へのアクセス用)
- Career Passport OAuth クライアントの `client_id` / `client_secret`

### 1. GitHub Personal Access Token の作成

GitHub Packages からパッケージを取得するために PAT が必要です。

1. https://github.com/settings/tokens にアクセス
2. **Generate new token (classic)** を選択
3. スコープで `read:packages` にチェック
4. トークンを生成してコピー

### 2. npm レジストリの設定

Raspberry Pi 上で以下を実行します。

```bash
# GitHub Packages レジストリを設定
echo "@tatsuyaishibe:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT" >> ~/.npmrc
```

`YOUR_GITHUB_PAT` を手順 1 で取得したトークンに置き換えてください。

### 3. パッケージのインストール

```bash
npm install -g @tatsuyaishibe/careerpassport-mcp
```

### 4. 環境変数の設定

任意のディレクトリに `.env` ファイルを作成します。

```bash
mkdir -p ~/careerpassport-mcp && cd ~/careerpassport-mcp

cat <<'EOF' > .env
CP_CLIENT_ID=your_oauth_client_id
CP_CLIENT_SECRET=your_oauth_client_secret
CP_ENVIRONMENT=production
EOF
```

| 変数 | 必須 | 説明 |
|------|------|------|
| `CP_CLIENT_ID` | Yes | OAuth クライアント ID |
| `CP_CLIENT_SECRET` | Yes | OAuth クライアントシークレット |
| `CP_ENVIRONMENT` | No | `production` (デフォルト) または `staging` |
| `CP_ACCESS_TOKEN` | No | 手動設定時のアクセストークン (設定すると OAuth フローをスキップ) |
| `CP_REFRESH_TOKEN` | No | 手動設定時のリフレッシュトークン |

### 5. OAuth リダイレクト URI の設定

Career Passport の管理画面で、OAuth クライアントのリダイレクト URI に以下を追加してください。

```
http://localhost:19876/callback
```

### 6. 初回認証 (SSH 経由のヘッドレス環境)

Raspberry Pi に SSH で接続した状態で MCP サーバーを起動すると、初回は OAuth 認証フローが走ります。

```
$ cd ~/careerpassport-mcp
$ careerpassport-mcp

=== Career Passport OAuth Authentication ===

1. Open this URL in your browser:

  https://vcs.sakazuki.xyz/oauth2/authorize?response_type=code&client_id=...&redirect_uri=http%3A%2F%2Flocalhost%3A19876%2Fcallback&state=...

2. Log in and authorize the application.
3. The browser will redirect to a URL that may fail to load.
4. Copy the FULL URL from the browser address bar and paste it here:

Callback URL>
```

手順:

1. 表示された URL を **Mac のブラウザ** で開く
2. Career Passport にログインして認可する
3. ブラウザが `http://localhost:19876/callback?code=...&state=...` にリダイレクトされる (ページは読み込めなくて OK)
4. ブラウザのアドレスバーから **URL 全体をコピー**
5. SSH ターミナルに戻って `Callback URL>` のプロンプトに **ペースト** して Enter

認証が成功するとトークンが `~/.careerpassport-mcp/tokens.json` に保存されます。
次回以降の起動では自動的に保存済みトークンが使われ、再認証は不要です。
トークンの有効期限が切れた場合はリフレッシュトークンで自動更新されます。

### 7. OpenClaw への MCP サーバー登録

OpenClaw の設定ファイル (`~/.config/openclaw/config.json` など) に MCP サーバーを追加します。

```json
{
  "mcpServers": {
    "careerpassport": {
      "command": "careerpassport-mcp",
      "env": {
        "CP_CLIENT_ID": "your_oauth_client_id",
        "CP_CLIENT_SECRET": "your_oauth_client_secret",
        "CP_ENVIRONMENT": "production"
      }
    }
  }
}
```

または `.env` ファイルがあるディレクトリから起動する場合:

```json
{
  "mcpServers": {
    "careerpassport": {
      "command": "careerpassport-mcp",
      "cwd": "/home/pi/careerpassport-mcp"
    }
  }
}
```

### トラブルシューティング

#### 再認証が必要な場合

保存済みトークンを削除して再起動すると、OAuth フローが再度実行されます。

```bash
rm ~/.careerpassport-mcp/tokens.json
```

#### パッケージの更新

```bash
npm update -g @tatsuyaishibe/careerpassport-mcp
```

## 開発

```bash
git clone https://github.com/TatsuyaIshibe/careerpassport-mcp.git
cd careerpassport-mcp
npm install
npm run build
npm test
```

## ライセンス

MIT
