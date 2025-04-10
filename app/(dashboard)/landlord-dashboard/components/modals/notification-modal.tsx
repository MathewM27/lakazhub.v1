"use client"

import type React from "react"
import { Conversation } from "../../types/index";  

import { useState, useEffect, useRef, useCallback, memo } from "react"
import { Send, RefreshCw, Check, Trash2, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "../../lib/utils/supabase/client"
import { useToast } from "../../hooks/use-toast"
import { format, formatDistanceToNow } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from 'uuid';

// Define proper type for user
interface User {
  id: string;
  user_metadata?: {
    full_name?: string;
  };
  [key: string]: any; 
}

// Define message type for clarity
interface MessageType {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

// Define types for better TypeScript support
interface UIMessage {
  id: string
  sender: "landlord" | "tenant"
  text: string
  time: string
  is_read: boolean
}

interface Tenant {
  id: string
  name: string
  avatar: string
  lastMessage?: string
  time?: string
  unread: number
  messages: UIMessage[]
  hasMoreMessages?: boolean
  currentPage?: number
  counterparty_id?: string
}

interface NotificationsModalProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  property?: {
    id: string;
    name?: string;
    [key: string]: any;
  }
  initialConversationId?: string
}
interface ConversationPayload {
  new: Conversation;
  old: Conversation;
}


// Add this new cache outside the component to persist between renders
const messagesCache = new Map<
  string,
  {
    conversations: Tenant[]
    messages: Record<string, UIMessage[]>
    timestamp: number
  }
>()

// Cache expiration time (in ms) - 5 minutes
const CACHE_EXPIRATION = 5 * 60 * 1000

export default function NotificationsModal({ 
  open, 
  onOpenChangeAction, 
  property,
  initialConversationId 
}: NotificationsModalProps) {
  // State for the list of tenants
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [messageText, setMessageText] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null)
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState<"idle" | "refreshing" | "updated">("idle")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState<string | null>(null)
  const [isCacheStale, setIsCacheStale] = useState(false)
  
  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const messageSubscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  
  // Supabase client is already imported from the client utility
  // No need to create a new instance here
  
  // Toast
  const { toast } = useToast()
  
  // Modal title
  const modalTitle = selectedTenant ? selectedTenant.name : "Messenger"
  
  // Format message time
  const formatMessageTime = useCallback((timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()

      // If today, show time
      if (date.toDateString() === now.toDateString()) {
        return format(date, "h:mm a")
      }

      // If within last 7 days, show day name
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff < 7) {
        return formatDistanceToNow(date, { addSuffix: true })
      }

      // Otherwise show date
      return format(date, "MMM d")
    } catch (_error) { // Use underscore to indicate intentionally unused variable
      return "Unknown"
    }
  }, [])
  
  // Helper function to convert database messages to UI messages
  const formatMessagesForUI = useCallback((messages: any[]): UIMessage[] => {
    return messages.map(msg => ({
      id: msg.id,
      sender: msg.sender_id === user?.id ? "landlord" as const : "tenant" as const,
      text: msg.message,
      time: formatMessageTime(msg.created_at),
      is_read: msg.is_read
    }));
  }, [user?.id, formatMessageTime]);

  // Function to fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string, page = 0, pageSize = 20) => {
    if (!user?.id) {
      console.log('Cannot fetch messages: No user ID available');
      return [];
    }
    
    try {
      console.log(`Fetching messages for conversation ${conversationId}, page ${page}, size ${pageSize}`);
      
      // Check cache first
      if (property?.id) {
        const cacheKey = `property_${property.id}_user_${user.id}`;
        const cachedData = messagesCache.get(cacheKey);
        
        if (cachedData?.messages?.[conversationId]) {
          console.log('Using cached messages for conversation:', conversationId);
          return cachedData.messages[conversationId];
        }
      }
      
      // Try using the fixed RPC function with correct parameter names
      const { data, error } = await supabase.rpc('get_conversation_messages', {
        p_conversation_id: conversationId,
        p_page: page,
        p_page_size: pageSize
      });
      
      if (error) {
        console.error('Error fetching messages:', error);
        console.error('Error details:', JSON.stringify(error));
        
        // Fallback: Try to fetch messages directly from the conversation record
        console.log('Falling back to direct query for messages');
        
        const { data: convData, error: convError } = await supabase
          .from('property_conversations')
          .select('messages')
          .eq('id', conversationId)
          .single();
          
        if (convError) {
          console.error('Error fetching conversation:', convError);
          throw new Error(`Failed to fetch messages: ${convError.message || 'Unknown error'}`);
        }
        
        if (!convData || !convData.messages || !Array.isArray(convData.messages)) {
          console.log('No messages found in conversation');
          return [];
        }
        
        // Sort messages by created_at in descending order (newest first)
        const allMessages = [...convData.messages].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // Apply pagination
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedMessages = allMessages.slice(startIndex, endIndex);
        
        return formatMessagesForUI(paginatedMessages);
      }
      
      console.log(`Fetched ${data.length} messages for conversation ${conversationId}`);
      
      // Format the messages for UI display
      return formatMessagesForUI(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error loading messages",
        description: "Could not load conversation messages",
        variant: "destructive",
      });
      return [];
    }
  }, [user?.id, property?.id, formatMessageTime, formatMessagesForUI, toast]);

  // Function to load more messages when scrolling up
  const loadMoreMessages = useCallback(async () => {
    if (!selectedTenant || !selectedTenant.hasMoreMessages) return;
    
    const nextPage = (selectedTenant.currentPage || 0) + 1;
    console.log(`Loading more messages, page ${nextPage}`);
    
    try {
      const moreMessages = await fetchMessages(selectedTenant.id, nextPage, 20);
      
      if (moreMessages.length === 0) {
        setSelectedTenant(prev => 
          prev ? { ...prev, hasMoreMessages: false } : null
        );
        return;
      }
      
      // Add the new messages to the existing ones
      setSelectedTenant(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, ...moreMessages],
          currentPage: nextPage,
          hasMoreMessages: moreMessages.length === 20 // If we got a full page, there might be more
        };
      });
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  }, [selectedTenant, fetchMessages]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, []);

  // Handle scroll events in the message container
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      const isNearTop = scrollTop < 50
      
      // If user scrolls up, mark that they've scrolled away from bottom
      if (!isAtBottom && scrollTop > 0) {
        setUserHasScrolledUp(true)
      }
      
      // If user scrolls back to bottom, reset the flag
      if (isAtBottom) {
        setUserHasScrolledUp(false)
      }
      
      // If user scrolls to top and there are more messages to load, load them
      if (isNearTop && selectedTenant?.hasMoreMessages && !loadingMoreMessages) {
        loadMoreMessages()
      }
    }
    
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [selectedTenant?.hasMoreMessages, loadingMoreMessages, loadMoreMessages])

  // Scroll to bottom when messages change, unless user has scrolled up
  useEffect(() => {
    if ((selectedTenant?.messages ?? []).length > 0 && !userHasScrolledUp) {
      scrollToBottom()
    }
  }, [selectedTenant?.messages, scrollToBottom, userHasScrolledUp, selectedTenant?.messages?.length]);

  // Auto-scroll to bottom of message area when new messages arrive
  useEffect(() => {
    if ((selectedTenant?.messages ?? []).length > 0 && !userHasScrolledUp) {
      scrollToBottom("smooth")
    }
  }, [selectedTenant?.messages, scrollToBottom, userHasScrolledUp, selectedTenant?.messages?.length]);

  // Get the current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    fetchUser()
  }, [])

  // Reset selected tenant when modal is closed
  useEffect(() => {
    if (!open) {
      setSelectedTenant(null)
      setMessageText("")
    }
  }, [open])

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!open || !user?.id) return;
    
    // Clean up any existing subscription
    if (messageSubscriptionRef.current) {
      messageSubscriptionRef.current.unsubscribe();
      messageSubscriptionRef.current = null;
    }
    
    // Set up a new subscription to listen for conversation updates
    const subscription = supabase
      .channel('property_conversations_channel')
      .on(
        'postgres_changes' as any, // Type assertion to bypass TypeScript checking
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'property_conversations',
          filter: `landlord_id=eq.${user.id}`,
        }, 
        (payload: ConversationPayload) => {
          // Handle updated conversation
          const updatedConversation = payload.new as Conversation;
          
          // Update the tenant list to show new unread message
          setTenants(prev => {
            return prev.map(tenant => {
              if (tenant.id === updatedConversation.id) {
                // Get the last message from the messages array
                const messages = updatedConversation.messages || [];
                const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
                
                // Update this tenant's unread count and last message
                return {
                  ...tenant,
                  unread: updatedConversation.landlord_unread_count,
                  lastMessage: lastMessage ? lastMessage.message : tenant.lastMessage,
                  time: lastMessage ? formatMessageTime(lastMessage.created_at) : tenant.time,
                };
              }
              return tenant;
            });
          });
          
          // If this conversation is currently selected, update the messages
          if (selectedTenant?.id === updatedConversation.id) {
            // Get the messages from the updated conversation
            const messages = updatedConversation.messages || [];
            
            // Check if there are new messages by comparing with current messages
            if (selectedTenant.messages.length < messages.length) {
              // Format the new messages
              const formattedMessages = formatMessagesForUI(messages);
              
              // Update the selected tenant with the new messages
              setSelectedTenant(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  messages: formattedMessages,
                  unread: updatedConversation.landlord_unread_count,
                };
              });
            }
          }
        }
      )
      .subscribe();
    
    messageSubscriptionRef.current = subscription;
    
    // Clean up subscription on unmount or when modal closes
    return () => {
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe();
        messageSubscriptionRef.current = null;
      }
    };
  }, [open, user?.id, selectedTenant?.id, formatMessageTime, formatMessagesForUI]);

  // Initial load when modal is opened
  useEffect(() => {
    if (!open || !property?.id || !user?.id) return

    // Check if we have a valid cache for this property
    const cacheKey = `property_${property.id}_user_${user.id}`
    const cachedData = messagesCache.get(cacheKey)
    const now = Date.now()

    // Use cache if it exists and isn't expired
    if (cachedData && now - cachedData.timestamp < CACHE_EXPIRATION) {
      setTenants(cachedData.conversations)
      setLastRefreshAt(new Date(cachedData.timestamp))

      // If initialConversationId is provided, select that conversation
      if (initialConversationId) {
        const targetTenant = cachedData.conversations.find(t => t.id === initialConversationId)
        if (targetTenant) {
          setSelectedTenant(targetTenant);
          // Check if we have cached messages for this tenant
          if (property?.id && cachedData?.messages?.[initialConversationId]) {
            setSelectedTenant({
              ...targetTenant,
              messages: cachedData.messages[initialConversationId],
              hasMoreMessages: true,
              currentPage: 0
            });
          } else {
            // Fetch messages if not in cache
            fetchMessages(initialConversationId, 0, 20).then(messages => {
              setSelectedTenant({
                ...targetTenant,
                messages,
                hasMoreMessages: messages.length === 20,
                currentPage: 0
              });
            });
          }
        }
      } 
      // Otherwise use previous selection or first tenant logic
      else if (selectedTenant) {
        const cachedTenant = cachedData.conversations.find((t: Tenant) => t.id === selectedTenant.id)
        if (cachedTenant) {
          const cachedMessages = cachedData.messages[selectedTenant.id] || []
          setSelectedTenant({
            ...cachedTenant,
            messages: cachedMessages,
          })
        } else if (cachedData.conversations.length > 0) {
          // Select first tenant if previous one not found
          setSelectedTenant(cachedData.conversations[0])

          // Load messages from cache if available
          const firstTenantId = cachedData.conversations[0].id
          if (cachedData.messages[firstTenantId]) {
            setSelectedTenant({
              ...cachedData.conversations[0],
              messages: cachedData.messages[firstTenantId],
            })
          } else {
            // Fetch messages if not in cache
            fetchMessages(firstTenantId, 0, 20).then(messages => {
              setSelectedTenant({
                ...cachedData.conversations[0],
                messages,
              })
            })
          }
        }
      } else if (cachedData.conversations.length > 0) {
        // Select first tenant if none was selected
        const firstTenant = cachedData.conversations[0]
        setSelectedTenant(firstTenant)

        // Use cached messages if available
        if (cachedData.messages[firstTenant.id]) {
          setSelectedTenant({
            ...firstTenant,
            messages: cachedData.messages[firstTenant.id],
          })
        } else {
          fetchMessages(firstTenant.id, 0, 20).then(messages => {
            setSelectedTenant({
              ...firstTenant,
              messages,
            })
          })
        }
      }

      setLastRefreshAt(new Date());
      
      // Cache the conversations
      if (property?.id && user?.id) {
        const cacheKey = `property_${property.id}_user_${user.id}`;
        const cachedData = messagesCache.get(cacheKey) || {
          conversations: [],
          messages: {},
          timestamp: Date.now(),
        };
        
        cachedData.conversations = cachedData.conversations.map(tenant => {
          if (tenant.id === initialConversationId) {
            return {
              ...tenant,
              unread: 0
            }
          }
          return tenant
        })
        cachedData.timestamp = Date.now();
        messagesCache.set(cacheKey, cachedData);
      }
    } else {
      // No valid cache, fetch fresh data
      fetchConversations(initialConversationId)
    }
  }, [open, property?.id, user?.id, initialConversationId])

  // Function to fetch conversations - now extracted as its own function
  const fetchConversations = useCallback(async (targetConversationId?: string) => {
    if (!user?.id) {
      console.log("Cannot fetch conversations: No user ID available");
      return;
    }

    setLoading(true);

    try {
      console.log("Fetching conversations for user:", user.id);
      // Fetch conversations using the `get_user_conversations` RPC function
      // If property is provided, filter conversations by that property
      let conversationsData;
      
      if (property?.id) {
        console.log("Fetching conversations for property:", property.id);
        // Use property_id filter when a specific property is selected
        const { data, error } = await supabase.rpc("get_user_conversations_by_property", {
          property_id_param: property.id
        });
        
        if (error) {
          console.error("RPC error details:", JSON.stringify(error));
          
          // Fallback: Try to query the database directly
          console.log("Falling back to direct database query for conversations");
          
          const { data: directData, error: directError } = await supabase
            .from("property_conversations")
            .select("*")
            .eq("property_id", property.id);
            
          if (directError) {
            console.error("Error with direct query:", directError);
            throw new Error(`Error fetching property conversations: ${error.message || "Unknown error"}`);
          }
          
          conversationsData = directData;
        } else {
          conversationsData = data;
        }
      } else {
        console.log("Fetching all landlord conversations");
        // Fetch all conversations if no property is specified
        const { data, error } = await supabase.rpc("get_user_conversations");
        
        if (error) {
          console.error("RPC error details:", JSON.stringify(error));
          
          // Fallback: Try to query the database directly
          console.log("Falling back to direct database query for all conversations");
          
          const { data: directData, error: directError } = await supabase
            .from("property_conversations")
            .select("*");
            
          if (directError) {
            console.error("Error with direct query:", directError);
            throw new Error(`Error fetching all conversations: ${error.message || "Unknown error"}`);
          }
          
          conversationsData = directData;
        } else {
          conversationsData = data;
        }
      }

      console.log("Conversations data:", conversationsData);
      if (!conversationsData || conversationsData.length === 0) {
        setTenants([]);
        setLoading(false);
        return;
      }

      // Format the conversations for the UI
      const formattedTenants = conversationsData.map((conv: {
        conversation_id: string;
        counterparty_name: string;
        counterparty_photo: string;
        last_message: string;
        last_message_at: string;
        unread_count: number;
        counterparty_id: string;
      }) => ({
        id: conv.conversation_id,
        name: conv.counterparty_name || "Unknown",
        avatar: conv.counterparty_photo || "/default-avatar.png",
        lastMessage: conv.last_message || "No messages yet",
        time: formatMessageTime(conv.last_message_at),
        unread: conv.unread_count || 0,
        messages: [],
        counterparty_id: conv.counterparty_id,
      }));

      setTenants(formattedTenants);

      // Select tenant based on initialConversationId if provided
      if (targetConversationId) {
        const targetTenant = formattedTenants.find((t: Tenant) => t.id === targetConversationId);
        if (targetTenant) {
          setSelectedTenant(targetTenant);
          // Check if we have cached messages for this tenant
          if (property?.id && messagesCache.get(`property_${property.id}_user_${user.id}`)?.messages?.[targetConversationId]) {
            setSelectedTenant({
              ...targetTenant,
              messages: messagesCache.get(`property_${property.id}_user_${user.id}`)?.messages[targetConversationId],
              hasMoreMessages: true,
              currentPage: 0
            });
          } else {
            // Fetch messages if not in cache
            fetchMessages(targetConversationId, 0, 20).then(messages => {
              setSelectedTenant({
                ...targetTenant,
                messages,
                hasMoreMessages: messages.length === 20,
                currentPage: 0
              });
            });
          }
        }
      } else if (formattedTenants.length > 0) {
        setSelectedTenant(formattedTenants[0]);
        fetchMessages(formattedTenants[0].id, 0, 20).then(messages => {
          setSelectedTenant({
            ...formattedTenants[0],
            messages,
          })
        })
      }

      setLastRefreshAt(new Date());
      
      // Cache the conversations
      if (property?.id && user?.id) {
        const cacheKey = `property_${property.id}_user_${user.id}`;
        const cachedData = messagesCache.get(cacheKey) || {
          conversations: [] as Tenant[],
          messages: {} as Record<string, UIMessage[]>,
          timestamp: Date.now()
        };
        
        cachedData.conversations = formattedTenants;
        cachedData.timestamp = Date.now();
        messagesCache.set(cacheKey, cachedData);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error refreshing data:", error);
      toast({
        title: "Error refreshing",
        description: errorMessage || "Could not refresh conversations and messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  }, [user?.id, property?.id, toast, fetchMessages, formatMessageTime]);

  // Function to manually fetch everything (conversations + messages)
  const refreshAll = useCallback(async () => {
    setRefreshStatus("refreshing")
    setIsRefreshing(true)

    try {
      // Clear the cache for this property
      if (property?.id && user?.id) {
        const cacheKey = `property_${property.id}_user_${user.id}`
        messagesCache.delete(cacheKey) // Clear cache before fetching
      }

      // Fetch fresh data
      await fetchConversations()

      if (selectedTenant?.id) {
        await fetchMessages(selectedTenant.id, 0, 20).then(messages => {
          setSelectedTenant({
            ...selectedTenant,
            messages,
          })
        })
      }

      setIsCacheStale(false)
      toast({
        title: "Refreshed",
        description: "Messages have been updated",
      })

      // Show "up to date" status for 3 seconds
      setRefreshStatus("updated")
      setTimeout(() => {
        setRefreshStatus("idle")
      }, 3000)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error refreshing data:", error);
      toast({
        title: "Error refreshing",
        description: errorMessage || "Could not refresh conversations and messages",
        variant: "destructive",
      })
      setRefreshStatus("idle")
    } finally {
      setIsRefreshing(false)
    }
  }, [property?.id, user?.id, selectedTenant?.id, fetchConversations, fetchMessages, toast]);

  // Function to send a message
  const handleSendMessage = useCallback(async () => {
    if (messageText.trim() === "" || !selectedTenant || !user?.id) return;

    try {
      // Add the message to the UI immediately for instant feedback
      const tempId = `temp-${Date.now()}`;
      const newMessage: UIMessage = {
        id: tempId,
        sender: "landlord" as const,
        text: messageText.trim(),
        time: formatMessageTime(new Date().toISOString()),
        is_read: true,
      };

      setSelectedTenant((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
        };
      });

      setMessageText("");

      // First, get the conversation to determine the recipient ID
      const { data: convData, error: convError } = await supabase
        .from('property_conversations')
        .select('tenant_id, landlord_id')
        .eq('id', selectedTenant.id)
        .single();
        
      if (convError) {
        throw new Error(`Failed to fetch conversation: ${convError.message}`);
      }
      
      if (!convData) {
        throw new Error("Conversation not found");
      }
      
      // Determine the recipient ID (the other party in the conversation)
      const recipientId = user.id === convData.landlord_id 
        ? convData.tenant_id 
        : convData.landlord_id;

      // Send the message using the add_message_to_conversation RPC function
      const { data: messageData, error } = await supabase.rpc("add_message_to_conversation", {
        p_conversation_id: selectedTenant.id,
        p_sender_id: user.id,
        p_message: newMessage.text,
        p_recipient_id: recipientId
      });

      if (error) {
        console.error("Error sending message:", error);
        console.error("Error details:", JSON.stringify(error));
        
        // Try fallback approach: directly update the conversation's messages array
        console.log("Falling back to direct update for sending message");
        
        // Create a new message object
        const messageObj = {
          id: uuidv4(), // Generate a UUID for the message
          sender_id: user.id,
          recipient_id: recipientId,
          message: newMessage.text,
          is_read: false,
          created_at: new Date().toISOString()
        };
        
        // Add the message to the messages array
        const { data: currentConv, error: fetchError } = await supabase
          .from('property_conversations')
          .select('messages, tenant_unread_count, landlord_unread_count')
          .eq('id', selectedTenant.id)
          .single();
          
        if (fetchError) {
          throw new Error(`Failed to fetch current messages: ${fetchError.message}`);
        }
        
        const updatedMessages = [...(currentConv.messages || []), messageObj];
        
        // Update the conversation
        const { error: updateError } = await supabase
          .from('property_conversations')
          .update({
            messages: updatedMessages,
            last_message_text: newMessage.text,
            last_message_at: new Date().toISOString(),
            // Increment unread count for the recipient
            ...(user.id === convData.landlord_id 
              ? { tenant_unread_count: (currentConv.tenant_unread_count || 0) + 1 }
              : { landlord_unread_count: (currentConv.landlord_unread_count || 0) + 1 })
          })
          .eq('id', selectedTenant.id);
          
        if (updateError) {
          throw new Error(`Failed to update conversation: ${updateError.message}`);
        }
        
        // Update the temporary message with the real ID
        setSelectedTenant((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === tempId ? { ...msg, id: messageObj.id } : msg
            ),
          };
        });
        
        return; // Exit early since we've handled the message sending
      }
      
      // Update the temporary message with the real ID
      if (messageData) {
        setSelectedTenant((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === tempId ? { ...msg, id: messageData.id } : msg
            ),
          };
        });
      }

      setLastRefreshAt(new Date());
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error refreshing data:", error);
      toast({
        title: "Error refreshing",
        description: errorMessage || "Could not refresh conversations and messages",
        variant: "destructive",
      });
      
      // Remove the temporary message if there was an error
      setSelectedTenant((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(msg => !msg.id.startsWith('temp-')),
        };
      });
    }
  }, [messageText, selectedTenant, user?.id, toast, formatMessageTime]);

  // Function to confirm delete chat
  const confirmDeleteChat = useCallback((tenantId: string) => {
    setTenantToDelete(tenantId)
    setDeleteDialogOpen(true)
  }, []);

  // Function to handle delete chat
  const handleDeleteChat = useCallback(async () => {
    if (!tenantToDelete) return

    try {
      // Archive the conversation instead of deleting it
      const { error } = await supabase
        .from("property_conversations")
        .update({
          is_archived: true,
        })
        .eq("id", tenantToDelete)

      if (error) throw error

      // Remove from UI
      setTenants((prev) => prev.filter((t) => t.id !== tenantToDelete))

      // If we deleted the selected tenant, select the first one in the list
      if (selectedTenant?.id === tenantToDelete) {
        const firstTenant = tenants.find((t) => t.id !== tenantToDelete)
        if (firstTenant) {
          setSelectedTenant(firstTenant)
          fetchMessages(firstTenant.id, 0, 20).then(messages => {
            setSelectedTenant({
              ...firstTenant,
              messages,
            })
          })
        } else {
          setSelectedTenant(null)
        }
      }

      toast({
        title: "Conversation archived",
        description: "The conversation has been archived",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error refreshing data:", error);
      toast({
        title: "Error refreshing",
        description: errorMessage || "Could not refresh conversations and messages",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setTenantToDelete(null)
    }
  }, [tenantToDelete, selectedTenant?.id, tenants, fetchMessages, toast]);

  // Function to get refresh status info
  const getRefreshStatusInfo = useCallback(() => {
    if (refreshStatus === "refreshing") {
      return {
        text: "Refreshing...",
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
      }
    } else if (refreshStatus === "updated") {
      return {
        text: "Updated",
        icon: <Check className="h-4 w-4 text-green-500" />,
      }
    } else if (isCacheStale) {
      return {
        text: "Refresh",
        icon: <RefreshCw className="h-4 w-4 text-amber-400" />,
      }
    } else {
      return {
        text: "Refresh",
        icon: <RefreshCw className="h-4 w-4" />,
      }
    }
  }, [refreshStatus, isCacheStale]);

  const refreshStatusInfo = getRefreshStatusInfo()

  // Function to mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    if (!user?.id) {
      console.log('Cannot mark messages as read: No user ID available');
      return;
    }
    
    try {
      console.log('Marking messages as read for conversation:', conversationId, 'user:', user.id);
      
      // Skip checking for RPC functions since we know it's failing
      console.log('Using direct database update for marking messages as read');
      
      // Update the conversation directly in the database
      const { error: updateError } = await supabase
        .from('property_conversations')
        .update({ landlord_unread_count: 0 })
        .eq('id', conversationId);
        
      if (updateError) {
        console.error('Error updating conversation read status:', updateError);
        return;
      }
      
      console.log('Successfully marked messages as read via direct update');
      
      // Update the UI to reflect the changes
      setTenants(prev => 
        prev.map(tenant => 
          tenant.id === conversationId 
            ? { ...tenant, unread: 0 } 
            : tenant
        )
      );
      
      // Also update the cache to reflect read status
      const cacheKey = `property_${property?.id}_user_${user.id}`;
      const cachedData = messagesCache.get(cacheKey);
      
      if (cachedData) {
        const updatedConversations = cachedData.conversations.map(tenant => 
          tenant.id === conversationId 
            ? { ...tenant, unread: 0 } 
            : tenant
        );
        
        messagesCache.set(cacheKey, {
          ...cachedData,
          conversations: updatedConversations,
          timestamp: Date.now()
        });
      }
      
      // Dispatch a custom event to notify other components that messages were read
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('messagesMarkedAsRead', { 
          detail: { 
            conversationId,
            propertyId: property?.id
          } 
        });
        window.dispatchEvent(event);
        
        // Set a global variable that can be accessed by other components
        if (!window.readConversations) {
          window.readConversations = new Set();
        }
        window.readConversations.add(conversationId);
      }
      
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  }, [user?.id, property?.id, formatMessageTime, formatMessagesForUI, toast]);

  // When modal is opened with initialConversationId, mark those messages as read
  useEffect(() => {
    if (open && user?.id) {
      console.log('Modal opened with initialConversationId:', initialConversationId);
      
      // If initialConversationId is provided, mark that conversation as read immediately
      if (initialConversationId) {
        console.log('Marking messages as read for conversation:', initialConversationId);
        markMessagesAsRead(initialConversationId);
      }
    }
  }, [open, initialConversationId, user?.id, markMessagesAsRead]);

  // Update the cache with new messages
  const updateMessagesCache = useCallback((conversationId: string, messages: UIMessage[]) => {
    if (!property?.id || !user?.id) return;
    
    // Get the current cache or create a new one
    const cacheKey = `property_${property.id}_user_${user.id}`;
    const currentCache = messagesCache.get(cacheKey) || { 
      conversations: [] as Tenant[],
      messages: {} as Record<string, UIMessage[]>,
      timestamp: Date.now()
    };
    
    // Update the messages for this conversation
    const updatedCache = {
      conversations: currentCache.conversations,
      messages: {
        ...currentCache.messages,
        [conversationId]: messages
      },
      timestamp: Date.now()
    };
    
    // Save to cache
    messagesCache.set(cacheKey, updatedCache);
    console.log('Updated messages cache for conversation:', conversationId);
  }, [property?.id, user?.id]);

  // Handle selecting a tenant
  const handleTenantSelect = useCallback(async (tenant: Tenant) => {
    // If we're already on this tenant, do nothing
    if (selectedTenant?.id === tenant.id) return;
    
    setSelectedTenant(tenant);
    
    // Mark messages as read when selecting a tenant
    markMessagesAsRead(tenant.id);
    
    // Fetch messages if needed
    if (!tenant.messages || tenant.messages.length === 0) {
      const messages = await fetchMessages(tenant.id, 0, 20);
      
      // Update tenant with fetched messages
      setSelectedTenant(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages,
          hasMoreMessages: messages.length === 20, // Assume there are more if we got a full page
          currentPage: 0
        };
      });
      
      // Update cache
      updateMessagesCache(tenant.id, messages);
    }
    
    // Focus message input
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  }, [selectedTenant?.id, fetchMessages, property?.id, user?.id, markMessagesAsRead, updateMessagesCache]);

  // Helper function to render chat messages
  const renderChatMessages = () => {
    if (loading && (!selectedTenant || selectedTenant?.messages.length === 0)) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse flex space-x-2" key="loading-pulse">
            <div key="pulse-1" className="h-2 w-2 bg-zinc-600 rounded-full"></div>
            <div key="pulse-2" className="h-2 w-2 bg-zinc-600 rounded-full"></div>
            <div key="pulse-3" className="h-2 w-2 bg-zinc-600 rounded-full"></div>
          </div>
        </div>
      );
    }

    if (!selectedTenant) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
          <p>Select a conversation to view messages</p>
        </div>
      );
    }

    if (!selectedTenant.messages || selectedTenant.messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
          <p>No messages in this conversation yet</p>
          <p className="text-xs mt-2">Send a message to get started</p>
        </div>
      );
    }

    return (
      <div ref={messagesContainerRef} className="space-y-3">
        {/* Loading more messages indicator */}
        {loadingMoreMessages && (
          <div className="flex justify-center py-2">
            <div className="animate-pulse flex space-x-2" key="loading-more-pulse">
              <div key="pulse-1" className="h-2 w-2 bg-zinc-600 rounded-full"></div>
              <div key="pulse-2" className="h-2 w-2 bg-zinc-600 rounded-full"></div>
              <div key="pulse-3" className="h-2 w-2 bg-zinc-600 rounded-full"></div>
            </div>
          </div>
        )}
        
        {/* Load more button - show if there are more messages and not currently loading */}
        {selectedTenant.hasMoreMessages && !loadingMoreMessages && (
          <div className="flex justify-center py-2">
            <button 
              onClick={() => loadMoreMessages()}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
            >
              Load earlier messages
            </button>
          </div>
        )}
        
        {selectedTenant.messages.map((message) => (
          <div 
            key={message.id} 
            className={cn("flex", message.sender === "landlord" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2",
                message.sender === "landlord"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-zinc-800 text-zinc-100 rounded-bl-none",
              )}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
              <div
                className={cn(
                  "text-xs mt-1 flex justify-end items-center gap-1",
                  message.sender === "landlord" ? "text-indigo-200" : "text-zinc-400",
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

  // Memoized TenantListItem component to reduce unnecessary renders
  interface TenantListItemProps {
    tenant: Tenant
    isSelected: boolean
    onSelect: (tenant: Tenant) => Promise<void>
    onDelete: (tenantId: string) => void
  }

  const TenantListItem = memo(({ tenant, isSelected, onSelect, onDelete }: TenantListItemProps) => {
    return (
      <div
        className={cn(
          "group flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors",
          isSelected && "bg-zinc-900",
        )}
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
            <span className="text-[10px] text-zinc-500">{tenant.time}</span>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-zinc-400 truncate max-w-[100px]">{tenant.lastMessage}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-zinc-300 hover:bg-zinc-700"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(tenant.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
              <span className="sr-only">Archive conversation</span>
            </Button>
          </div>
        </div>
      </div>
    )
  });

  // Handle key down event for message input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only send on Enter without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage]);

  return (
    <Dialog
      open={open}
      onOpenChange={(openState) => {
        if (!openState) {
          setSelectedTenant(null)
          setMessageText("")
        }
        onOpenChangeAction(openState)
      }}
    >
      <DialogContent className="p-0 max-w-[800px] h-[600px] max-h-[90vh] overflow-hidden flex flex-col bg-black border-white text-zinc-100">
        {/* Add DialogTitle (can be visually hidden if needed) */}
        <DialogTitle className="sr-only">{modalTitle}</DialogTitle>
        
        {/* Fixed header - responsive design */}
        <div className="bg-black border-b border-white p-3 flex items-center justify-between">
         
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

          {/* Action buttons - adapted for mobile and desktop */}
          <div className="flex justify-center items-center space-x-2 ">
            
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mt-4 rounded-full text-black hover:text-white hover:bg-zinc-800"
              onClick={() => onOpenChangeAction(false)}
            >
              
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Main content area with fixed height */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - responsive width */}
          <div className="w-full sm:w-1/3 md:w-1/4 border-r  hidden sm:flex flex-col h-full bg-black">
            <div className="p-2 border-b border-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-medium text-zinc-400">Conversations</h3>
              
            </div>

            <div className="overflow-y-auto flex-1 ">
              {loading && tenants.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-pulse flex space-x-2" key="mobile-loading-pulse">
                    <div key="pulse-1" className="h-2 w-2 bg-zinc-600 rounded-full"></div>
                    <div key="pulse-2" className="h-2 w-2 bg-zinc-600 rounded-full"></div>
                    <div key="pulse-3" className="h-2 w-2 bg-zinc-600 rounded-full"></div>
                  </div>
                </div>
              ) : tenants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-500 px-4 text-center">
                  <p>No messages</p>
                  <p className="text-sm mt-2">You have no message inquiries for this property yet</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50 ">
                  {tenants.map((tenant) => (
                    <TenantListItem
                      key={tenant.id}
                      tenant={tenant}
                      isSelected={selectedTenant?.id === tenant.id}
                      onSelect={handleTenantSelect}
                      onDelete={(tenantId) => confirmDeleteChat(tenantId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile view - conversation selector */}
          <div className="sm:hidden w-full flex flex-col h-full bg-black">
            {!selectedTenant ? (
              <div className="flex-1 overflow-y-auto">
                <div className="p-2 border-b border-white flex items-center bg-black">
                  <h3 className="text-xs font-medium text-zinc-400">Conversations</h3>
                  <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 px-2 bg-black border-white text-zinc-300 hover:bg-zinc-700 hover:text-white",
                refreshStatus === "updated" && "text-green-400 border-green-800 bg-green-900/20",
              )}
              onClick={refreshAll}
              disabled={isRefreshing}
            >
              {refreshStatusInfo.icon}
              {/* Only show text on desktop */}
              <span className="text-xs hidden sm:inline">{refreshStatusInfo.text}</span>
            </Button>
                </div>

                {loading && tenants.length === 0 ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-pulse flex space-x-2">
                      <div key="pulse-1" className="h-2 w-2 bg-zinc-600 rounded-full"></div>
                      <div key="pulse-2" className="h-2 w-2 bg-zinc-600 rounded-full"></div>
                      <div key="pulse-3" className="h-2 w-2 bg-zinc-600 rounded-full"></div>
                    </div>
                  </div>
                ) : tenants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-zinc-500 px-4 text-center">
                    <p>No messages</p>
                    <p className="text-sm mt-2">You have no message inquiries for this property yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/50">
                    {tenants.map((tenant) => (
                      <TenantListItem
                        key={tenant.id}
                        tenant={tenant}
                        isSelected={selectedTenant === tenant.id}
                        onSelect={handleTenantSelect}
                        onDelete={(tenantId) => confirmDeleteChat(tenantId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Mobile chat view */
              <div className="flex flex-col h-full">
                {/* Mobile chat header with back button */}
                <div className="border-b border-white p-2 flex items-center bg-black">
                  

                  <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    onClick={() => setSelectedTenant(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                    <Avatar className="h-8 w-8 mr-2 border border-white">
                      <AvatarImage src={selectedTenant.avatar} alt={selectedTenant.name} />
                      <AvatarFallback className="bg-black text-zinc-300">
                        {selectedTenant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm text-white">{selectedTenant.name}</div>
                      <p className="text-xs text-zinc-400">Inquiring about {property?.name || "your property"}</p>
                      
                    </div>
                    
                  </div>
                  <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 bg-black text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-full",
              refreshStatus === "updated" && "text-green-400",
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
                

                {/* Mobile chat messages */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-3 bg-black"
                >
                  {renderChatMessages()}
                </div>

                {/* Mobile message input */}
                <div className="border-t border-zinc-800 p-2 flex gap-2 h-[60px] min-h-[60px]">
                  <Textarea
                    ref={messageInputRef}
                    placeholder="Type your message here... (Shift+Enter for new line)"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-h-[40px] max-h-[100px] resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-zinc-800 disabled:text-zinc-500"
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop chat area */}
          <div className="hidden sm:flex flex-col flex-1 h-full bg-black">
            {/* Chat header */}
            <div className="border-b border-zinc-800 justify-between p-2 flex items-center h-[50px] min-h-[50px]">
              {selectedTenant ? (
                <div className="flex  items-center">
                  <Avatar className="h-8 w-8 mr-2 border border-zinc-700 bg-orange-500">
                    <AvatarImage src={selectedTenant.avatar} alt={selectedTenant.name} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-300">
                      {selectedTenant.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="">
                    <div className="font-medium text-sm text-white">{selectedTenant.name}</div>
                    <p className="text-xs text-zinc-400">Inquiring about {property?.name || "your property"}</p>
                  </div>
                  
                </div>
              ) : (
                <div className="font-medium text-sm text-zinc-300"></div>
              )}
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 px-2 bg-black border-white text-zinc-300 hover:bg-zinc-700 hover:text-white",
                  refreshStatus === "updated" && "text-green-400 border-green-800 bg-green-900/20",
                )}
                onClick={refreshAll}
                disabled={isRefreshing}
              >
                {refreshStatusInfo.icon}
                <span className="text-xs">{refreshStatusInfo.text}</span>
              </Button>
            </div>

            {/* Messages area - fixed height with scrolling */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-3"
            >
              {renderChatMessages()}
            </div>

            {/* Message input - fixed height */}
            <div className="border-t border-zinc-800 p-2 flex gap-2 h-[60px] min-h-[60px]">
              <Textarea
                ref={messageInputRef}
                placeholder={selectedTenant ? "Type your message here... (Shift+Enter for new line)" : "Select a tenant to message"}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!selectedTenant}
                className="flex-1 min-h-[40px] max-h-[40px] resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!messageText.trim() || !selectedTenant}
                className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Confirmation dialog for deleting a conversation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Conversation</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will archive this conversation. It can be restored from the archived conversations section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat} className="bg-red-600 hover:bg-red-700 text-white">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

function toast({ title, description, variant }: { 
  title: string; 
  description: string; 
  variant: "default" | "destructive" | string 
}): void {
  console.log(`[${variant.toUpperCase()}] ${title}: ${description}`);
}