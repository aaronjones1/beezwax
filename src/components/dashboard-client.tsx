"use client"

import { useState } from "react"
import { QueryPanel } from "@/components/query-panel"
import { LogsTable } from "@/components/logs-table"

export function DashboardClient() {
  const [query, setQuery] = useState("ContainerAppConsoleLogs_CL | take 100")
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRunQuery = (newQuery: string) => {
    setQuery(newQuery)
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <QueryPanel initialQuery={query} onRunQuery={handleRunQuery} />
      <LogsTable key={refreshKey} query={query} />
    </div>
  )
}
