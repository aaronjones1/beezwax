import { DefaultAzureCredential } from "@azure/identity"

export interface LogEntry {
  timestamp: Date
  level: string
  source: string
  message: string
  [key: string]: unknown
}

export interface QueryResult {
  rows: LogEntry[]
  columnNames: string[]
  rowCount: number
}

export async function queryAzureLogs(
  workspaceId: string,
  query: string,
  timespan?: { startTime: Date; endTime: Date }
): Promise<QueryResult> {
  console.log("Executing query:", query)

  const tokenCredential = new DefaultAzureCredential()
  const token = await tokenCredential.getToken("https://api.loganalytics.io/.default")

  const resolvedTimespan =
    timespan ||
    {
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date(),
    }

  const response = await fetch(
    `https://api.loganalytics.io/v1/workspaces/${workspaceId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        timespan: `${resolvedTimespan.startTime.toISOString()}/${resolvedTimespan.endTime.toISOString()}`,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Azure Log Analytics error response:", errorText)
    throw new Error(`Azure Log Analytics query failed: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const rows: LogEntry[] = []
  const columnNames: string[] = []

  if (data.tables && data.tables.length > 0) {
    const table = data.tables[0]
    columnNames.push(...(table.columns?.map((c: { name: string }) => c.name) || []))

    if (table.rows) {
      for (const row of table.rows) {
        const entry: LogEntry = {
          timestamp: new Date(),
          level: "info",
          source: "Azure",
          message: "",
        }

        table.columns.forEach((col: { name: string }, idx: number) => {
          entry[col.name] = row[idx]
          if (col.name.toLowerCase().includes("time") || col.name.toLowerCase() === "timestamp") {
            entry.timestamp = new Date(row[idx])
          }
          if (col.name.toLowerCase() === "level" || col.name.toLowerCase() === "severity") {
            entry.level = String(row[idx]).toLowerCase()
          }
          if (col.name.toLowerCase() === "message" || col.name.toLowerCase() === "msg") {
            entry.message = String(row[idx])
          }
        })

        if (!entry.message) {
          entry.message = JSON.stringify(row)
        }

        rows.push(entry)
      }
    }
  }

  return {
    rows,
    columnNames,
    rowCount: rows.length,
  }
}

export function getAzureWorkspaceId(): string {
  const workspaceId = process.env.AZURE_LOG_ANALYTICS_WORKSPACE_ID
  if (!workspaceId) {
    throw new Error("AZURE_LOG_ANALYTICS_WORKSPACE_ID is not configured")
  }
  return workspaceId
}
