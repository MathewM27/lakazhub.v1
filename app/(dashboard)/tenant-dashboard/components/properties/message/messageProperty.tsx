"use client"

import { useState, useEffect, useRef } from "react"
import { Send, MessageSquare, RefreshCw, Check, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "../../../utils/supabase/client"
import { useToast } from "../../../hooks/use-toast"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

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
  property: any;
}

export default function TenantMessage({ open, onOpenChangeAction, property }: TenantMessageProps) {
  const [user, setUser] = useState<any>(null)
  const [landlord, setLandlord] = useState<any>(null)
  const [messageText, setMessageText] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [conversation, setConversation] = useState<any>(null)
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
  }, [open, lastRefreshAt])

  // Effect to handle refresh status timeouts
  useEffect(() => {
    let statusTimer: NodeJS.Timeout;
    
    if (refreshStatus === 'updated') {
      console.log("Setting timer to reset refresh status");
      statusTimer = setTimeout(() => {
        console.log("Timer expired, setting refresh status to idle");
        setRefreshStatus('idle');
      }, 3000);
    }
    
    return () => {
      if (statusTimer) {
        console.log("Clearing refresh status timer on cleanup");
        clearTimeout(statusTimer);
      }
    };
  }, [refreshStatus]);

  // Get the current user (tenant)
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      
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

  // Get landlord info
  useEffect(() => {
    if (!property?.landlord_id) return
    
    const fetchLandlord = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo')
        .eq('id', property.landlord_id)
        .single()
        
      if (!error && data) {
        setLandlord(data)
      }
    }
    
    fetchLandlord()
  }, [property])

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
  }, [open, conversation?.id, staleData])

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
          // Conversation exists
          setConversation(existingConv)
          // Format messages from the JSONB array
          if (existingConv.messages && Array.isArray(existingConv.messages)) {
            const formattedMessages = existingConv.messages.map((msg: { id: string; sender_id: string; recipient_id: string; message: string; created_at: string; is_read: boolean }) => ({
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
            setMessages(formattedMessages);
            
            // Mark messages as read if needed
            if (formattedMessages.some((m: Message) => m.sender === 'landlord' && !m.is_read)) {
              markMessagesAsRead(existingConv.id);
            }
          } else {
            setMessages([]);
          }
        } else {
          // No conversation yet - we'll create one when first message is sent
          setMessages([])
        }
      } catch (error: any) {
        toast({
          title: "Error loading conversation",
          description: error.message || "Could not load conversation data",
          variant: "destructive",
        } as ToastOptions)
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrCreateConversation()
    
    // Clean up function
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
      console.log("No conversation ID found, cannot refresh");
      return;
    }
    
    console.log("Starting refresh with conversation ID:", conversation.id);
    setIsRefreshing(true);
    setRefreshStatus('refreshing');
    
    try {
      console.log("Fetching updated conversation data...");
      // More specific selection to improve query performance
      const { data, error } = await supabase
        .from('property_conversations')
        .select('id, messages')
        .eq('id', conversation.id)
        .single();
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Received conversation data:", data);
      
      if (data && data.messages && Array.isArray(data.messages)) {
        console.log("Processing messages array, current messages count:", messages.length);
        
        // Find new messages that aren't already in our state
        const existingIds = new Set(messages.map(m => m.id));
        console.log("Existing message IDs count:", existingIds.size);
        
        const allMessages = data.messages.map((msg: { id: string; sender_id: string; recipient_id: string; message: string; created_at: string; is_read: boolean }) => ({
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
        
        console.log("All messages from response:", allMessages.length);
        const newMessages = allMessages.filter((msg: Message) => !existingIds.has(msg.id));
        console.log("New messages found:", newMessages.length);
        
        if (newMessages.length > 0) {
          console.log("Setting messages with new content");
          setMessages(allMessages);
          
          // Mark messages as read if user is recipient
          const hasUnreadMessagesForUser = allMessages.some(
            (msg: Message) => msg.sender === 'landlord' && !msg.is_read
          );
          
          if (hasUnreadMessagesForUser) {
            console.log("Marking messages as read");
            markMessagesAsRead(conversation.id);
          }
          
          toast({
            title: `${newMessages.length} new message${newMessages.length > 1 ? 's' : ''}`,
            description: "New messages have been loaded",
          } as ToastOptions);
        } else {
          console.log("No new messages found");
          toast({
            title: "No new messages",
            description: "You're all caught up!",
          } as ToastOptions);
        }
        
        // Update conversation data - only update the messages part to avoid losing other conversation data
        setConversation((prev: typeof conversation) => ({...prev, messages: data.messages as Message[]}));
        
        // Update last refreshed time
        const now = new Date();
        console.log("Setting last refresh time to:", now);
        setLastRefreshAt(now);
        setStaleData(false);
      } else {
        console.log("No message array in response or it's not an array");
        throw new Error("Invalid response format from server");
      }
      
      // Show "up to date" status for 3 seconds
      console.log("Setting refresh status to 'updated'");
      setRefreshStatus('updated');
      
    } catch (error: any) {
      console.error("Error in refreshMessages:", error);
      toast({
        title: "Error refreshing messages",
        description: error.message || "Could not refresh messages",
        variant: "destructive",
      } as ToastOptions);
      setRefreshStatus('idle');
    } finally {
      console.log("Finishing refresh, setting isRefreshing to false");
      setIsRefreshing(false);
    }
  }

  // Fetch messages for conversation with pagination
  const fetchMessages = async (conversationId: string) => {
    setLoading(true)
    
    try {
      // Reset pagination state
      setCurrentPage(0)
      
      // Get messages for this conversation with pagination
      const { data, error, count } = await supabase
        .from('property_messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false }) // Descending to get newest first
        .range(0, PAGE_SIZE - 1) // Get first page
        
      if (error) throw error
      
      // Check if there are more messages to load
      setHasMoreMessages(count ? count > PAGE_SIZE : false)
      
      // Reverse the array to get chronological order (oldest first)
      const chronologicalMessages = [...(data || [])].reverse()
      
      // Format messages for UI
      const formattedMessages = chronologicalMessages.map((msg: { id: string; sender_id: string; recipient_id: string; message: string; created_at: string; is_read: boolean }) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        message: msg.message,
        created_at: msg.created_at,
        is_read: msg.is_read,
        sender: msg.sender_id === user.id ? 'tenant' as const : 'landlord' as const,
        text: msg.message,
        time: formatMessageTime(msg.created_at),
      }));
      
      setMessages(formattedMessages)
      
      // Mark messages as read
      markMessagesAsRead(conversationId)
      
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message || "Could not load messages",
        variant: "destructive",
      } as ToastOptions)
    } finally {
      setLoading(false)
    }

    // Update last refreshed time
    setLastRefreshAt(new Date())
    setStaleData(false)
  }
  
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
      
      // Check if there are more messages to load after this batch
      setHasMoreMessages(count ? count > endRange + 1 : false)
      
      // Add older messages to the beginning of the array (reverse to maintain chronological order)
      const olderMessages = [...(data || [])].reverse()
      
      // Format messages for UI
      const formattedMessages = olderMessages.map((msg: { id: string; sender_id: string; recipient_id: string; message: string; created_at: string; is_read: boolean }) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        message: msg.message,
        created_at: msg.created_at,
        is_read: msg.is_read,
        sender: msg.sender_id === user.id ? 'tenant' as const : 'landlord' as const,
        text: msg.message,
        time: formatMessageTime(msg.created_at),
      }));
      
      setMessages(prev => [...formattedMessages, ...prev])
      
      // Update current page
      setCurrentPage(nextPage)
    } catch (error: any) {
      toast({
        title: "Error loading more messages",
        description: error.message || "Could not load older messages",
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
      
      // Use the consolidated mark_conversation_messages_read RPC function
      await supabase.rpc("mark_conversation_messages_read", {
        p_conversation_id: conversationId
      });
      
      // Update the UI to show messages as read
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
      // If no conversation exists, we need to create one and send the first message
      if (!conversation) {
        // Using the create_property_inquiry RPC function
        const { data: convId, error: convError } = await supabase.rpc('create_property_inquiry', {
          p_property_id: property.id,
          p_tenant_id: user.id,
          p_message: messageText.trim()
        });
        
        if (convError) throw convError;
        
        // Get the full conversation data
        const { data: convData, error: fetchError } = await supabase
          .from('property_conversations')
          .select('*')
          .eq('id', convId)
          .single();
          
        if (fetchError) throw fetchError;
        
        setConversation(convData);
        
        // Format and add the message to UI
        if (convData.messages && Array.isArray(convData.messages) && convData.messages.length > 0) {
          const formattedMessages = convData.messages.map((msg: { id: string; sender_id: string; recipient_id: string; message: string; created_at: string; is_read: boolean }) => ({
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
          setMessages(formattedMessages);
        }
      } else {
        // Conversation exists, add a new message using the add_message_to_conversation function
        const { data, error } = await supabase.rpc('add_message_to_conversation', {
          p_conversation_id: conversation.id,
          p_sender_id: user.id,
          p_recipient_id: property.landlord_id,
          p_message: messageText.trim()
        });
        
        if (error) throw error;
        
        // Add message to UI immediately
        const newMessage: Message = {
          id: data || Date.now().toString(),
          sender_id: user.id,
          recipient_id: property.landlord_id,
          message: messageText.trim(),
          created_at: new Date().toISOString(),
          is_read: false,
          sender: 'tenant',
          text: messageText.trim(),
          time: formatMessageTime(new Date().toISOString()),
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Refresh conversation to get the updated messages array
        setTimeout(() => {
          refreshMessages();
        }, 500);
      }
      
      // Clear the input
      setMessageText("");
      
      // Update last refreshed time
      setLastRefreshAt(new Date());
      setStaleData(false);
      
      toast({
        title: "Message sent",
        description: "Your message has been sent to the landlord",
      } as ToastOptions);
      
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message || "Could not send your message",
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
      
      // If today, show time
      if (date.toDateString() === now.toDateString()) {
        return format(date, 'h:mm a')
      }
      
      // If within last 7 days, show day name
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff < 7) {
        return formatDistanceToNow(date, { addSuffix: true })
      }
      
      // Otherwise show date
      return format(date, 'MMM d')
    } catch (e) {
      return 'Unknown'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only send on Enter without Shift
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
        {/* Load More button */}
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

  return (
    <Dialog 
      open={open} 
      onOpenChange={(openState) => {
        if (openState && conversation?.id) {
          // Refresh messages when the dialog is opened
          refreshMessages();
        }
        onOpenChangeAction(openState);
      }}
    >
      <DialogContent className="p-0 max-w-[800px] h-[600px] max-h-[90vh] overflow-hidden flex flex-col bg-black border-white/10 text-zinc-100">
        <DialogTitle className="sr-only">{modalTitle}</DialogTitle>
        
        {/* Fixed header - matches the notification-modal header style */}
        <div className="bg-black border-b border-white/10 p-3 flex items-center justify-between sticky top-0 z-10">
          {/* Mobile header - simplified */}
          <div className="flex flex-col sm:hidden">
            <span className="font-bold text-white truncate max-w-[120px]">{modalTitle}</span>
          </div>
          
          {/* Desktop header - full content */}
          <div className="items-center space-x-2 hidden sm:flex">
            <span className="font-bold text-white">LakazHub</span>
            <span className="text-xs text-zinc-400">Messenger</span>
          </div>

          {/* Title area - desktop only */}
          <div className="text-center hidden sm:block">
            <h3 className="text-sm font-medium truncate text-white">{modalTitle}</h3>
            {lastRefreshAt && (
              <div className="text-[10px] text-zinc-400">
                Last updated {formatDistanceToNow(lastRefreshAt, { addSuffix: true })}
              </div>
            )}
          </div>

          {/* Action buttons */}
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
              variant="outline"
              size="sm"
              className="bg-red-900/20 border-red-800"
              onClick={() => {
                console.log("Debug - current state:", {
                  conversation,
                  messages: messages.length,
                  user,
                  refreshStatus
                });
                
                // Test direct fetch without state changes
                if (conversation?.id) {
                    Promise.resolve(
                      supabase
                        .from('property_conversations')
                        .select<'id, messages', { id: string; messages: Message[] }>('id, messages')
                        .eq('id', conversation.id)
                        .single()
                    )
                    .then((res: { data: { id: string; messages: Message[] } | null; error: any }) => {
                      console.log("Debug fetch result:", res);
                    })
                    .catch((err: any) => {
                      console.error("Debug fetch error:", err);
                    });
                }
              }}
            >
              Debug
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

        {/* Main chat area */}
        <div 
          className="flex-1 overflow-y-auto p-4"
          ref={messagesContainerRef}
        >
          {renderChatMessages()}
        </div>

        {/* Message input - fixed at bottom */}
        <div className="border-t border-white/10 p-3 flex gap-2 bg-black/80 sticky bottom-0">
          <Textarea
            ref={messageInputRef}
            placeholder="Type your message here... (Shift+Enter for new line)"
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