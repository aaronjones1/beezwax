import { NextRequest, NextResponse } from "next/server"
import { queryAzureLogs, getAzureWorkspaceId } from "@/lib/services/azure-log-analytics"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const query = body.query

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const workspaceId = getAzureWorkspaceId()
    const result = await queryAzureLogs(workspaceId, query)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Log query error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to query logs" },
      { status: 500 }
    )
  }
}
