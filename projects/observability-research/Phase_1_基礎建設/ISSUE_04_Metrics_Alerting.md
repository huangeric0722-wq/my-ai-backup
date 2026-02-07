# ISSUE_04: Metrics 警報與動態閾值研究報告

## 1. 研究目標
建立一套具備自我適應能力、能根據業務波動調整閾值，並能有效過濾噪點、減少無效告警（Alert Fatigue）的智慧化監控機制。

## 2. 傳統靜態閾值 (Static Thresholds) 的缺陷分析
- **無法適應業務週期性**：例如電商網站在促銷期間或深夜時段的流量基礎值完全不同，靜態閾值易導致白天頻繁誤報或深夜漏報。
- **維護成本極高**：隨著微服務數量增加，為每個服務手動設定閾值幾乎是不可能的任務。
- **靈敏度與準確度的拉鋸**：設定太嚴格會造成告警風暴；太寬鬆則會導致反應遲緩。

## 3. 動態閾值原理與異常檢測
### 3.1 基於 Holt-Winters 的時間序列預測
- **原理**：利用「三重指數平滑法」考慮數據的水平 (Level)、趨勢 (Trend) 與季節性 (Seasonality)。
- **適用場景**：具有明顯週期性（如日、週循環）的指標，如 QPS、登入人數。
- **演算法**：透過最近的數據點預測下一個點的值，並建立一個信賴區間。當實際觀測值超出 `預測值 ± N * 標準差` 時觸發告警。

### 3.2 基於百分位數 (Percentiles) 的異常檢測
- **原理**：分析過去 7-30 天的歷史數據分佈，計算 P95, P99 或中位數。
- **適用場景**：分佈不均勻或有長尾效應的指標，如 API 回應時間 (Latency)。
- **動態調整**：閾值不再是一個死數字，而是 `History_P99 * 1.5`。

## 4. 告警抑止 (Inhibition) 與收斂 (Convergence) 策略
為了避免 Alert Fatigue，必須在架構層面實作以下機制：

### 4.1 告警抑止 (Alert Inhibition)
- **邏輯**：當核心組件（如 Data Center Down）發生故障時，自動暫停其下游組件（如 API Error Rate）的告警。
- **優點**：減少冗餘告警，讓維運人員直擊根因。

### 4.2 告警收斂 (Alert Convergence / Grouping)
- **維度聚合**：將同一時間段內、同一 Label（如 `cluster: prod`, `service: user-api`）的多個告警合併為一則通知。
- **延遲聚合**：設定 `group_wait`，在短時間內收集更多相關告警，打包發送。

### 4.3 靜默 (Silences) 與節流 (Throttling)
- **定期維護**：在 CI/CD 期間或已知維護時段自動觸發 API 靜默告警。
- **指數退避**：若問題未解決，後續重複告警的頻率應逐漸降低。

## 5. 給 Eric 的實作建議與配置策略

### 5.1 Prometheus + Grafana 方案
- **推薦工具**：Prometheus `predict_linear()` 函數（基礎預測）或接入 **Prometheus-Anomaly-Detector** (基於 Python/Prophet)。
- **配置策略**：
  - 使用 `record_rules` 預先計算歷史均值。
  - 在 Grafana 中利用 Alerting 配合「Dynamic Thresholds」功能。
  - 利用 Alertmanager 的 `inhibition_rules` 建立依賴鏈。

### 5.2 ELK Watcher 方案
- **推薦工具**：Elasticsearch Machine Learning (ML) Jobs。
- **配置策略**：
  - 建立 **Anomaly Detection Job**，讓 Elastic 自動學習數據模型。
  - Watcher 調用 `anomaly_score`；當分數大於 75 時才發送 Critical 告警。
  - 針對日誌中的錯誤，使用 `composite` aggregation 進行收斂，避免單一 Error 爆量。

### 5.3 實作優先順序
1. **第一步**：針對核心黃金指標（Latency, Traffic, Errors, Saturation）建立基於百分位數的基礎動態閾值。
2. **第二步**：配置 Alertmanager 的 Grouping 機制，將「一萬封信」變成「一封摘要」。
3. **第三步**：引入 Holt-Winters 等 ML 模型處理高維度、具季節性的業務指標。

---
**撰寫人**：基礎建設科長
**日期**：2026-02-07
