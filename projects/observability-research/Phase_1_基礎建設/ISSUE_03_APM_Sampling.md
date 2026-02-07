# ISSUE_03: APM 採樣策略研究報告

**文件狀態**：草稿 / 基礎建設科  
**負責人**：基礎建設科長  
**目標系統**：高併發、大量交易後端服務  

---

## 1. 研究目標
在高併發與大量交易（High-throughput）的環境下，全量追蹤（Full Tracing）會導致不可接受的 CPU/記憶體開銷、網路帶寬壓力以及後端存儲成本。本研究旨在探討如何在「保留關鍵追蹤細節」與「降低系統負擔」之間取得平衡，並確保在異常發生時具備 100% 的可追蹤性。

---

## 2. 採樣策略深度對比：Fixed Rate vs. Tail-based Sampling

### 固定採樣 (Fixed Rate / Head-based Sampling)
*   **運作機制**：在請求進入系統的第一站（入口網關或首個服務）就決定是否採樣。通常基於機率（如 5%）或速率限制（每秒 100 個）。
*   **優點**：
    *   **效能極佳**：決策極快，不佔用後續節點的計算資源。
    *   **實作簡單**：大多數開源 SDK（OpenTelemetry, Jaeger）原生支持。
*   **缺點**：
    *   **盲目性**：無法預知該請求是否會發生錯誤或出現延遲。
    *   **低頻異常遺失**：如果某個 Bug 只發生在 0.1% 的請求中，5% 的固定採樣率極大機率會錯過它。

### 分層採樣 / 後驗採樣 (Tail-based Sampling)
*   **運作機制**：先暫存所有請求的追蹤片段（Spans），待整個追蹤完成後，根據預設規則（如：是否包含 Error、延遲是否 > 500ms）決定是否將其永久保存。
*   **優點**：
    *   **精準度高**：能確保所有的異常與慢請求都被記錄。
    *   **資源利用率**：不浪費空間存儲無意義的「成功且快速」的請求。
*   **缺點**：
    *   **基礎架構要求高**：需要中間層（如 OpenTelemetry Collector）來緩存和處理未完成的追蹤，會增加內存消耗。

### 決策建議
對於基礎服務，建議採用 **混合模式**：在 Collector 端實施 Tail-based Sampling，針對正常請求維持極低採樣（<1%），針對異常與慢請求則實施 100% 採樣。

---

## 3. 異常優先採樣邏輯 (Error-First Logic)
為了確保 Error 發生時一定被記錄，必須從以下兩個層級加強：

1.  **SDK 層級 (Partial Failover)**：
    *   當服務偵測到 HTTP 5xx 或未捕獲異常時，手動觸發 `span.SetStatus(Error)`。
    *   配合支持「標記觸發」的 Collector，即使原始請求未被隨機選中，一旦標記為 Error，Collector 將回溯保留該追蹤。
2.  **Collector 層級 (Tail-based Policy)**：
    *   配置 `status_code` 過濾器，優先保留所有狀態碼不為 OK 的 Traces。
    *   配置 `string_attribute` 過濾器，攔截特定錯誤關鍵字（如 `java.lang.OutOfMemoryError`）。

---

## 4. 動態採樣設定 (Dynamic Sampling)

針對特定路徑或用戶的精確控制，可避免「一刀切」導致的監控死角：

*   **路徑優先權 (Endpoint-based)**：
    *   **核心路徑**：如 `/api/checkout` (下單)、`/api/payment`，採樣率應設高（如 50% - 100%）。
    *   **高頻心跳**：如 `/health`、`/metrics`，採樣率應設為 0% 或極低（0.01%）。
*   **特定用戶/金鑰 (Context-based)**：
    *   **VIP/企業客戶**：根據 Header 中的 `X-Tenant-ID` 進行動態提升採樣率，確保重要客戶的請求軌跡完整。
    *   **測試流量**：針對 `User-Agent: LoadTester` 的請求，實施 100% 採樣以利壓測分析。

---

## 5. 給 Eric 的實作建議：高負載系統防護措施

Eric，在實作上述策略時，請務必加入以下「保險絲」機制：

1.  **自適應限流 (Adaptive Throttling)**：
    *   如果 APM Agent 偵測到系統 CPU 超過 80% 或內存不足，應自動將採樣率降至最低（甚至關閉），優先保證業務可用性。
2.  **非同步輸出 (Async Export)**：
    *   所有的 Trace 數據傳輸必須使用非同步隊列（如 OTLP over GRPC + Internal Queue）。
    *   當隊列滿時，直接**丟棄數據**（Drop packets），絕對不能阻塞主執行緒。
3.  **帶寬上限 (Data Volume Cap)**：
    *   在 Collector 端設定每日傳輸總量上限，防止因為某個突發 Bug 產生海量錯誤 Log 導致存儲成本爆炸。
4.  **分片緩衝 (Batching & Compression)**：
    *   在發送前進行批次處理並啟用 Zstd/Gzip 壓縮，減少網絡 IO 頻次。

---

**報告完成**  
*基礎建設科長 簽署*  
*2026-02-07*
