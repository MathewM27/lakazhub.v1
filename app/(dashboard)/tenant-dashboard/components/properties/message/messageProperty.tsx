"use client"

import { useState, useEffect, useRef } from "react"
import { Send, MessageSquare, RefreshCw, Check, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "../../../utils/supabase/client"
import { useToast } from "../../../hooks/use-toast"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/utils/lib/utils"

// Define types for better TypeScript support
interface Message {
  id: string;
  sender_id?: string;
  recipient_id?: string;
  message?: string;
  created_at?: string;
  is_read: boolean;
  // UI properties
  sender: 'landlord' | 'tenant';
  text: string;
  time: string;
}

// Add ToastOptions type with variant property
interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface TenantMessageProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  property: Record<string, unknown>;
}

export default function TenantMessage({ open, onOpenChangeAction, property }: TenantMessageProps) {
  const [user, setUser] = useState<Record<string, unknown> | null>(null)
  const [messageText, setMessageText] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [conversation, setConversation] = useState<{ id: string } | null>(null)
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'refreshing' | 'updated'>("idle")
  const [staleData, setStaleData] = useState(false)
  const { toast } = useToast()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false)
  const PAGE_SIZE = 10 // Number of messages to load per page

  // Auto-scroll to bottom of message area when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  // Cache timeout (5 minutes)
  const CACHE_TIMEOUT = 5 * 60 * 1000

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (messages.length > 0 && currentPage === 0) {
      scrollToBottom()
    }
  }, [messages, currentPage])

  // Check if data is stale - used to show refresh indicator
  useEffect(() => {
    let staleCheckInterval: NodeJS.Timeout
    
    if (open && lastRefreshAt) {
      const checkStale = () => {
        const now = new Date()
        if (now.getTime() - lastRefreshAt.getTime() > CACHE_TIMEOUT) {
          setStaleData(true)
        }
      }
      
      // Check immediately
      checkStale()
      
      // Then check periodically
      staleCheckInterval = setInterval(checkStale, 60000) // Check every minute
    }
    
    return () => {
      if (staleCheckInterval) clearInterval(staleCheckInterval)
    }
  }, [open, lastRefreshAt, CACHE_TIMEOUT])

  // Effect to handle refresh status timeouts
  useEffect(() => {
    let statusTimer: NodeJS.Timeout;
    
    if (refreshStatus === 'updated') {
      statusTimer = setTimeout(() => {
        setRefreshStatus('idle');
      }, 3000);
    }
    
    return () => {
      if (statusTimer) {
        clearTimeout(statusTimer);
      }
    };
  }, [refreshStatus]);

  // Get the current user (tenant)
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      
      if (data?.user) {
        setUser(data.user);
        
        // Verify user is a tenant
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', data.user.id)
          .single();
        
        if (profileError || profileData?.user_role !== 'tenant') {
          toast({
            title: "Access Denied",
            description: "Only tenants can send property inquiries",
            variant: "destructive",
          } as ToastOptions);
          onOpenChangeAction(false);
        }
      }
    };
    
    fetchUser();
  }, [onOpenChangeAction, toast]);

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      // First try using the RPC function to get messages
      const { data: messagesData, error: rpcError } = await supabase.rpc('get_conversation_messages', {
        p_conversation_id: conversationId,
        p_page: 0,
        p_page_size: 50
      });

      if (rpcError) {
        // Fallback to direct query if RPC fails
        const { data: directData, error: directError } = await supabase
          .from('property_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        
        if (directError) throw directError;
        
        return directData.map((msg: { id: string; sender_id: string; recipient_id: string; message: string; created_at: string; is_read: boolean }) => ({
          id: msg.id,
          sender_id: msg.sender_id,
          recipient_id: msg.recipient_id,
          message: msg.message,
          created_at: msg.created_at,
          is_read: msg.is_read,
          sender: msg.sender_id === user?.id ? 'tenant' as const : 'landlord' as const,
          text: msg.message,
          time: formatMessageTime(msg.created_at),
        }));
      }
      
      // If RPC succeeds, format the messages
      return messagesData.map((msg: { id: string; sender_id: string; recipient_id: string; message: string; created_at: string; is_read: boolean }) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        message: msg.message,
        created_at: msg.created_at,
        is_read: msg.is_read,
        sender: msg.sender_id === user?.id ? 'tenant' as const : 'landlord' as const,
        text: msg.message,
        time: formatMessageTime(msg.created_at),
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  // Find or create conversation and fetch messages when opened
  useEffect(() => {
    if (!open || !user?.id || !property?.id) return
    
    const fetchOrCreateConversation = async () => {
      setLoading(true)
      
      try {
        // First check if conversation already exists
        const { data: existingConv, error: convError } = await supabase
          .from('property_conversations')
          .select('*')
          .eq('property_id', property.id)
          .eq('tenant_id', user.id)
          .eq('landlord_id', property.landlord_id)
          .maybeSingle()
          
        if (convError) throw convError
        
        if (existingConv) {
          setConversation(existingConv)
          
          // Fetch messages from the property_messages table
          const messagesList = await fetchMessages(existingConv.id);
          setMessages(messagesList);
          
          if (messagesList.some((m: Message) => m.sender === 'landlord' && !m.is_read)) {
            markMessagesAsRead(existingConv.id);
          }
        } else {
          setMessages([])
        }
      } catch (error) {
        toast({
          title: "Error loading conversation",
          description: error instanceof Error ? error.message : "Could not load conversation data",
          variant: "destructive",
        } as ToastOptions)
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrCreateConversation()
    
    return () => {
      setMessages([])
      setConversation(null)
      setRefreshStatus('idle')
      setStaleData(false)
    }
  }, [open, user?.id, property?.id, property?.landlord_id, toast])

  // Function to manually check for new messages
  const refreshMessages = async () => {
    if (!conversation?.id) {
      return;
    }
    
    setIsRefreshing(true);
    setRefreshStatus('refreshing');
    
    try {
      // Get messages from the property_messages table
      const messagesList = await fetchMessages(conversation.id);
      
      if (messagesList.length > 0) {
        // Compare with current messages to see if there are new ones
        const existingIds = new Set(messages.map(m => m.id));
        const newMessages: Message[] = messagesList.filter((msg: Message) => !existingIds.has(msg.id));
        
        setMessages(messagesList);
        
        const hasUnreadMessagesForUser = messagesList.some(
          (msg: Message) => msg.sender === 'landlord' && !msg.is_read
        );
        
        if (hasUnreadMessagesForUser) {
          if (conversation?.id) {
            markMessagesAsRead(conversation.id);
          }
        }
        
        if (newMessages.length > 0) {
          toast({
            title: `${newMessages.length} new message${newMessages.length > 1 ? 's' : ''}`,
            description: "New messages have been loaded",
          } as ToastOptions);
        } else {
          toast({
            title: "No new messages",
            description: "You're all caught up!",
          } as ToastOptions);
        }
      }
      
      const now = new Date();
      setLastRefreshAt(now);
      setStaleData(false);
      setRefreshStatus('updated');
      
    } catch (error) {
      toast({
        title: "Error refreshing messages",
        description: error instanceof Error ? error.message : "Could not refresh messages",
        variant: "destructive",
      } as ToastOptions);
      setRefreshStatus('idle');
    } finally {
      setIsRefreshing(false);
    }
  }

  // Refresh data automatically when page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && open && conversation?.id && staleData) {
        refreshMessages()
        setStaleData(false)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [open, conversation?.id, staleData, refreshMessages])

  // Function to load more messages
  const loadMoreMessages = async () => {
    if (!conversation?.id || !hasMoreMessages || loadingMoreMessages) return
    
    setLoadingMoreMessages(true)
    
    try {
      const nextPage = currentPage + 1
      const startRange = nextPage * PAGE_SIZE
      const endRange = startRange + PAGE_SIZE - 1
      
      const { data, error, count } = await supabase
        .from('property_messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .range(startRange, endRange)
        
      if (error) throw error
      
      setHasMoreMessages(count ? count > endRange + 1 : false)
      
      const olderMessages = [...(data || [])].reverse()
      
      const formattedMessages = olderMessages.map((msg: { id: string; sender_id: string; recipient_id: string; message: string; created_at: string; is_read: boolean }) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        message: msg.message,
        created_at: msg.created_at,
        is_read: msg.is_read,
        sender: msg.sender_id === user?.id ? 'tenant' as const : 'landlord' as const,
        text: msg.message,
        time: formatMessageTime(msg.created_at),
      }));
      
      setMessages(prev => [...formattedMessages, ...prev])
      
      setCurrentPage(nextPage)
    } catch (error) {
      toast({
        title: "Error loading more messages",
        description: error instanceof Error ? error.message : "Could not load older messages",
        variant: "destructive",
      } as ToastOptions)
    } finally {
      setLoadingMoreMessages(false)
    }
  }

  // Mark messages as read - updated to use the new schema
  const markMessagesAsRead = async (conversationId: string) => {
    try {
      if (!user?.id) return;
      
      await supabase.rpc("mark_conversation_messages_read", {
        p_conversation_id: conversationId
      });
      
      setMessages(prev => 
        prev.map(message => 
          message.sender === 'landlord' 
            ? { ...message, is_read: true } 
            : message
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Send a message - updated to work with the new schema
  const handleSendMessage = async () => {
    if (!messageText.trim() || !user?.id || !property?.id || !property?.landlord_id) {
      return;
    }
    
    setSendingMessage(true);
    
    try {
      if (!conversation) {
        // Create a new conversation with the first message
        const { data: convId, error: convError } = await supabase.rpc('create_property_inquiry', {
          p_property_id: property.id,
          p_tenant_id: user.id,
          p_message: messageText.trim()
        });
        
        if (convError) throw convError;
        
        // Fetch the newly created conversation
        const { data: convData, error: fetchError } = await supabase
          .from('property_conversations')
          .select('*')
          .eq('id', convId)
          .single();
          
        if (fetchError) throw fetchError;
        
        setConversation(convData);
        
        // Fetch messages from the property_messages table
        const messagesList = await fetchMessages(convId);
        setMessages(messagesList);
        
      } else {
        // Add a message to an existing conversation
        const { data: messageId, error } = await supabase.rpc('add_message_to_conversation', {
          p_conversation_id: conversation.id,
          p_sender_id: user.id,
          p_recipient_id: property.landlord_id,
          p_message: messageText.trim()
        });
        
        if (error) throw error;
        
        // Add the new message to the local state
        const newMessage: Message = {
          id: messageId || `temp-${Date.now()}`,
          sender_id: user.id as string,
          recipient_id: property.landlord_id as string,
          message: messageText.trim(),
          created_at: new Date().toISOString(),
          is_read: false,
          sender: 'tenant',
          text: messageText.trim(),
          time: formatMessageTime(new Date().toISOString()),
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Refresh messages to ensure we have the latest
        setTimeout(() => {
          refreshMessages();
        }, 500);

        try {
          if (user?.id) {
            const CONVERSATIONS_CACHE_KEY = `conversations-${String(user.id)}`;
            localStorage.removeItem(CONVERSATIONS_CACHE_KEY);
            
            const event = new CustomEvent('conversationUpdated', { 
              detail: { propertyId: property.id } 
            });
            window.dispatchEvent(event);
          }
        } catch (cacheError) {
          console.error("Error updating conversations cache:", cacheError);
        }
      }
      
      setMessageText("");
      
      setLastRefreshAt(new Date());
      setStaleData(false);
      
      toast({
        title: "Message sent",
        description: "Your message has been sent to the landlord",
      } as ToastOptions);
      
    } catch (error) {
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Could not send your message",
        variant: "destructive",
      } as ToastOptions);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      
      if (date.toDateString() === now.toDateString()) {
        return format(date, 'h:mm a')
      }
      
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff < 7) {
        return formatDistanceToNow(date, { addSuffix: true })
      }
      
      return format(date, 'MMM d')
    } catch {
      return 'Unknown'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Get refresh status text and icon
  const getRefreshStatusInfo = () => {
    if (refreshStatus === 'refreshing') {
      return {
        text: 'Refreshing...',
        icon: <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      }
    } else if (refreshStatus === 'updated') {
      return {
        text: 'Updated',
        icon: <Check className="h-4 w-4 mr-2 text-green-500" />
      }
    } else if (staleData) {
      return {
        text: 'Update Available',
        icon: <RefreshCw className="h-4 w-4 mr-2 text-amber-400" />
      }
    } else {
      return {
        text: 'Refresh',
        icon: <RefreshCw className="h-4 w-4 mr-2" />
      }
    }
  }

  const refreshStatusInfo = getRefreshStatusInfo();
  const modalTitle = property?.name ? `Message about ${property.name}` : "Message Landlord";

  // Helper function to render chat messages
  const renderChatMessages = () => {
    if (loading && messages.length === 0) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse flex space-x-2">
            <div className="h-2 w-2 bg-zinc-600 rounded-full"></div>
            <div className="h-2 w-2 bg-zinc-600 rounded-full"></div>
            <div className="h-2 w-2 bg-zinc-600 rounded-full"></div>
          </div>
        </div>
      )
    }

    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center px-4">
          <MessageSquare className="w-12 h-12 mb-3 text-zinc-400/20" />
          <p>No messages yet</p>
          <p className="text-sm mt-2">
            Send a message to inquire about this property. Ask about availability, amenities, or schedule a viewing.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {hasMoreMessages && (
          <div className="flex justify-center my-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMoreMessages}
              disabled={loadingMoreMessages}
              className="text-xs"
            >
              {loadingMoreMessages ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
        
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={cn("flex", message.sender === "tenant" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2",
                message.sender === "tenant"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-zinc-800 text-zinc-100 rounded-bl-none",
              )}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
              <div
                className={cn(
                  "text-xs mt-1 flex justify-end items-center gap-1",
                  message.sender === "tenant" ? "text-indigo-200" : "text-zinc-400",
                )}
              >
                <span>{message.time}</span>
                {message.sender === "tenant" && message.is_read && <Check className="h-3 w-3" />}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    )
  }

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!open || !conversation?.id) return;

    // Subscribe to messages for this conversation
    interface NewMessagePayload {
      id: string;
      sender_id: string;
      recipient_id: string;
      message: string;
      created_at: string;
      is_read: boolean;
    }

    const messagesSubscription = supabase
      .channel(`messages-${conversation.id}`)
      .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'property_messages',
        filter: `conversation_id=eq.${conversation.id}`
      },
      (payload: { new: NewMessagePayload }) => {
        // Handle new message
        const newMessage = payload.new;
        
        // Only add the message if we don't already have it
        if (!messages.some(m => m.id === newMessage.id)) {
        const formattedMessage: Message = {
          id: newMessage.id,
          sender_id: newMessage.sender_id,
          recipient_id: newMessage.recipient_id,
          message: newMessage.message,
          created_at: newMessage.created_at,
          is_read: newMessage.is_read,
          sender: newMessage.sender_id === user?.id ? 'tenant' : 'landlord',
          text: newMessage.message,
          time: formatMessageTime(newMessage.created_at),
        };
        
        setMessages(prevMessages => [...prevMessages, formattedMessage]);
        
        // If the message is from the landlord, mark it as read
        if (newMessage.sender_id !== user?.id && !newMessage.is_read) {
          markMessagesAsRead(conversation.id);
        }
        }
      }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [open, conversation?.id, user?.id, messages]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={(openState) => {
        if (openState && conversation?.id) {
          refreshMessages();
        }
        onOpenChangeAction(openState);
      }}
    >
      <DialogContent className="p-0 max-w-[800px] h-[600px] max-h-[90vh] overflow-hidden flex flex-col bg-black border-white/10 text-zinc-100">
        <DialogTitle className="sr-only">{modalTitle}</DialogTitle>
        
        <div className="bg-black border-b border-white/10 p-3 flex items-center justify-between sticky top-0 z-10">
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
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 px-2 bg-black border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white",
                refreshStatus === "updated" && "text-green-400 border-green-800 bg-green-900/20",
                staleData && "text-amber-400 border-amber-800 bg-amber-900/20"
              )}
              onClick={refreshMessages}
              disabled={isRefreshing || !conversation?.id}
            >
              {refreshStatusInfo.icon}
              <span className="text-xs hidden sm:inline">{refreshStatusInfo.text}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={() => onOpenChangeAction(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto p-4"
          ref={messagesContainerRef}
        >
          {renderChatMessages()}
        </div>

        <div className="border-t border-white/10 p-3 flex gap-2 bg-black/80 sticky bottom-0">
          <Textarea
            ref={messageInputRef}
            placeholder="Type your message here..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[40px] max-h-[80px] resize-none bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-700"
          />
          <Button
            size="icon" 
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendingMessage}
            className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
          >
            {sendingMessage ? (
              <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}