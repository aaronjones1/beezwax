import { auth, signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { ArrowRight, Hexagon } from "lucide-react"
import { redirect } from "next/navigation"

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string | string[] }
}) {
  const session = await auth()
  const callbackUrl =
    typeof searchParams?.callbackUrl === "string" &&
    searchParams.callbackUrl.startsWith("/") &&
    !searchParams.callbackUrl.startsWith("//")
      ? searchParams.callbackUrl
      : "/"

  if (session) {
    redirect(callbackUrl)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-amber-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-amber-500 rounded-lg">
            <Hexagon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WRP Staging</h1>
            <p className="text-sm text-gray-500">Operational Health</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600 text-center">
            Sign in to access your log aggregation dashboard
          </p>

          <form
            action={async () => {
              "use server"
              await signIn("microsoft-entra-id", { redirectTo: callbackUrl })
            }}
          >
            <Button
              type="submit"
              className="w-full bg-[#0078d4] hover:bg-[#106ebe] text-white"
            >
              Sign in with Microsoft
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>

        <p className="mt-6 text-xs text-center text-gray-400">
          Secure SSO powered by Microsoft Entra ID
        </p>
      </div>
    </div>
  )
}
