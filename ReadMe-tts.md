# Fish Audio TTS Provider 使用說明

## 概述
Fish Audio TTS Provider 是一個為 SillyTavern 設計的文字轉語音擴展，支援多種中文語音模型。

## 功能特色
- 支援多種預設聲音（茜特菈莉、八重神子、雷神）
- 可自訂參考音檔
- 多種音訊格式支援（MP3、WAV、PCM）
- 可調整語音速度和音量
- 支援文字正規化

## 安裝設定

### 1. API 端點設定
- 預設端點：`http://127.0.0.1:8080/v1/tts`
- 確保 Fish Audio API 服務正在運行

### 2. Proxy 伺服器設定
**重要：** 必須使用 Proxy 伺服器處理 CORS (跨來源資源共享) 問題
- 建立一個簡單的 Proxy 伺服器來轉發請求
- 確保 Proxy 伺服器正確轉發 API Key 和所有必要的標頭
- 設定範例 (Node.js):
  ```javascript
  const express = require('express');
  const cors = require('cors');
  const { createProxyMiddleware } = require('http-proxy-middleware');
  
  const app = express();
  app.use(cors());
  
  app.use('/v1/tts', createProxyMiddleware({
    target: 'https://fish.audio',
    changeOrigin: true,
    pathRewrite: { '^/v1/tts': '/api/v1/tts' },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('Authorization', `Bearer YOUR_API_KEY_HERE`);
    }
  }));
  
  app.listen(8080);
  ```

### 3. API Key 設定
- 需要有效的 Fish Audio API Key
- API Key 應在 Proxy 伺服器中配置
- 切勿在前端代碼中直接嵌入 API Key

### 4. 模型選擇
可選擇以下模型：
- **S1**：標準模型
- **Speech 1.6**：進階模型

### 5. 聲音選擇
內建聲音選項：
- 茜特菈莉
- 八重神子
- 雷神

## 參數設定

### 基本設定
- **音訊格式**：MP3（推薦）、WAV、PCM
- **MP3 位元率**：64、128（推薦）、192 kbps
- **區塊長度**：100-300（預設 200）
- **延遲模式**：Normal（標準）、Balanced（平衡）

### 進階設定
- **文字正規化**：自動清理和格式化輸入文字
- **語音速度**：0.9（預設，稍慢於正常速度）
- **音量**：0（預設音量）
- **溫度**：0.7（控制語音變化性）
- **Top P**：0.7（控制語音品質）

## 參考音檔功能

### 上傳自訂參考音檔
1. 點擊「選擇檔案」按鈕
2. 選擇音訊檔案（支援常見格式）
3. 點擊上傳按鈕
4. 在參考文字欄位輸入對應的文字內容

### 使用預設參考 ID
- 直接選擇內建聲音即可使用對應的參考 ID
- 無需額外設定

## 使用方法

### 1. 連線測試
點擊設定介面中的「插頭」圖示進行 API 連線測試：
- 🟢 綠色：連線成功
- 🔴 紅色：連線失敗

### 2. 語音生成
1. 確保 API 連線正常
2. 選擇所需的聲音
3. 輸入要轉換的文字
4. 系統會自動生成語音

### 3. 語音預覽
- 使用預覽功能測試聲音效果
- 確認設定是否符合需求

## 故障排除

### 常見問題
1. **連線失敗**
   - 檢查 API 端點是否正確
   - 確認 Fish Audio 服務是否運行
   - 檢查網路連線

2. **語音生成失敗**
   - 確認文字長度是否適當
   - 檢查區塊長度設定
   - 嘗試重新連線

3. **音質問題**
   - 調整 MP3 位元率
   - 嘗試不同的延遲模式
   - 檢查參考音檔品質

### 效能最佳化
- 建議使用 MP3 格式以平衡品質和檔案大小
- 區塊長度設為 200 可獲得較好的效能
- 使用 Normal 延遲模式以獲得更快的回應

## 技術規格
- 支援格式：MP3、WAV、PCM
- 位元率：64-192 kbps
- 區塊長度：100-300 字元
- 請求超時：60 秒
- 支援語言：主要為中文

## 注意事項
- 確保有穩定的網路連線
- 長文字會自動分割處理
- 某些特殊字元（如『』）會被自動過濾
- 建議定期檢查 API 服務狀態