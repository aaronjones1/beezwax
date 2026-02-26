"use client"

import { useTimeRange, timeRangeOptions } from "@/components/time-range-context"

export function TimeRangeToggle() {
  const { timeRange, setTimeRange } = useTimeRange()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Time</span>
      <div className="flex flex-wrap items-center gap-1 bg-gray-100 rounded-lg p-1">
        {timeRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setTimeRange(option.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              timeRange === option.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {option.value === "auto" ? "Defaults" : option.value}
          </button>
        ))}
      </div>
    </div>
  )
}
