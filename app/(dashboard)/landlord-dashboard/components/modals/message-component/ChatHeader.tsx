import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, RefreshCw, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/utils/lib/utils";

interface ChatHeaderProps {
  modalTitle?: string;
  lastRefreshAt?: Date | null;
  onClose?: () => void;
  selectedTenant?: any;
  property?: any;
  onBack?: () => void;
  refreshAll?: () => void;
  refreshStatus?: string;
  isRefreshing?: boolean;
  mobile?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  modalTitle,
  lastRefreshAt,
  onClose,
  selectedTenant,
  property,
  onBack,
  refreshAll,
  refreshStatus,
  isRefreshing,
  mobile,
}) => {
  if (mobile && selectedTenant) {
    // Mobile chat header with back button
    return (
      <div className="border-b border-white p-2 flex items-center bg-black">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={onBack}
        >
          <X className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8 mr-2 border border-white">
          <AvatarImage src={selectedTenant.avatar} alt={selectedTenant.name} />
          <AvatarFallback className="bg-black text-zinc-300">
            {selectedTenant.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-sm text-white">{selectedTenant.name}</div>
          <p className="text-xs text-zinc-400">
            Inquiring about {property?.name || "your property"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 bg-black text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-full ml-auto",
            refreshStatus === "updated" && "text-green-400"
          )}
          onClick={refreshAll}
          disabled={isRefreshing}
        >
          {refreshStatus === "refreshing" ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : refreshStatus === "updated" ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
    );
  }

  // Desktop or modal header
  return (
    <div className="bg-black border-b border-white p-3 flex items-center justify-between">
      <div className="flex flex-col sm:hidden">
        <span className="font-bold text-white truncate max-w-[120px]">{modalTitle}</span>
      </div>
      <div className="items-center space-x-2 hidden sm:flex">
        <span className="font-bold text-white">LakazHub</span>
        <span className="text-xs text-zinc-400">Messenger</span>
      </div>
      <div className="text-center hidden sm:block">
        <h3 className="text-sm font-medium truncate text-white">{modalTitle}</h3>
        {lastRefreshAt && (
          <div className="text-[10px] text-zinc-400">
            Last updated {formatDistanceToNow(lastRefreshAt, { addSuffix: true })}
          </div>
        )}
      </div>
      <div className="flex justify-center items-center space-x-2">
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mt-4 rounded-full text-black hover:text-white hover:bg-zinc-800"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
