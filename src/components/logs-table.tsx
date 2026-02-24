"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Info, AlertTriangle, XCircle, Loader2, X } from "lucide-react"

interface LogEntry {
  timestamp: Date
  level: string
  source: string
  message: string
  [key: string]: unknown
}

interface QueryResult {
  rows: LogEntry[]
  columnNames: string[]
  rowCount: number
  error?: string
}

const levelConfig = {
  error: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
}

function formatTimestamp(value: unknown): string {
  if (!value) return "-"
  const date = value instanceof Date ? value : new Date(String(value))
  if (isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function Drawer({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: Record<string, unknown> }) {
  if (!isOpen) return null

  const isStringContent = typeof content.value === "string"

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          {isStringContent ? (
            <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
              {String(content.value)}
            </pre>
          ) : (
            <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </>
  )
}

export function LogsTable({ query = "ContainerAppConsoleLogs_CL | take 100" }: { query?: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<{ title: string; data: Record<string, unknown> } | null>(null)

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        })
        const data: QueryResult = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch logs")
        }
        setLogs(data.rows)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [query])

  const openMessageDrawer = (log: LogEntry) => {
    setSelectedLog({ title: `Message - ${log.source}`, data: { value: log.message } })
  }

  const openMetadataDrawer = (log: LogEntry) => {
    const metadata: Record<string, unknown> = {}
    Object.entries(log).forEach(([key]) => {
      if (!["timestamp", "level", "source", "message"].includes(key)) {
        metadata[key] = log[key]
      }
    })
    setSelectedLog({ title: `Metadata - ${log.source}`, data: metadata })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-2 text-gray-500">Querying Azure Log Analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600 font-medium">Error: {error}</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metadata
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log, idx) => {
              const config = levelConfig[log.level as keyof typeof levelConfig] || levelConfig.info
              const Icon = config.icon
              const metadataKeys = Object.keys(log).filter(k => !["timestamp", "level", "source", "message"].includes(k))

              return (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                      <Icon className="h-3 w-3" />
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {log.source}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                    <button
                      onClick={() => openMessageDrawer(log)}
                      className="text-left hover:text-amber-600 truncate block w-full"
                      title="Click to view full message"
                    >
                      {log.message}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {metadataKeys.length > 0 ? (
                      <button
                        onClick={() => openMetadataDrawer(log)}
                        className="text-xs text-amber-600 hover:text-amber-800 underline"
                      >
                        View ({metadataKeys.length} fields)
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Info className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No logs returned from query.</p>
          </div>
        )}
      </div>

      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog?.title || ""}
        content={selectedLog?.data || {}}
      />
    </>
  )
}
