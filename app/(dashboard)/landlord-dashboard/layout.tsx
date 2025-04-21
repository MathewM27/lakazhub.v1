import type { Metadata } from 'next'

import ClientWrapper from './components/client-wrapper'

export const metadata: Metadata = {
  title: 'LakazHub | Landlord Dashboard',
  description: 'Manage your rental properties',
}


export default function LandlordDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientWrapper>{children}</ClientWrapper>;
}
