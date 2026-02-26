"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Info, Loader2 } from "lucide-react"

interface QueryResult {
  rows: Record<string, unknown>[]
  columnNames: string[]
  rowCount: number
  error?: string
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "-"
  if (typeof value === "number") {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 4,
    })
  }
  if (typeof value === "string") return value
  return JSON.stringify(value)
}

function formatHeader(column: string) {
  const overrides: Record<string, string> = {
    ContainerAppName_s: "Service",
    ErrorGroupId: "Group",
    ErrorType: "Type",
    ExceptionType: "Exception",
    ErrorReason: "Reason",
    LastSeen: "Last Seen",
    Log_s: "Message",
  }

  if (overrides[column]) return overrides[column]

  return column
    .replace(/_[a-z]$/i, "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export function LogsTable({ query, timespan }: { query: string; timespan: string }) {
  const [data, setData] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function fetchLogs() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, timespan }),
        })
        const result: QueryResult = await response.json()
        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch logs")
        }
        if (isActive) {
          setData(result)
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Unknown error")
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    fetchLogs()

    return () => {
      isActive = false
    }
  }, [query, timespan])

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-center text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2">Querying workspace...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-3 text-amber-700">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
        <Info className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p>No logs returned for this query.</p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
          <tr>
            {data.columnNames.map((column) => (
              <th key={column} className="text-left py-2 pr-4 font-semibold">
                {formatHeader(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {data.columnNames.map((column) => (
                <td key={column} className="py-2 pr-4 text-gray-700">
                  {formatValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
