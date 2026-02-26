"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, ExternalLink, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resolveTimeRange, useTimeRange } from "@/components/time-range-context"
import { KqlCardConfig } from "@/lib/kql-dashboard"
import { LogsTable } from "@/components/raw-logs-table"

type ChartPoint = {
  time?: string
  value: number
  total?: number
  stderr?: number
  label?: string
}

type TableRow = Record<string, unknown>

interface QueryResult {
  rows: TableRow[]
  columnNames: string[]
  rowCount: number
  error?: string
}

const chartPalette = {
  primary: "#1f2937",
  accent: "#0ea5a4",
  grid: "#e5e7eb",
  warning: "#f59e0b",
}

const labelOverrides: Record<string, string> = {
  ContainerAppName_s: "Service",
  ErrorRate: "Error rate",
  Stderr: "Stderr count",
  Log_s: "Message",
  Reason_s: "Reason",
  ReplicaName_s: "Replica",
  JobName_s: "Job",
  ExecutionName_s: "Execution",
  ErrorGroupId: "Group",
  ErrorType: "Type",
  ExceptionType: "Exception",
  ErrorReason: "Reason",
  LastSeen: "Last Seen",
  Events: "Events",
  Errors: "Errors",
  DataType: "Data type",
  BillableGB: "Billable GB",
}

