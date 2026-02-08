# 財務科 UiPath 專案自動化開發與部署手冊 (Draft)

## 1. 專案目標
實現財務科對帳流程的 RPA 自動化，並透過 UiPath CLI 結合 Eric 公司的 TFS 環境進行 CI/CD 部署。

## 2. 開發階段指令 (UiPath CLI)
專案開發完成後，透過以下步驟進行自動化封裝：

### 2.1 封裝專案 (Pack)
將開發目錄打包為 `.nupkg` 檔案：
```bash
uipcli package pack "/home/node/.openclaw/workspace/projects/uipath-automation" \
    --output "/home/node/.openclaw/workspace/projects/uipath-automation/build" \
    --version "1.0.0" \
    --isWorkflowStandard
```

### 2.2 部署至 Orchestrator (Deploy)
將封裝檔上傳至財務科資料夾：
```bash
uipcli package deploy "/home/node/.openclaw/workspace/projects/uipath-automation/build/Project.1.0.0.nupkg" \
    "https://uipath.eric-corp.com" \
    --tenant "Default" \
    --appId "CLIENT_ID" \
    --appSecret "CLIENT_SECRET" \
    --folder "Finance_Department"
```

## 3. TFS 整合 (CI/CD)
在 Eric 的環境中，需結合 TFS 指令獲取代碼：
```bash
tf get "/home/node/.openclaw/workspace/projects/uipath-automation" /recursive /overwrite /noprompt
```

## 4. 運維與監控
- 透過 Orchestrator API 定時檢查 Job 執行狀態。
- 異常時透過 `message` 工具發送通知至 Eric 的行動端。
