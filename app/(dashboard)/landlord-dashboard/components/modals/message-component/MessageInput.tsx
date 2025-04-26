import React, { forwardRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface MessageInputProps {
  messageText: string;
  setMessageText: (text: string) => void;
  handleSendMessage: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  // We don't need messageInputRef here since we're using forwardRef
}

const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
  ({ messageText, setMessageText, handleSendMessage, handleKeyDown, disabled }, ref) => (
    <div className="border-t border-zinc-800 p-2 flex gap-2 h-[60px] min-h-[60px] bg-zinc-950 rounded-b-2xl shadow-md">
      <Textarea
        ref={ref}
        placeholder="Type your message here... (Shift+Enter for new line)"
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex-1 min-h-[40px] max-h-[100px] resize-none bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700 rounded-xl shadow-inner"
      />
      <Button
        size="icon"
        onClick={handleSendMessage}
        disabled={!messageText.trim() || disabled}
        className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-zinc-800 disabled:text-zinc-500 shadow"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </div>
  )
);

MessageInput.displayName = "MessageInput";

export default MessageInput;
