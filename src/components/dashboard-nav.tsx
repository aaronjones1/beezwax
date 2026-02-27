"use client"

import { Hexagon } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { TimeRangeToggle } from "@/components/time-range-toggle"
import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface DashboardNavProps {
  children?: ReactNode
}

export function DashboardNav({ children }: DashboardNavProps) {
  const { data: session, status } = useSession()
  const user = session?.user
  const displayName = user?.name || user?.email || "Signed in"
  const email = user?.email
  const initials = getInitials(user?.name || user?.email)

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

            <div className="flex flex-wrap items-center gap-4">
              <TimeRangeToggle />
              {status === "authenticated" && (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white/80 px-3 py-2 shadow-sm">
                  <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center overflow-hidden">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold">{initials}</span>
                    )}
                  </div>
                  <div className="text-xs leading-tight">
                    <p className="font-semibold text-gray-900">{displayName}</p>
                    {email && <p className="text-gray-500">{email}</p>}
                  </div>
                </div>
              )}
              {status === "authenticated" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  Log out
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      {children}
    </>
  )
}

function getInitials(value?: string | null) {
  if (!value) return "?"
  const parts = value.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}
