import React from "react";
import TenantListItem from "./TenantListItem";

interface UIMessage {
  id: string;
  sender: "landlord" | "tenant";
  text: string;
  time: string;
  is_read: boolean;
}

interface Tenant {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  time?: string;
  unread: number;
  messages: UIMessage[];
  hasMoreMessages?: boolean;
  currentPage?: number;
  counterparty_id?: string;
}

interface TenantListProps {
  tenants: Tenant[];
  loading: boolean;
  selectedTenant: Tenant | null;
  onSelect: (tenant: Tenant) => Promise<void>;
  onDelete: (tenantId: string) => void;
  mobile?: boolean;
  refreshAll?: () => void;
  refreshStatusInfo?: { text: string; icon: React.ReactNode };
  isRefreshing?: boolean;
}

const TenantList: React.FC<TenantListProps> = ({
  tenants,
  loading,
  selectedTenant,
  onSelect,
  onDelete,
  mobile,
  refreshAll,
  refreshStatusInfo,
  isRefreshing,
}) => {
  return (
    <div className={mobile ? "flex-1 overflow-y-auto" : "overflow-y-auto flex-1"}>
      <div className="p-2 border-b border-zinc-900 flex items-center justify-between bg-zinc-950 rounded-t-xl">
        <h3 className="text-xs font-semibold text-zinc-300 tracking-wide">Conversations</h3>
        {mobile && refreshAll && refreshStatusInfo && (
          <button
            className="h-8 px-2 bg-black border-white text-zinc-300 hover:bg-zinc-700 hover:text-white rounded text-xs flex items-center"
            onClick={refreshAll}
            disabled={isRefreshing}
          >
            {refreshStatusInfo.icon}
            <span className="hidden sm:inline ml-1">{refreshStatusInfo.text}</span>
          </button>
        )}
      </div>
      {loading && tenants.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse flex space-x-2">
            <div className="h-2 w-2 bg-zinc-600 rounded-full"></div>
            <div className="h-2 w-2 bg-zinc-600 rounded-full"></div>
            <div className="h-2 w-2 bg-zinc-600 rounded-full"></div>
          </div>
        </div>
      ) : tenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-500 px-4 text-center">
          <p>No messages</p>
          <p className="text-sm mt-2">You have no message inquiries for this property yet</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/50 bg-zinc-950 rounded-b-xl">
          {tenants.map((tenant) => (
            <TenantListItem
              key={tenant.id}
              tenant={tenant}
              isSelected={selectedTenant?.id === tenant.id}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TenantList;
