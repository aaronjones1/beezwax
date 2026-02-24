import type { Metadata } from "next"
import { Fira_Code } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { SessionProvider } from "next-auth/react"

const firaCode = Fira_Code({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Beezwax - Business Intelligence",
  description: "Log aggregation and business intelligence dashboard",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={cn(firaCode.className, "min-h-screen bg-background antialiased")}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
