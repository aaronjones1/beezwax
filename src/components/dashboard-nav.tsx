"use client"

import { Hexagon } from "lucide-react"
import { TimeRangeToggle } from "@/components/time-range-toggle"
import { ReactNode } from "react"

interface DashboardNavProps {
  children?: ReactNode
}

export function DashboardNav({ children }: DashboardNavProps) {
  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Hexagon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WRP Staging</h1>
                <p className="text-xs text-gray-500">Operational Health Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <TimeRangeToggle />
            </div>
          </div>
        </div>
      </header>
      {children}
    </>
  )
}
