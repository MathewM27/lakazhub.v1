import React from "react";
import { cn } from "@/utils/lib/utils";

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

interface ChatMessagesProps {
  loading: boolean;
  selectedTenant: Tenant | null;
  messagesContainerRef: React.RefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement>;
  loadMoreMessages: () => void;
  userHasScrolledUp: boolean;
  noGradient?: boolean; // new prop
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  loading,
  selectedTenant,
  messagesContainerRef,
  messagesEndRef,
  loadMoreMessages,
  userHasScrolledUp,
  noGradient,
}) => {
  if (loading && (!selectedTenant || selectedTenant?.messages.length === 0)) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-0" key="loading-container">
        <div className="animate-pulse flex space-x-2" key="loading-pulse">
          <div className="h-2 w-2 bg-zinc-600 rounded-full"></div>
          <div className="h-2 w-2 bg-zinc-600 rounded-full"></div>
          <div className="h-2 w-2 bg-zinc-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!selectedTenant) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-0 text-zinc-500" key="no-tenant-selected">
        <p>Select a conversation to view messages</p>
      </div>
    );
  }

  if (!selectedTenant.messages || selectedTenant.messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-0 text-zinc-500" key="no-messages">
        <p>No messages in this conversation yet</p>
        <p className="text-xs mt-2">Send a message to get started</p>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      className="space-y-3 flex-1 overflow-y-auto p-4 bg-zinc-950 rounded-b-2xl shadow-inner"
      style={{ minHeight: 0 }}
    >
      {selectedTenant.hasMoreMessages && (
        <div className="flex justify-center py-2">
          <button
            onClick={loadMoreMessages}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
          >
            Load earlier messages
          </button>
        </div>
      )}
      {selectedTenant.messages.map((message, idx) => (
        <div
          key={message.id || `${idx}-${message.time}`}
          className={cn(
            "flex",
            message.sender === "landlord" ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "max-w-[80%] px-4 py-2 mb-1 rounded-2xl shadow-md",
              message.sender === "landlord"
                ? noGradient
                  ? "bg-zinc-800 text-zinc-100 rounded-br-md"
                  : "bg-zinc-800 text-zinc-100 rounded-br-md"
                : "bg-zinc-800 text-zinc-100 rounded-bl-md"
            )}
            style={{
              borderTopLeftRadius: message.sender === "landlord" ? 18 : 8,
              borderTopRightRadius: message.sender === "landlord" ? 8 : 18,
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
              boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
            }}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
            <div
              className={cn(
                "text-xs mt-1 flex justify-end items-center gap-1",
                message.sender === "landlord" ? "text-indigo-200" : "text-zinc-400"
              )}
            >
              <span>{message.time}</span>
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
