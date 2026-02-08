# UIPath 安全檢查清單 (Security Checklist)

## 1. 憑據管理 (Credential Management)
- [ ] **拒絕硬編碼**：嚴禁在 .xaml 檔案中以字串形式儲存密碼或金鑰。
- [ ] **Orchestrator Assets**：所有敏感資訊必須儲存於 Orchestrator Assets (Credential 類型)。
- [ ] **CyberArk 整合**：大型企業環境建議整合外部憑據管理系統。

## 2. 機器人執行安全 (Robot Execution)
- [ ] **最小權限原則 (PoLP)**：機器人使用的 Windows/系統帳號僅應具備完成任務所需的最小權限。
- [ ] **獨立身分**：開發、測試、生產環境應使用不同的機器人帳號。
- [ ] **遠端桌面安全**：若使用 RDP 執行機器人，需確保傳輸加密且連線權限受限。

## 3. 程式碼與套件安全 (Code & Package Security)
- [ ] **官方來源**：僅從 UiPath 官方或受信任的私人倉庫安裝 NuGet 套件。
- [ ] **輸入驗證**：對來自外部 (如 Excel, Email, API) 的數據進行類型檢查與異常篩選。
- [ ] **例外處理**：實施 `Try Catch` 確保錯誤發生時敏感數據不會洩露於日誌中。

## 4. 監控與日誌 (Monitoring & Logging)
- [ ] **敏感資訊遮蔽**：在 `Log Message` 活動中，確保不包含個人隱私或財務機敏資訊。
- [ ] **審計日誌 (Audit Logs)**：確保 Orchestrator 的審計追蹤功能已開啟，追蹤機器人的所有操作。

## 5. 基礎架構與更新 (Infrastructure & Updates)
- [ ] **版本維護**：定期更新 UiPath Studio, Robot 及 Orchestrator 以修補安全漏洞。
- [ ] **連線加密**：機器人與 Orchestrator 之間必須使用 HTTPS/TLS 加密連線。