function titleCase(value: string) {
  if (labelOverrides[value]) return labelOverrides[value]
  return value
    .replace(/_[a-z]$/i, "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function formatNumber(value: unknown, digits = 2) {
  if (typeof value === "number" && !Number.isNaN(value)) {
    if (Math.abs(value) < 1) {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    }
    return value.toLocaleString(undefined, {
      maximumFractionDigits: digits,
    })
  }
  return value === null || value === undefined ? "-" : String(value)
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`
}

function applyTimeRange(query: string, range: string) {
  const match = query.match(/let\s+window\s*=\s*[^;]+;/)
  if (!match) return query
  return query.replace(match[0], `let window = ${range};`)
}

function getDefaultTimeField(columns: string[]) {
  return (
    columns.find((col) => col.toLowerCase() === "timegenerated") ||
    columns.find((col) => col.toLowerCase().includes("time")) ||
    columns[0]
  )
}

function getMetricField(columns: string[]) {
  const preferred = ["ErrorRate", "Events", "Errors", "BillableGB"]
  for (const field of preferred) {
    if (columns.includes(field)) return field
  }
  return columns.find((col) => col !== getDefaultTimeField(columns)) || columns[1]
}

function useKqlQuery(query: string, timespan: string) {
  const [data, setData] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function fetchData() {
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
          throw new Error(result.error || "Failed to query logs")
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

    fetchData()

    return () => {
      isActive = false
    }
  }, [query, timespan])

  return { data, loading, error }
}

function useChartData(card: KqlCardConfig, rows: TableRow[], columns: string[]) {
  return useMemo(() => {
    if (!rows.length || !columns.length) return [] as ChartPoint[]

    if (card.id === "stderr-error-rate") {
      return rows.map((row) => {
        const timeKey = getDefaultTimeField(columns)
        return {
          time: String(row[timeKey] ?? ""),
          value: Number(row.ErrorRate ?? 0),
          total: Number(row.Total ?? 0),
          stderr: Number(row.Stderr ?? 0),
        }
      })
    }

    if (card.id === "top-services-error-rate") {
      return rows.map((row) => ({
        label: String(row.ContainerAppName_s ?? row.Service ?? ""),
        value: Number(row.ErrorRate ?? 0),
        stderr: Number(row.Stderr ?? 0),
      }))
    }

    if (card.id === "top-billable-data-types") {
      return rows.map((row) => ({
        label: String(row.DataType ?? row.Type ?? ""),
        value: Number(row.BillableGB ?? 0),
      }))
    }

    const timeKey = getDefaultTimeField(columns)
    const metricKey = getMetricField(columns)

    return rows.map((row) => ({
      time: String(row[timeKey] ?? ""),
      value: Number(row[metricKey] ?? 0),
    }))
  }, [card.id, rows, columns])
}

function formatTimeLabel(value: string) {
  if (!value) return ""
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
    })
  }
  return value
}

function LineChart({
  data,
  highlightThreshold,
  yAxisLabel,
  tooltipFields,
}: {
  data: ChartPoint[]
  highlightThreshold?: { value: number }
  yAxisLabel?: string
  tooltipFields?: string[]
}) {
  if (!data.length) {
    return <div className="text-sm text-gray-500">No data returned.</div>
  }

  const width = 680
  const height = 220
  const padding = { top: 24, right: 24, bottom: 36, left: 48 }
  const maxValue = Math.max(...data.map((point) => point.value))
  const minValue = 0
  const range = maxValue - minValue || 1
  const points = data.map((point, index) => {
    const x =
      padding.left +
      (index / Math.max(data.length - 1, 1)) * (width - padding.left - padding.right)
    const y =
      padding.top +
      (1 - (point.value - minValue) / range) * (height - padding.top - padding.bottom)
    return { x, y, ...point }
  })

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ")

  const warningLine =
    typeof highlightThreshold?.value === "number"
      ? padding.top +
        (1 - (highlightThreshold.value - minValue) / range) * (height - padding.top - padding.bottom)
      : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartPalette.accent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={chartPalette.accent} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <rect
          x={padding.left}
          y={padding.top}
          width={width - padding.left - padding.right}
          height={height - padding.top - padding.bottom}
          fill="none"
          stroke={chartPalette.grid}
        />
        {warningLine !== null && (
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={warningLine}
            y2={warningLine}
            stroke={chartPalette.warning}
            strokeDasharray="6 4"
          />
        )}
        <path d={path} fill="none" stroke={chartPalette.accent} strokeWidth={2} />
        <path
          d={`${path} L ${width - padding.right} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`}
          fill="url(#lineFill)"
        />
        {points.map((point, index) => {
          const isWarning = highlightThreshold ? point.value >= highlightThreshold.value : false
          const tooltipParts = tooltipFields
            ? [
                `Value: ${formatNumber(point.value)}`,
                ...tooltipFields.map((field) => {
                  const value = field.toLowerCase().includes("total")
                    ? point.total
                    : field.toLowerCase().includes("stderr")
                    ? point.stderr
                    : undefined
                  return `${field}: ${formatNumber(value ?? "-")}`
                }),
              ]
            : [`Value: ${formatNumber(point.value)}`]
          const tooltipText = tooltipParts.join("\n")

          return (
            <g key={index}>
              <title>{tooltipText}</title>
              <circle
                cx={point.x}
                cy={point.y}
                r={3.5}
                fill={isWarning ? chartPalette.warning : chartPalette.primary}
              />
            </g>
          )
        })}
        <text x={padding.left} y={height - 12} fontSize="10" fill="#6b7280">
          {formatTimeLabel(points[0]?.time || "")}
        </text>
        <text
          x={width - padding.right}
          y={height - 12}
          fontSize="10"
          fill="#6b7280"
          textAnchor="end"
        >
          {formatTimeLabel(points[points.length - 1]?.time || "")}
        </text>
        {yAxisLabel && (
          <text x={padding.left - 34} y={padding.top} fontSize="10" fill="#6b7280">
            {yAxisLabel}
          </text>
        )}
      </svg>
      {tooltipFields && tooltipFields.length > 0 && points.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
          {points.slice(-1).map((point, index) => (
            <div key={index} className="col-span-2 sm:col-span-1">
              <span className="font-semibold text-gray-700">Latest</span>
              {tooltipFields.map((field) => {
                const value = field.toLowerCase().includes("total")
                  ? point.total
                  : field.toLowerCase().includes("stderr")
                  ? point.stderr
                  : undefined
                return (
                  <div key={field} className="flex items-center justify-between">
                    <span>{field}</span>
                    <span className="text-gray-800">{formatNumber(value ?? "-")}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BarChart({
  data,
  highlightThreshold,
}: {
  data: ChartPoint[]
  highlightThreshold?: { value: number }
}) {
  if (!data.length) {
    return <div className="text-sm text-gray-500">No data returned.</div>
  }

  const maxValue = Math.max(...data.map((point) => point.value)) || 1

  return (
    <div className="space-y-3">
      {data.map((point, index) => {
        const width = `${(point.value / maxValue) * 100}%`
        const isWarning = highlightThreshold ? point.value >= highlightThreshold.value : false
        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">{point.label || "Unknown"}</span>
              <span className="text-gray-600">
                {highlightThreshold ? formatPercent(point.value) : formatNumber(point.value)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width,
                  backgroundColor: isWarning ? chartPalette.warning : chartPalette.accent,
                }}
              />
            </div>
            {typeof point.stderr === "number" && (
              <div className="text-xs text-gray-500">Stderr count: {formatNumber(point.stderr, 0)}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TableView({ columns, rows }: { columns: string[]; rows: TableRow[] }) {
  if (!rows.length) {
    return <div className="text-sm text-gray-500">No data returned.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
          <tr>
            {columns.map((column) => (
              <th key={column} className="text-left py-2 pr-4 font-semibold">
                {titleCase(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column} className="py-2 pr-4 text-gray-700">
                  {formatNumber(row[column], 2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function cardColumns(card: KqlCardConfig, columns: string[]) {
  if (card.id === "top-services-error-rate") {
    return ["ContainerAppName_s", "ErrorRate", "Stderr"]
  }
  if (card.id === "top-error-messages") {
    return ["Log_s", "Count"]
  }
  if (card.id === "most-unstable-services") {
    return ["ContainerAppName_s", "Reason_s", "Events"]
  }
  if (card.id === "replica-job-hotspots") {
    return ["ContainerAppName_s", "ReplicaName_s", "JobName_s", "ExecutionName_s", "Events"]
  }
  if (card.id === "top-error-groups") {
    return ["ErrorGroupId", "ErrorType", "ExceptionType", "ErrorReason", "Errors", "LastSeen"]
  }
  if (card.id === "top-billable-data-types") {
    return ["DataType", "BillableGB"]
  }
  if (card.id === "billable-log-ingestion") {
    return ["TimeGenerated", "BillableGB"]
  }
  return columns
}

function mapRow(row: TableRow, columns: string[]) {
  const mapped: Record<string, unknown> = {}
  columns.forEach((column) => {
    mapped[column] = row[column]
  })
  return mapped
}

function ClickThrough({ onOpen }: { onOpen: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onOpen}>
      View logs
      <ExternalLink className="h-3 w-3" />
    </Button>
  )
}

function RawLogsDrawer({
  isOpen,
  onClose,
  query,
  timespan,
  title,
}: {
  isOpen: boolean
  onClose: () => void
  query: string
  timespan: string
  title: string
}) {
  if (!isOpen) return null

  const hasWindow = /let\s+window\s*=\s*[^;]+;/.test(query)
  const renderedQuery = hasWindow
    ? query
    : `let window = ${timespan};\n${query}`

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Logs</p>
            <h4 className="text-lg font-semibold text-gray-900 mt-1">{title}</h4>
            <p className="text-xs text-gray-500 mt-1">Timespan: {timespan}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="px-6 py-4">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Query</p>
            <pre className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto">
              {renderedQuery}
            </pre>
          </div>
          <LogsTable query={renderedQuery} timespan={timespan} />
        </div>
      </div>
    </>
  )
}

export function KqlCard({ card }: { card: KqlCardConfig }) {
  const { timeRange } = useTimeRange()
  const [isOpen, setIsOpen] = useState(false)
  const resolvedRange = resolveTimeRange(timeRange, card.defaultWindow)
  const baseQuery = card.query
  const clickQuery = card.clickThrough || baseQuery
  const resolvedBaseQuery = applyTimeRange(baseQuery, resolvedRange)
  const resolvedClickQuery = applyTimeRange(clickQuery, resolvedRange)
  const { data, loading, error } = useKqlQuery(resolvedBaseQuery, resolvedRange)
  const rows = data?.rows || []
  const columns = data?.columnNames || []
  const chartData = useChartData(card, rows, columns)

  const visibleColumns = cardColumns(card, columns)
  const mappedRows = rows.map((row) => mapRow(row, visibleColumns))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <span>Default: {card.defaultWindow}</span>
            {card.granularity && <span>Granularity: {card.granularity}</span>}
            {card.yAxisLabel && <span>Units: {card.yAxisLabel}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ClickThrough onOpen={() => setIsOpen(true)} />
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2">Querying workspace...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : card.type === "table" ? (
          <TableView columns={visibleColumns} rows={mappedRows} />
        ) : card.type === "bar" ? (
          <BarChart data={chartData} highlightThreshold={card.highlightThreshold || undefined} />
        ) : (
          <LineChart
            data={chartData}
            highlightThreshold={card.highlightThreshold || undefined}
            yAxisLabel={card.yAxisLabel}
            tooltipFields={card.tooltip}
          />
        )}
      </div>
      <RawLogsDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        query={resolvedClickQuery}
        timespan={resolvedRange}
        title={card.title}
      />
    </div>
  )
}
