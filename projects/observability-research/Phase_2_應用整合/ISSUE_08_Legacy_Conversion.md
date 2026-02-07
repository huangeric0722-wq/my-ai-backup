# ISSUE_08: 舊系統 Log 結構化轉換研究報告

## 1. 研究目標
針對無法修改原始碼的舊系統（Legacy Systems），建立一套自動化日誌處理機制。透過非侵入式（Non-invasive）的技術手段，將分散且雜亂的文字日誌（Unstructured Logs）即時轉換為標準化的 JSON 格式，以符合全域觀測性（Observability）架構。

## 2. 技術組件解析

### 2.1 Filebeat 處理流程與 Grok 匹配原理
Filebeat 作為輕量化日誌收集器，負責第一線的資料擷取。
- **處理流程**：`Harvester (讀取檔案)` -> `Input (組建事件)` -> `Processor (初步修飾)` -> `Output (傳送至 Logstash/Elasticsearch)`。
- **Grok 原理**：Grok 是基於正規表達式（Regex）的模式匹配工具。它預定義了超過 120 種常用的模式（如 `IP`, `NUMBER`, `DATESTAMP`），允許使用者透過 `%{SYNTAX:SEMANTIC}` 的語法將文字片段標籤化。
    - *優點*：效能優於純粹的 Logstash 全規則處理。
    - *場景*：適用於格式相對固定的邊緣日誌初步過濾。

### 2.2 Logstash 進階拆解與欄位對齊
當日誌邏輯複雜、需要跨欄位運算或調度外部 API 時，Logstash 是核心工具。
- **正規表達式拆解**：利用 `grok` 插件進行深度嵌套匹配，或使用 `dissect` 插件處理分隔符固定的日誌（效能更高）。
- **欄位對齊**：透過 `mutate` 插件進行 `rename`, `copy`, `convert`（型態轉換）等動作，確保輸出符合 `ISSUE_01` 定義的標準 Schema。
- **豐富化 (Enrichment)**：如 `geoip` 增加地理位置，`translate` 將代碼轉為人類可讀字串。

### 2.3 Ingest Pipeline (Elasticsearch 內建處理器)
在資料進入索引前，由 Elasticsearch 節點直接處理。
- **應用場景**：
    - 降低 Filebeat/Logstash 的維運壓力。
    - 快速修復微小的欄位錯誤（如日期格式修正）。
    - 處理簡單的字串分割（Split）與標籤附加（Tagging）。

---

## 3. 實作範例：雜亂日誌轉換
**原始日誌 (Legacy Log):**
`2023-10-27 10:45:12 [ERROR] User:10293 failed to login from 192.168.1.50 - DB_TIMEOUT`

**Grok 模式:**
`%{TIMESTAMP_ISO8601:log_time} \[%{LOGLEVEL:level}\] User:%{NUMBER:user_id} %{GREEDYDATA:msg} %{IP:src_ip} - %{WORD:error_code}`

**轉換後符合 ISSUE_01 規範的 JSON:**
```json
{
  "@timestamp": "2023-10-27T10:45:12.000Z",
  "log": {
    "level": "ERROR",
    "logger": "LegacySystem"
  },
  "user": {
    "id": "10293"
  },
  "source": {
    "ip": "192.168.1.50"
  },
  "message": "failed to login",
  "error": {
    "code": "DB_TIMEOUT"
  },
  "event": {
    "kind": "event",
    "category": ["authentication"]
  }
}
```

---

## 4. 給 Eric 的實作建議

### 4.1 多行日誌（Multiline）處理
舊系統常見的 Java Stack Trace 或 SQL 報表會跨越多行。
- **建議位置**：**務必在 Filebeat 端處理**。如果在 Logstash 或 ES 端處理，在高併發下日誌行會錯位。
- **配置示例**：
  ```yaml
  multiline.type: pattern
  multiline.pattern: '^\d{4}-\d{2}-\d{2}' # 以日期開頭為新行
  multiline.negate: true
  multiline.match: after
  ```

### 4.2 性能瓶頸優化
- **避免過度匹配**：Grok 模式越長、正則越複雜，CPU 負載越高。優先使用 `dissect` 處理簡單結構。
- **自定義 Grok 錨點**：在 Grok 語法前後加上 `^` 與 `$`，限制搜尋範圍。
- **批次寫入**：調整 `bulk_max_size` 以提高寫入吞吐量。
- **監控**：啟用 Logstash 的 `Monitoring` 功能，觀察 `worker` 利用率，必要時水平擴充。

---
**簽署人：** 應用整合科長
**日期：** 2026-02-07
