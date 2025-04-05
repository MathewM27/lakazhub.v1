import type { Metadata } from 'next'
import "./globals.css";
import { Inter } from "next/font/google";
import ClientWrapper from './components/client-wrapper'

export const metadata: Metadata = {
  title: 'LakazHub | Landlord Dashboard',
  description: 'Manage your rental properties',
}

const inter = Inter({ subsets: ["latin"] });

export default function LandlordDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientWrapper>{children}</ClientWrapper>;
}
