import type { Metadata } from 'next'
import ClientAuthWrapper from './components/client-auth-wrapper'

export const metadata: Metadata = {
  title: 'LakazHub | Tenant Dashboard',
  description: 'Manage your rental properties as a tenant',
}

export default function TenantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientAuthWrapper>
      {children}
    </ClientAuthWrapper>
  );
}