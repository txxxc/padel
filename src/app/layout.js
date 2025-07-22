import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Auth0Provider } from "@auth0/nextjs-auth0"
import { auth0 } from "./lib/auth0"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "Quings of the Court",
  keywords: "queen of the court, volleyball, padel, tennis, king of the court, game management",
  description: "A game management app for King of the Court tournaments.",
}

export default async function RootLayout({ children }) {
  const session = await auth0.getSession()
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-gray-400`}
      >
        <Auth0Provider user={session?.user}>{children}</Auth0Provider>
      </body>
    </html>
  )
}
