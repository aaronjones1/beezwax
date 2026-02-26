import type { Metadata } from "next"
import { Fraunces, Space_Mono } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/providers"
import AppLayout from "@/components/app-layout"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
})

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "WRP Staging - Operational Health",
  description: "Operational health dashboard for WRP Staging",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          fraunces.variable,
          spaceMono.variable,
          "min-h-screen bg-background antialiased"
        )}
      >
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  )
}
