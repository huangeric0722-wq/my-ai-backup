# UiPath CLI 自動化部署藍圖 (v23.4 On-premises)

## 1. 工具概觀與下載配置
UiPath CLI (通常稱為 `uipcli`) 是實現 RPA CI/CD 的核心工具。針對 23.4 版本，建議使用官方 NuGet 封裝。

### 下載方式
- **來源**: [UiPath Official NuGet Feed](https://pkgs.dev.azure.com/uipath/Public.Feeds/_packaging/UiPath-Official/nuget/v3/index.json)
- **指令**: 
  ```bash
  # 使用 NuGet CLI 下載
  nuget.exe install UiPath.CLI -Version 23.10.8753.33644 -Source "https://pkgs.dev.azure.com/uipath/Public.Feeds/_packaging/UiPath-Official/nuget/v3/index.json"
  ```
- **配置**: 提取後，主程式位於 `tools/uipcli.exe`。建議將其路徑加入系統 PATH 或在 CI/CD 腳本中指定絕對路徑。

---

## 2. 核心指令：PUBLISH 與 UPGRADE

### A. PUBLISH (封裝與部署)
部署分為兩個步驟：`pack` (打包) 與 `deploy` (上傳)。

#### Step 1: Pack (打包)
透過讀取 `project.json` 將專案轉換為 `.nupkg`。
```bash
uipcli package pack "C:\Source\MyRPAProject" ^
    --output "C:\BuildArtifacts" ^
    --version "1.0.5" ^
    --isWorkflowStandard
```

#### Step 2: Deploy (部署至 Orchestrator)
將封裝好的 `.nupkg` 推送到指定的 Orchestrator 資料夾。
```bash
uipcli package deploy "C:\BuildArtifacts\MyRPAProject.1.0.5.nupkg" ^
    "https://uipath.eric-corp.com" ^
    --tenant "Default" ^
    --appId "00000000-0000-0000-0000-000000000000" ^
    --appSecret "YOUR_SECRET" ^
    --folder "Finance_Department"
```

### B. UPGRADE (更新 Process 版本)
部署 Package 後，需更新 Orchestrator 中的 Process (程序) 以使用最新版本。
```bash
uipcli orchestrator process update ^
    --name "MyRPAProcess" ^
    --folder "Finance_Department" ^
    --version "1.0.5" ^
    --url "https://uipath.eric-corp.com" ^
    --tenant "Default" ^
    --appId "..." ^
    --appSecret "..."
```

---

## 3. 專案指定邏輯
`uipcli` 預設以 `project.json` 作為專案定義。
- **路徑指定**: 在 `pack` 指令後直接接資料夾路徑，CLI 會自動尋找該路徑下的 `project.json`。
- **排除檔案**: 可透過 `.uipathignore` 檔案排除不需要打包的開發文件。

---

## 4. On-premises 認證與環境隔離 (API 整合)

### 認證方式：External Applications (推薦)
針對 23.4 On-premises 環境，不再建議使用個人帳號密碼，應於 Orchestrator 中註冊 **External Application (Confidential)**。

1. **註冊位置**: Orchestrator > Admin > Tenants > External Applications。
2. **類型**: Confidential。
3. **Scopes (權限清單)**:
   - `OR.WebAPI.Write` (基本 API 寫入)
   - `OR.Inventory.Write` (用於上傳 Package)
   - `OR.Execution.Write` (用於更新 Process)
   - `OR.Folders.Read` (查詢資料夾)

### 金融業環境隔離應對方案
1. **中繼伺服器 (Jump Host/Runner)**: 在隔離區間部署專用的 Jenkins/GitLab Runner，該機器僅允許透過 HTTPS (443) 存取 Orchestrator API。
2. **代理伺服器 (Proxy)**: 若需透過 Proxy，可設定環境變數：
   - `set HTTP_PROXY=http://proxy.eric-corp.com:8080`
   - `set HTTPS_PROXY=http://proxy.eric-corp.com:8080`
3. **憑證問題**: On-premises 環境若使用自簽憑證 (Self-signed Cert) 需將 Root CA 匯入至 Runner 機械。

---

## 5. TFS 與 UiPath CLI 整合流程

在 Eric 公司的環境中，原始碼儲存於 TFS (Team Foundation Server)。

### A. TFS 指令：代碼拉取 (Checkout/Get)
```bash
# 獲取最新代碼 (Get Latest)
tf get "C:\BuildAgent\MyProject" /recursive /overwrite /noprompt
```

### B. 整合部署腳本 (PowerShell 範例)
```powershell
# 1. TFS 拉取最新代碼
& $tfsPath get $workDir /recursive /overwrite /noprompt

# 2. UiPath 打包與發佈
& $uipcliPath package pack $workDir --output "$workDir\Output" --version $version --isWorkflowStandard
& $uipcliPath package deploy "$workDir\Output\MyProject.$version.nupkg" $orchestratorUrl ...
& $uipcliPath orchestrator process update --name "MyRPAProcess" --version $version ...
```

---

## 6. 權限需求清單
- **Packages**: View, Create
- **Processes**: View, Edit
- **Folders**: View
