"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ExternalLink, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resolveTimeRange, useTimeRange } from "@/components/time-range-context"
import { LogsTable } from "@/components/raw-logs-table"

const fallbackQuery = "ContainerAppConsoleLogs_CL | take 100"

export default function LogsClient() {
  const params = useSearchParams()
  const { timeRange } = useTimeRange()
  const initialQuery = params.get("q") || fallbackQuery
  const [query, setQuery] = useState(() => initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(() => initialQuery)

  const timespan = useMemo(() => {
    const fromUrl = params.get("t")
    if (fromUrl && /^(\d+)([dh])$/.test(fromUrl)) {
      return fromUrl
    }
    return resolveTimeRange(timeRange, "7d")
  }, [params, timeRange])

  return (
    <div className="space-y-6">
      <header className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Logs</h2>
            <p className="text-sm text-gray-500 mt-1">
              Use the query input to inspect WRP Staging logs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Timespan: {timespan}</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          KQL Query
        </label>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="ContainerAppConsoleLogs_CL | take 100"
            />
          </div>
          <Button onClick={() => setSubmittedQuery(query)}>Run query</Button>
        </div>
      </div>

      <LogsTable query={submittedQuery} timespan={timespan} />
    </div>
  )
}
