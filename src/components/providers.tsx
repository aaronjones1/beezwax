"use client"

import { SessionProvider } from "next-auth/react"
import { TimeRangeProvider } from "@/components/time-range-context"
import { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TimeRangeProvider>{children}</TimeRangeProvider>
    </SessionProvider>
  )
}
