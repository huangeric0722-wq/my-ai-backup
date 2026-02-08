# 研究報告：全鏈路追蹤分析 (Trace Analysis) 與 OpenTelemetry 實作

## 1. OpenTelemetry (OTel) 核心架構分析

OpenTelemetry 是一個開源的觀測性框架，旨在提供統一的標準來採集、處理和導出遙測數據。其核心包含四大支柱：

### 1.1 Traces (追蹤)
Trace 代表一個請求在分散式系統中移動的全過程。一個 Trace 是由多個 **Spans** 組成的有向無環圖 (DAG)。
- **作用**：理解請求在服務間的流轉、定位效能瓶頸（哪個服務慢）以及故障點。

### 1.2 Spans (跨度)
Span 是 Trace 的基本組成單位，代表系統中的一個邏輯操作（如：SQL 查詢、HTTP 請求、函數執行）。
- **關鍵屬性**：
    - `TraceID`：關聯所有屬於同一個請求的 Spans。
    - `SpanID`：當前操作的唯一標識。
    - `ParentSpanID`：標識父操作，建立層級關係。
    - `Attributes`：鍵值對（如 `http.method=GET`），用於過濾和分析。
    - `Events`：Span 內發生的特定時間點事件（如：Exception 訊息）。

### 1.3 Metrics (指標)
Metrics 是關於系統在一段時間內的數值聚合。
- **類型**：Counter (計數器), Gauge (測量值), Histogram (直方圖)。
- **作用**：監控系統健康狀況、吞吐量、記憶體使用率等。

### 1.4 Logs (日誌)
OTel 將 Log 納入標準化模型，並強調 Log 與 Trace/Span 的關聯（透過 TraceID 注入）。

---

## 2. Context Propagation (上下文傳遞) 原理

在分散式系統中，請求會跨越多個服務。為了維持同一條 Trace，必須在服務之間傳遞追蹤上下文（Context）。

### 2.1 傳遞機制
- **Carrier (載體)**：通常是 HTTP Header 或 消息隊列的 Metadata。
- **Propagators (傳播器)**：定義了如何將 Context 注入 (Inject) 到載體中，以及如何從載體中提取 (Extract) Context。

### 2.2 W3C Trace Context 標準
目前業界主流使用 W3C 標準，主要包含兩個 Header：
1. **`traceparent`**：包含版本、TraceID、ParentSpanID 和 Flags。
    - 格式：`00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`
2. **`tracestate`**：用於傳遞特定供應商（如 Jaeger, New Relic）的資訊。

### 2.3 工作流程
1. **Service A** 啟動一個新 Trace，生成 `TraceID`。
2. **Service A** 發送 HTTP 請求給 **Service B**，並在 Header 加入 `traceparent`。
3. **Service B** 接收請求，**Extract** 其中的 `TraceID` 和 `SpanID`，將其設為新 Span 的父節點。
4. 最終所有服務產生的 Span 都擁有相同的 `TraceID`。

---

## 3. 實作範例：.NET (C#) OTel 配置

以下示範如何配置 .NET 應用程式將 Trace 導向 **Jaeger**。

### 3.1 安裝 NuGet 包
```bash
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Instrumentation.AspNetCore
dotnet add package OpenTelemetry.Instrumentation.Http
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol
```

### 3.2 Program.cs 配置
```csharp
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

// 定義資源資訊 (Service Name)
var serviceName = "MyDotNetService";
var serviceVersion = "1.0.0";

builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder =>
    {
        tracerProviderBuilder
            .AddSource(serviceName)
            .SetResourceBuilder(
                ResourceBuilder.CreateDefault()
                    .AddService(serviceName: serviceName, serviceVersion: serviceVersion))
            .AddAspNetCoreInstrumentation() // 自動收集 ASP.NET Core 請求
            .AddHttpClientInstrumentation() // 自動收集對外 HTTP 請求
            .AddOtlpExporter(opt =>
            {
                // 將數據導向 Jaeger (OTLP 接收器預設端口 4317)
                opt.Endpoint = new Uri("http://localhost:4317");
                opt.Protocol = OpenTelemetry.Exporter.OTLP.OtlpExportProtocol.Grpc;
            });
    });

var app = builder.Build();

app.MapGet("/", () => "Hello Trace!");

app.Run();
```

---

## 4. 研究結論
OpenTelemetry 透過標準化的 OTLP 協議與 Context Propagation 解決了分散式系統中的觀測碎片化問題。在 .NET 生態系中，OTel 已成為原生支持的觀測標準，透過 SDK 的自動注入 (Instrumentation)，開發者可以極低成本地獲得全鏈路監控能力。
