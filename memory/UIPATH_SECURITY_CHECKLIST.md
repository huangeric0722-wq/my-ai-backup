# UiPath Security Checklist (Eric's Private Edition)
Version: 1.0 | Date: 2026-02-07 (Jarvis Self-Study)

## 1. Credentials & Secrets Management (核心)
- [ ] **No Hardcoded Credentials**: 嚴禁在 XAML 或變數預設值中寫入密碼、API Key 或 Token。
- [ ] **Orchestrator Assets**: 所有機敏資訊必須存放在 Orchestrator Assets (Credential 類型)。
- [ ] **SecureString Usage**: 確保在 Studio 中使用 `System.Security.SecureString` 處理密碼，避免明文留存在記憶體中。
- [ ] **Credential Manager**: 若不使用 Orchestrator，應串接 CyberArk 或 Azure Key Vault 等外部保險箱。

## 2. Infrastructure & Environment (環境)
- [ ] **Robot Isolation**: 運行 Robot 的機器應與開發環境隔離，且不具備非必要的網路存取權限。
- [ ] **TLS Encryption**: 確保 Robot 與 Orchestrator 之間的通訊全程使用 TLS 1.2+ 加密。
- [ ] **Least Privilege**: Robot 帳號僅具備完成任務所需的最小權限（例如：僅對特定資料夾有讀寫權限）。

## 3. Workflow & Code Quality (工作流)
- [ ] **UiPath Workflow Analyzer**: 部署前必須通過靜態掃描，啟用以下規則：
    - `ST-SEC-001`: 硬編碼密碼檢查。
    - `ST-SEC-002`: 安全字串使用檢查。
- [ ] **Logging Sensitivity**: 嚴禁在 Log Message 中輸出帳號、個資或機敏業務數據。
- [ ] **Input Validation**: 對外部輸入（如 Excel, Email 内容）進行驗證，防止注入攻擊。

## 4. Operational Security (維運)
- [ ] **Audit Logs**: 定期審查 Orchestrator 的審計日誌，監控異常的 Job 啟動或 Assets 存取。
- [ ] **Package Signing**: 啟用 NuGet 套件簽名機制，確保 Robot 運行的 Package 未經篡改。
- [ ] **Automatic Screen Lock**: 確保 Unattended Robot 在斷開連接時會自動鎖定螢幕。
