import { NextRequest, NextResponse } from "next/server"
import { queryAzureLogs, getAzureWorkspaceId } from "@/lib/services/azure-log-analytics"

function parseTimespan(window: string) {
  const match = window.match(/^(\d+)([dh])$/)
  if (!match) return null
  const value = Number(match[1])
  const unit = match[2]
  if (!value || value <= 0) return null
  const hours = unit === "d" ? value * 24 : value
  const durationMs = hours * 60 * 60 * 1000
  return {
    startTime: new Date(Date.now() - durationMs),
    endTime: new Date(),
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const query = body.query
    const timespan = typeof body.timespan === "string" ? body.timespan : null

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const workspaceId = getAzureWorkspaceId()
    const timeRange = timespan ? parseTimespan(timespan) : null
    const result = await queryAzureLogs(workspaceId, query, timeRange || undefined)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Log query error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to query logs" },
      { status: 500 }
    )
  }
}
