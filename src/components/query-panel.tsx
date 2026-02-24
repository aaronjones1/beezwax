"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search } from "lucide-react"

interface QueryPanelProps {
  initialQuery?: string
  onRunQuery?: (query: string) => void
}

export function QueryPanel({ initialQuery = "ContainerAppConsoleLogs_CL | take 100", onRunQuery }: QueryPanelProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  const handleRunQuery = () => {
    if (onRunQuery) {
      onRunQuery(query)
    }
  }

  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRunQuery()}
              placeholder='KQL Query (e.g., "ContainerAppConsoleLogs_CL | take 100")'
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
            />
          </div>
          <Button variant="outline" onClick={handleRunQuery}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleRunQuery}>Run Query</Button>
        </div>
      </div>
    </>
  )
}
