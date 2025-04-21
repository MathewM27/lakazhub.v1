import type { Metadata } from 'next';
import ClientWrapper from './client-wrapper';

export const metadata: Metadata = {
  title: 'LakazHub | Tenant Dashboard',
  description: 'Find and manage your rental properties',
}

export default function TenantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientWrapper>{children}</ClientWrapper>;
}