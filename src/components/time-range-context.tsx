"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type TimeRangeOption = "auto" | "24h" | "7d" | "14d" | "30d"

export const timeRangeOptions: Array<{ value: TimeRangeOption; label: string }> = [
  { value: "auto", label: "Defaults" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
]

interface TimeRangeContextType {
  timeRange: TimeRangeOption
  setTimeRange: (range: TimeRangeOption) => void
}

const TimeRangeContext = createContext<TimeRangeContextType | undefined>(undefined)

export function TimeRangeProvider({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("auto")

  return (
    <TimeRangeContext.Provider value={{ timeRange, setTimeRange }}>
      {children}
    </TimeRangeContext.Provider>
  )
}

export function useTimeRange() {
  const context = useContext(TimeRangeContext)
  if (!context) {
    throw new Error("useTimeRange must be used within TimeRangeProvider")
  }
  return context
}

export function resolveTimeRange(timeRange: TimeRangeOption, fallback: string) {
  return timeRange === "auto" ? fallback : timeRange
}
