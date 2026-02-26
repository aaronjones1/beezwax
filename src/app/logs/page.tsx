import { Suspense } from "react"
import LogsClient from "@/components/logs-client"

export default function LogsPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">Loading logs...</div>}>
      <LogsClient />
    </Suspense>
  )
}
