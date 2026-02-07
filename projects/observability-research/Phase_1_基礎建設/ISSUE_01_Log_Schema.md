# ISSUE_01: 跨平台結構化日誌 Schema 規範 (Log Schema Specification)

## 1. 研究目標 (Research Goal)
為了達成企業級的可觀測性（Observability），本研究旨在定義一套通用的結構化日誌（Structured Logging）標準。此標準必須相容於 **.NET**、**UiPath** 與 **Python** 等多樣化技術棧，確保所有應用的日誌進入 ELK (Elasticsearch, Logstash, Kibana) 堆疊後，能夠進行精準的關聯分析、效能監控與異常告警。

---

## 2. 欄位定義規範

### 2.1 命名慣例 (Naming Convention)
為優化 ELK 搜尋效能與 Kibana 查詢體驗，所有欄位遵循以下規範：
- **全小寫 (Lowercase)**：避免因大小寫區分導致的查詢混淆。
- **底線分隔 (Snake Case)**：例如 `app_name` 而非 `appName`。
- **型別一致性**：跨應用的相同欄位必須具備一致的資料型別。

### 2.2 核心必要欄位 (Core Fields)
這些欄位是所有日誌的基本組成，用於過濾與基本統計。

| 欄位名稱 | 型別 | 描述 | 範例 |
| :--- | :--- | :--- | :--- |
| `@timestamp` | Date | ISO8601 格式的觸發時間 (UTC) | `2026-02-07T16:09:00.000Z` |
| `log_level` | Keyword | 日誌等級 (TRACE, DEBUG, INFO, WARN, ERROR, FATAL) | `INFO` |
| `message` | Text | 描述性訊息 | `User login successful` |
| `correlation_id` | Keyword | 跨系統/流程的追蹤 ID (UUID/GUID) | `a1b2c3d4-e5f6...` |
| `app_name` | Keyword | 應用程式或專案名稱 | `order-service` |
| `env` | Keyword | 運行環境 (prod, staging, dev, uat) | `prod` |

### 2.3 擴展業務欄位 (Extended Fields)
用於進階分析、障礙排除及效能剖析。

| 欄位名稱 | 型別 | 描述 | 範例 |
| :--- | :--- | :--- | :--- |
| `user_id` | Keyword | 觸發操作的使用者標識 | `user_9527` |
| `action_name` | Keyword | 具體的業務動作或 API 端點 | `CreateOrder` |
| `elapsed_time_ms`| Long | 該操作耗費的時間 (毫秒) | `125` |
| `exception_detail`| Text | 完整的錯誤堆疊資訊 (僅在 ERROR 時出現) | `System.NullReferenceException...` |
| `host_name` | Keyword | 執行該程式的伺服器或節點名稱 | `node-01` |
| `version` | Keyword | 應用程式版本號 | `v1.2.3` |

---

## 3. 符合規範之 JSON 範例

```json
{
  "@timestamp": "2026-02-07T16:10:45.123Z",
  "log_level": "ERROR",
  "message": "Failed to process payment request",
  "correlation_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "app_name": "payment-gateway-api",
  "env": "prod",
  "user_id": "cust_8801",
  "action_name": "ProcessPayment",
  "elapsed_time_ms": 1500,
  "exception_detail": "SocketTimeoutException: Read timed out at com.api.client.send...",
  "host_name": "web-srv-01",
  "version": "2.1.0"
}
```

---

## 4. 給 Eric 的實作建議 (Implementation Guidance)

為了確保 Schema 能夠順利落地，Eric 在實作時應注意以下技術細節：

### A. .NET 實作建議
- **使用 Serilog**：推薦使用 `Serilog` 搭配 `Serilog.Formatting.Compact` 或自定義 `ITextFormatter` 來輸出 JSON。
- **Enrichers**：利用 `WithCorrelationId()` 等 Enrichers 自動附加環境與應用資訊。

### B. Python 實作建議
- **python-json-logger**：標準庫 `logging` 配合 `python-json-logger` 庫，可以輕易將日誌轉換為符合規範的 JSON 格式。
- **ContextVars**：在異步框架（如 FastAPI）中使用 `ContextVars` 來傳遞 `correlation_id`。

### C. UiPath 實作建議
- **Custom Fields**：使用 "Add Log Fields" Activity 將 `correlation_id` 與 `action_name` 加入 Execution Log。
- **Log Level**：確保 Exception 發生時使用 `Error` 等級，並將 `exception.ToString()` 傳入 `exception_detail` 欄位。

### D. 集中化處理 (Log Collection)
- **Filebeat/Logstash**：在收集端應配置解析規則，確保 `@timestamp` 正確對齊，並針對 `correlation_id` 建立索引（Keyword），以利於 Kibana 進行快速檢索。

---
**核准人：** 基礎建設科長
**日期：** 2026-02-07
