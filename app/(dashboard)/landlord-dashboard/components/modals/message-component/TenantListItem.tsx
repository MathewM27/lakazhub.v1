import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/utils/lib/utils";

// Add UIMessage interface to match notification-modal.tsx
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
  messages: UIMessage[]; // Changed from unknown[] to UIMessage[]
}

interface TenantListItemProps {
  tenant: Tenant;
  isSelected: boolean;
  onSelect: (tenant: Tenant) => Promise<void>;
  onDelete: (tenantId: string) => void;
}

const TenantListItem: React.FC<TenantListItemProps> = ({
  tenant,
  isSelected,
  onSelect,
  onDelete,
}) => (
  <div
    className={cn(
      "group flex items-center gap-3 p-3 cursor-pointer transition-colors",
      "rounded-xl mb-1 shadow-sm",
      isSelected
        // Remove gradient, use subtle shadow for selected
        ? "bg-black shadow-[0_0_0_2px_rgba(255,255,255,0.12)]"
        : "hover:bg-zinc-900/80"
    )}
    style={{ minHeight: 60 }}
    onClick={() => onSelect(tenant)}
  >
    <div className="relative flex-shrink-0">
      <Avatar className="h-10 w-10 border border-zinc-700">
        <AvatarImage src={tenant.avatar} alt={tenant.name} />
        <AvatarFallback className="bg-zinc-800 text-zinc-300">
          {tenant.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm truncate text-white">{tenant.name}</span>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-zinc-400 truncate max-w-[100px]">{tenant.lastMessage}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-zinc-300 hover:bg-zinc-700"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tenant.id);
          }}
        >
          <Trash2 className="h-3 w-3" />
          <span className="sr-only">Archive conversation</span>
        </Button>
      </div>
    </div>
  </div>
);

export default React.memo(TenantListItem);
