# Observability Phase 3: 全鏈路追蹤 (Distributed Tracing) & OTel 實作報告

## 1. 核心關聯：與 ISSUE 1-10 的連結
在先前的系統監控（Log/Metric）基礎上，Phase 3 的 **全鏈路追蹤 (Distributed Tracing)** 是補完「觀測性金三角」的最後一塊拼圖：
- **從 Log 到 Trace**: 以前我們只有分散的日誌，現在透過 **OpenTelemetry (OTel)** 提供的 `TraceID`，我們可以將 ISSUE 1-10 中提到的所有異步請求串聯起來。
- **瓶頸定位**: 過去在 ISSUE 5 (Database Bottleneck) 只能看到慢查詢，現在透過 Trace Span，可以直接定位是哪一個 Service Call 導致的延遲。

## 2. OpenTelemetry (OTel) 實作重點
- **Instrumentation (儀器化)**: 導入 OTel SDK，對關鍵代碼區塊進行自動/手動埋點。
- **Context Propagation**: 確保 `span_context` 能夠在跨服務傳輸（如 HTTP Header）中不丟失，這對於異步系統尤為關鍵。
- **Exporter 設定**: 採集到的數據將導向 OTel Collector，再轉發至後端存儲。

## 3. APISIX 作為觀測源頭 (Gateway Level)
- **源頭追蹤**: 正如 Eric 所規劃，APISIX 作為所有外部請求的入口（Port 443），將在此生成首個 `root_span`。
- **ELK 集成**: 使用 APISIX 的 `elasticsearch-logger` 插件，將 Gateway 層級的日誌直接推送到 ELK。
- **APM 集成**: APISIX 原生支援 `opentelemetry` 插件，負責將請求的流量資訊直接匯入 APM 系統。

## 4. 基礎架構規劃 (Eric's Vision)
- **架構模式**: `Client` --(443)--> `APISIX` --(Internal)--> `Backend Services`
- **優勢**: 
    1. **安全收斂**: 全域只需開放 443 端口。
    2. **觀測性統一**: 在 APISIX 層級完成認證、限流、以及「全鏈路追蹤」的發起。
    3. **靈活性**: 透過 APISIX 的反向代理，可以隨時更換後端微服務而不影響對外接口。

---
*Next Action: 深入研究 APISIX 的 opentelemetry 插件配置與 ELK 採集規則。*
