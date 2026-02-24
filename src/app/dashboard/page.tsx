import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Hexagon, LogOut } from "lucide-react"
import { DashboardClient } from "@/components/dashboard-client"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Hexagon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Beezwax</h1>
              <span className="text-sm text-gray-500">Business Intelligence</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {session.user?.name?.[0] || session.user?.email?.[0] || "?"}
                  </div>
                )}
                <span className="max-w-[150px] truncate">{session.user?.name || session.user?.email}</span>
              </div>

              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/login" })
                }}
              >
                <Button variant="ghost" size="icon" title="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Log Dashboard</h2>
            <p className="text-gray-500">Query and analyze logs from Azure and other sources</p>
          </div>

          <DashboardClient />
        </div>
      </main>
    </div>
  )
}
