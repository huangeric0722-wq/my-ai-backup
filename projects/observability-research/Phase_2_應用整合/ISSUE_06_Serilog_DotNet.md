# ISSUE_06: Serilog .NET 整合最佳實踐研究報告

## 1. 研究目標
在 .NET 應用程式中建立一套高效、非同步且具備高度擴展性的日誌體系。確保日誌輸出符合「第一階段 Schema」結構化規範，並針對金融業對穩定性與資料完整性的極高要求進行優化。

## 2. NuGet 套件選擇建議

為了達成結構化日誌與高效能目標，建議安裝以下組合：

*   **核心整合**:
    *   `Serilog.AspNetCore`: 官方提供的 ASP.NET Core 深度整合套件，自動處理請求日誌。
    *   `Serilog.Settings.Configuration`: 允許從 `appsettings.json` 讀取完整配置。
*   **效能優化**:
    *   `Serilog.Sinks.Async`: 非同步包裝器，用於將日誌寫入操作移出主執行緒。
*   **輸出端點 (Sinks)**:
    *   `Serilog.Sinks.File`: 用於本地存檔，作為第一道故障隔離。
    *   `Serilog.Sinks.Elasticsearch`: 直接寫入 ES 或 Logstash（若架構允許）。
    *   `Serilog.Sinks.Console`: 開發環境調適用。
*   **資訊擴充 (Enrichers)**:
    *   `Serilog.Enrichers.Environment`: 自動注入 MachineName 等。
    *   `Serilog.Enrichers.Process`: 自動注入 ProcessId。
    *   `Serilog.Enrichers.Thread`: 自動注入 ThreadId。

## 3. appsettings.json 配置範例

透過配置檔實現「不改程式碼即可調整日誌行為」：

```json
{
  "Serilog": {
    "Using": [ "Serilog.Sinks.Console", "Serilog.Sinks.File", "Serilog.Sinks.Async" ],
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    },
    "Enrich": [ "FromLogContext", "WithMachineName", "WithThreadId" ],
    "Properties": {
      "Application": "PaymentGateway-API",
      "Version": "1.2.0-rc1",
      "Environment": "Production"
    },
    "WriteTo": [
      {
        "Name": "Async",
        "Args": {
          "configure": [
            {
              "Name": "Console",
              "Args": {
                "formatter": "Serilog.Formatting.Json.JsonFormatter, Serilog"
              }
            },
            {
              "Name": "File",
              "Args": {
                "path": "Logs/log-.txt",
                "rollingInterval": "Day",
                "formatter": "Serilog.Formatting.Json.JsonFormatter, Serilog",
                "bufferSize": 1024,
                "flushToDiskInterval": "00:00:01"
              }
            }
          ]
        }
      }
    ]
  }
}
```

## 4. 如何實現非同步寫入 (Async Sink)

### 為什麼需要 Async Sink？
預設情況下，許多 Sink (如 File 或 Network) 是同步執行的。在高併發場景下，若磁碟 I/O 變慢或網路延遲，會直接阻塞應用程式的 Request Pipeline。

### 程式碼實現範例
在 `Program.cs` 中，建議使用以下模式：

```csharp
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .WriteTo.Async(a => a.File("logs/audit.log", rollingInterval: RollingInterval.Day))
    .CreateLogger();

builder.Host.UseSerilog();
```

**關鍵參數說明**:
- `bufferSize`: 緩衝區大小（預設 10,000 筆）。
- `blockWhenFull`: 當緩衝區滿時是否阻塞（金融業建議設為 `true` 以確保日誌不遺失，一般網路應用設為 `false` 優先保證可用性）。

## 5. 優雅地注入全局欄位 (Schema 符合)

為了符合第一階段 Schema（包含 AppName, Version, TraceId 等），有三種層級的注入方式：

1.  **靜態全局欄位**: 如上文 `appsettings.json` 中的 `Properties` 區塊，適合定義 AppName。
2.  **啟動時動態欄位**:
    ```csharp
    Log.Logger = new LoggerConfiguration()
        .Enrich.WithProperty("Version", Assembly.GetExecutingAssembly().GetName().Version.ToString())
        .CreateLogger();
    ```
3.  **請求級別欄位 (LogContext)**:
    使用 Middleware 自動注入每筆請求的 `TraceId` 或 `UserId`：
    ```csharp
    using (LogContext.PushProperty("TransactionId", currentId))
    {
        _logger.LogInformation("Processing transaction...");
    }
    ```

## 6. 給 Eric 的實作建議（金融業穩定性優先）

針對金融業環境，穩定性與可追溯性高於一切，建議採取以下配置策略：

1.  **「本地先行」原則**: 
    務必配置 `Serilog.Sinks.File` 並使用 `JsonFormatter`。即使遠端日誌中心（ES/Splunk）斷線，本地磁碟仍保有最完整的稽核軌跡。
2.  **設置緩衝限制 (Bounded Capacity)**:
    非同步寫入時，必須限制記憶體緩衝區大小，避免在極端異常（如日誌系統掛掉）時導致應用程式 OOM (Out of Memory)。
3.  **使用 Audit Sink (關鍵交易)**:
    對於涉及帳務、金流的關鍵代碼，可考慮使用 `WriteTo.AuditTo`。Audit Sink 是同步的且會拋出異常，確保「日誌寫入失敗，交易就報錯」，符合金融合規性。
4.  **結構化一致性**:
    強制要求所有日誌物件使用匿名類別或 DTO，嚴禁使用字串拼接。
    *   ❌ `_logger.LogInformation("User " + id + " login")`
    *   ✅ `_logger.LogInformation("User {UserId} login", id)`
5.  **健康檢查整合**:
    將日誌系統的狀態納入應用程式的 Health Check，當本地磁碟空間不足或非同步緩衝區持續飽和時，發出告警。

---
**報告撰寫人**: 應用整合科長
**日期**: 2026-02-07
