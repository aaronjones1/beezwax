export type ChartType = "line" | "bar" | "table"

export interface KqlCardConfig {
  id: string
  title: string
  section: string
  type: ChartType
  description?: string
  defaultWindow: "24h" | "7d" | "14d" | "30d"
  granularity?: string
  highlightThreshold?: {
    type: "warning"
    value: number
  }
  columns?: string[]
  tooltip?: string[]
  yAxisLabel?: string
  query: string
  clickThrough?: string
}

export const dashboardTitle = "WRP Staging - Operational Health"

export const dashboardSections = [
  "Service Reliability",
  "Platform Stability",
  "App Quality (AppCenter)",
  "Log Analytics Cost & Ingestion",
]

export const dashboardCards: KqlCardConfig[] = [
  {
    id: "stderr-error-rate",
    title: "Stderr Error Rate (7 Days)",
    section: "Service Reliability",
    type: "line",
    defaultWindow: "7d",
    granularity: "1 hour",
    yAxisLabel: "Error rate",
    tooltip: ["Total logs", "Stderr count"],
    highlightThreshold: {
      type: "warning",
      value: 0.05,
    },
    query: `let window = 7d;
ContainerAppConsoleLogs_CL
| where TimeGenerated >= ago(window)
| extend isStderr = tostring(Stream_s) =~ "stderr"
| summarize Total=count(), Stderr=countif(isStderr) by bin(TimeGenerated, 1h)
| extend ErrorRate = todouble(Stderr) / todouble(Total)
| order by TimeGenerated asc`,
    clickThrough: `let window = 7d;
ContainerAppConsoleLogs_CL
| where TimeGenerated >= ago(window)
| where tostring(Stream_s) =~ "stderr"
| order by TimeGenerated desc
| take 200`,
  },
  {
    id: "top-services-error-rate",
    title: "Top Services by Error Rate (7 Days)",
    section: "Service Reliability",
    type: "bar",
    defaultWindow: "7d",
    highlightThreshold: {
      type: "warning",
      value: 0.05,
    },
    columns: ["Service", "Error rate", "Stderr count"],
    query: `let window = 7d;
ContainerAppConsoleLogs_CL
| where TimeGenerated >= ago(window)
| extend isStderr = tostring(Stream_s) =~ "stderr"
| summarize Total=count(), Stderr=countif(isStderr) by tostring(ContainerAppName_s)
| where Total >= 50
| extend ErrorRate = todouble(Stderr) / todouble(Total)
| order by ErrorRate desc, Stderr desc
| take 10`,
    clickThrough: `let window = 7d;
ContainerAppConsoleLogs_CL
| where TimeGenerated >= ago(window)
| where tostring(Stream_s) =~ "stderr"
| order by TimeGenerated desc
| take 200`,
  },
  {
    id: "top-error-messages",
    title: "Top Error Messages (24 Hours)",
    section: "Service Reliability",
    type: "table",
    defaultWindow: "24h",
    columns: ["Message", "Count"],
    query: `let window = 24h;
ContainerAppConsoleLogs_CL
| where TimeGenerated >= ago(window)
| where tostring(Stream_s) =~ "stderr"
| summarize Count=count() by tostring(Log_s)
| order by Count desc
| take 20`,
    clickThrough: `let window = 24h;
ContainerAppConsoleLogs_CL
| where TimeGenerated >= ago(window)
| where tostring(Stream_s) =~ "stderr"
| order by TimeGenerated desc
| take 200`,
  },
  {
    id: "critical-platform-events",
    title: "Critical Platform Events (7 Days)",
    section: "Platform Stability",
    type: "line",
    defaultWindow: "7d",
    granularity: "1 hour",
    yAxisLabel: "Events",
    query: `let window = 7d;
ContainerAppSystemLogs_CL
| where TimeGenerated >= ago(window)
| extend reason = tostring(Reason_s)
| extend lvl = tostring(Level)
| extend msg = tostring(Log_s)
| where lvl in~ ("Error", "Critical")
   or reason has_any ("OOM", "Crash", "Unhealthy", "Killing", "BackOff", "Failed")
   or msg has_any ("restart", "restarted", "crash", "killed", "oom", "unhealthy", "probe", "evicted")
| summarize Events=count() by bin(TimeGenerated, 1h)
| order by TimeGenerated asc`,
    clickThrough: `let window = 7d;
ContainerAppSystemLogs_CL
| where TimeGenerated >= ago(window)
| extend reason = tostring(Reason_s)
| extend lvl = tostring(Level)
| extend msg = tostring(Log_s)
| where lvl in~ ("Error", "Critical")
   or reason has_any ("OOM", "Crash", "Unhealthy", "Killing", "BackOff", "Failed")
   or msg has_any ("restart", "restarted", "crash", "killed", "oom", "unhealthy", "probe", "evicted")
| order by TimeGenerated desc
| take 200`,
  },
  {
    id: "most-unstable-services",
    title: "Most Unstable Services (7 Days)",
    section: "Platform Stability",
    type: "table",
    defaultWindow: "7d",
    columns: ["Service", "Reason", "Events"],
    query: `let window = 7d;
ContainerAppSystemLogs_CL
| where TimeGenerated >= ago(window)
| where isnotempty(Reason_s)
| summarize Events=count() by tostring(ContainerAppName_s), tostring(Reason_s)
| order by Events desc
| take 20`,
    clickThrough: `let window = 7d;
ContainerAppSystemLogs_CL
| where TimeGenerated >= ago(window)
| where isnotempty(Reason_s)
| order by TimeGenerated desc
| take 200`,
  },
  {
    id: "replica-job-hotspots",
    title: "Replica / Job Hotspots (24 Hours)",
    section: "Platform Stability",
    type: "table",
    defaultWindow: "24h",
    columns: ["Service", "Replica", "Job", "Execution", "Events"],
    query: `let window = 24h;
ContainerAppSystemLogs_CL
| where TimeGenerated >= ago(window)
| where tostring(Level) in~ ("Error", "Critical") or isnotempty(Reason_s)
| summarize Events=count()
  by tostring(ContainerAppName_s), tostring(ReplicaName_s), tostring(JobName_s), tostring(ExecutionName_s)
| order by Events desc
| take 25`,
    clickThrough: `let window = 24h;
ContainerAppSystemLogs_CL
| where TimeGenerated >= ago(window)
| where tostring(Level) in~ ("Error", "Critical") or isnotempty(Reason_s)
| order by TimeGenerated desc
| take 200`,
  },
  {
    id: "crash-error-trend",
    title: "Crash / Error Trend (30 Days)",
    section: "App Quality (AppCenter)",
    type: "line",
    defaultWindow: "30d",
    granularity: "1 day",
    yAxisLabel: "Errors",
    query: `let window = 30d;
AppCenterError
| where TimeGenerated >= ago(window)
| summarize Errors=count() by bin(TimeGenerated, 1d)
| order by TimeGenerated asc`,
    clickThrough: `let window = 30d;
AppCenterError
| where TimeGenerated >= ago(window)
| order by TimeGenerated desc
| take 200`,
  },
  {
    id: "top-error-groups",
    title: "Top Error Groups (14 Days)",
    section: "App Quality (AppCenter)",
    type: "table",
    defaultWindow: "14d",
    columns: [
      "Group",
      "Type",
      "Exception",
      "Reason",
      "Errors",
      "Last Seen",
    ],
    query: `let window = 14d;
AppCenterError
| where TimeGenerated >= ago(window)
| summarize Errors=count(), LastSeen=max(LastErrorAt)
  by tostring(ErrorGroupId), tostring(ErrorType), tostring(ExceptionType), tostring(ErrorReason)
| order by Errors desc
| take 15`,
    clickThrough: `let window = 14d;
AppCenterError
| where TimeGenerated >= ago(window)
| order by TimeGenerated desc
| take 200`,
  },
  {
    id: "billable-log-ingestion",
    title: "Billable Log Ingestion (30 Days)",
    section: "Log Analytics Cost & Ingestion",
    type: "line",
    defaultWindow: "30d",
    granularity: "1 day",
    yAxisLabel: "GB",
    query: `let window = 30d;
Usage
| where TimeGenerated >= ago(window)
| where IsBillable == true
| extend QtyGB =
    case(
        QuantityUnit =~ "GB", Quantity,
        QuantityUnit =~ "MB", Quantity / 1024.0,
        QuantityUnit =~ "KB", Quantity / 1024.0 / 1024.0,
        QuantityUnit =~ "B",  Quantity / 1024.0 / 1024.0 / 1024.0,
        real(null)
    )
| summarize BillableGB=sum(QtyGB) by bin(TimeGenerated, 1d)
| order by TimeGenerated asc`,
    clickThrough: `let window = 30d;
Usage
| where TimeGenerated >= ago(window)
| where IsBillable == true
| order by TimeGenerated desc
| take 200`,
  },
  {
    id: "top-billable-data-types",
    title: "Top Billable Data Types (30 Days)",
    section: "Log Analytics Cost & Ingestion",
    type: "bar",
    defaultWindow: "30d",
    query: `let window = 30d;
Usage
| where TimeGenerated >= ago(window)
| where IsBillable == true
| extend QtyGB =
    case(
        QuantityUnit =~ "GB", Quantity,
        QuantityUnit =~ "MB", Quantity / 1024.0,
        QuantityUnit =~ "KB", Quantity / 1024.0 / 1024.0,
        QuantityUnit =~ "B",  Quantity / 1024.0 / 1024.0 / 1024.0,
        real(null)
    )
| summarize BillableGB=sum(QtyGB) by tostring(DataType)
| order by BillableGB desc
| take 15`,
    clickThrough: `let window = 30d;
Usage
| where TimeGenerated >= ago(window)
| where IsBillable == true
| order by TimeGenerated desc
| take 200`,
  },
]

export const visualPriorityOrder = [
  "stderr-error-rate",
  "top-services-error-rate",
  "critical-platform-events",
  "crash-error-trend",
  "top-error-messages",
  "most-unstable-services",
  "replica-job-hotspots",
  "top-error-groups",
  "billable-log-ingestion",
  "top-billable-data-types",
]
