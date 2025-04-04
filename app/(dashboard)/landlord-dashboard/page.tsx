import type { Metadata } from "next"
import ClientWrapper from "./components/client-wrapper"

export const metadata: Metadata = {
  title: "LakazHub - Landlord Dashboard",
  description: "Manage your rental properties efficiently with LakazHub",
}

export default function LandlordPage() {
  return (
    <main className="min-h-screen bg-background">
      <ClientWrapper />
    </main>
  )
}

