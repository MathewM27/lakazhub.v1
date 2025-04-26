"use client"

import type React from "react"
import { Conversation } from "../../types/index";  
import { v4 as uuidv4 } from 'uuid';

import { useState, useEffect, useRef, useCallback } from "react"
import {  RefreshCw, Check,  } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"


import { supabase } from "../../lib/utils/supabase/client"
import { useToast } from "../../hooks/use-toast"
import { format, formatDistanceToNow } from "date-fns"

import type { User } from '@supabase/supabase-js';
import TenantList from "./message-component/TenantList";
import ChatHeader from "./message-component/ChatHeader";
import ChatMessages from "./message-component/ChatMessages";
import MessageInput from "./message-component/MessageInput";
import DeleteDialog from "./message-component/DeleteDialog";

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
    [key: string]: unknown;
  }
  initialConversationId?: string
}
interface ConversationPayload {
  new: Conversation;
  old: Conversation;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null)
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState<"idle" | "refreshing" | "updated">("idle")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState<string | null>(null)
  const [isCacheStale, setIsCacheStale] = useState(false)
  
  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
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
    } catch {
      return "Unknown"
    }
  }, [])

  // Helper function to convert database messages to UI messages
  const formatMessagesForUI = useCallback((messages: Message[]): UIMessage[] => {
    return messages.map((msg) => ({
      id: msg.id,
      sender: msg.sender_id === user?.id ? "landlord" as const : "tenant" as const,
      text: msg.message,
      time: formatMessageTime(msg.created_at),
      is_read: msg.is_read
    }));
  }, [user?.id, formatMessageTime]);

  // Function to fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string, page = 0, pageSize = 20): Promise<UIMessage[]> => {
    if (!user?.id) {
      return [];
    }
    
    try {
      
      // Check cache first
      if (property?.id) {
        const cacheKey = `property_${property.id}_user_${user.id}`;
        const cachedData = messagesCache.get(cacheKey);
        
        if (cachedData?.messages?.[conversationId]) {
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
        
        const { data: convData, error: convError } = await supabase
          .from('property_conversations')
          .select('messages')
          .eq('id', conversationId)
          .single();
          
        if (convError) {
          throw new Error(`Failed to fetch messages: ${convError.message || 'Unknown error'}`);
        }
        
        if (!convData || !convData.messages || !Array.isArray(convData.messages)) {
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
      
      // Format the messages for UI display
      return formatMessagesForUI(data);
    } catch {
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
    } catch {
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
      if (isNearTop && selectedTenant?.hasMoreMessages) {
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
  }, [selectedTenant?.hasMoreMessages, loadMoreMessages]);

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
        'postgres_changes' as any, // leave as-is if no better type is available
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
      return;
    }

    setLoading(true);

    try {
      let conversationsData;
      
      if (property?.id) {
        const { data, error } = await supabase.rpc("get_user_conversations_by_property", {
          property_id_param: property.id
        });
        
        if (error) {
          
          const { data: directData, error: directError } = await supabase
            .from("property_conversations")
            .select("*")
            .eq("property_id", property.id);
            
          if (directError) {
            throw new Error(`Error fetching property conversations: ${error.message || "Unknown error"}`);
          }
          
          conversationsData = directData;
        } else {
          conversationsData = data;
        }
      } else {
        const { data, error } = await supabase.rpc("get_user_conversations");
        
        if (error) {
          
          const { data: directData, error: directError } = await supabase
            .from("property_conversations")
            .select("*");
            
          if (directError) {
            throw new Error(`Error fetching all conversations: ${error.message || "Unknown error"}`);
          }
          
          conversationsData = directData;
        } else {
          conversationsData = data;
        }
      }

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
    } catch {
      const errorMessage = "Unknown error";
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
    } catch {
      const errorMessage = "Unknown error";
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
        
        // Try fallback approach: directly update the conversation's messages array
        
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
    } catch {
      const errorMessage = "Unknown error";
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
    } catch {
      const errorMessage = "Unknown error";
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
      return;
    }
    
    try {
      
      // Skip checking for RPC functions since we know it's failing
      
      // Update the conversation directly in the database
      const { error: updateError } = await supabase
        .from('property_conversations')
        .update({ landlord_unread_count: 0 })
        .eq('id', conversationId);
        
      if (updateError) {
        return;
      }
      
      
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
      
    } catch {
    }
  }, [user?.id, property?.id, formatMessageTime, formatMessagesForUI, toast]);

  // When modal is opened with initialConversationId, mark those messages as read
  useEffect(() => {
    if (open && user?.id) {
      
      // If initialConversationId is provided, mark that conversation as read immediately
      if (initialConversationId) {
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
      <DialogContent
        className="p-0 max-w-[800px] h-[600px] max-h-[90vh] overflow-hidden flex flex-col 
        bg-black border border-zinc-800 text-zinc-100 
        rounded-2xl shadow-2xl backdrop-blur-md"
        style={{
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.45)",
          borderRadius: "1.25rem",
          border: "1px solid #27272a",
          background: "rgba(10,10,10,0.97)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Only one header: LakazHub Messenger centered */}
        <div className="bg-zinc-950 border-b border-white p-3 flex items-center justify-center rounded-t-2xl shadow-md">
          <span className="font-bold text-white text-base sm:text-lg">LakazHub Messenger</span>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-full sm:w-1/3 md:w-1/4 border-r hidden sm:flex flex-col h-full bg-black">
            <TenantList
              tenants={tenants}
              loading={loading}
              selectedTenant={selectedTenant}
              onSelect={handleTenantSelect}
              onDelete={confirmDeleteChat}
            />
          </div>

          {/* Mobile view */}
          <div className="sm:hidden w-full flex flex-col h-full bg-black">
            {/* Always show conversation list first on mobile */}
            {!selectedTenant ? (
              <TenantList
                tenants={tenants}
                loading={loading}
                selectedTenant={selectedTenant}
                onSelect={handleTenantSelect}
                onDelete={confirmDeleteChat}
                mobile
                refreshAll={refreshAll}
                refreshStatusInfo={refreshStatusInfo}
                isRefreshing={isRefreshing}
              />
            ) : (
              <div className="flex flex-col h-full">
                {/* Conversation header (back button, etc) */}
                <ChatHeader
                  selectedTenant={selectedTenant}
                  property={property}
                  onBack={() => setSelectedTenant(null)}
                  refreshAll={refreshAll}
                  refreshStatus={refreshStatus}
                  isRefreshing={isRefreshing}
                  mobile
                />
                <ChatMessages
                  loading={loading}
                  selectedTenant={selectedTenant}
                  messagesContainerRef={messagesContainerRef}
                  messagesEndRef={messagesEndRef}
                  loadMoreMessages={loadMoreMessages}
                  userHasScrolledUp={userHasScrolledUp}
                />
                {/* Message input always docked at bottom */}
                <MessageInput
                  messageText={messageText}
                  setMessageText={setMessageText}
                  handleSendMessage={handleSendMessage}
                  handleKeyDown={handleKeyDown}
                  disabled={!selectedTenant}
                  ref={messageInputRef}
                  mobile
                />
              </div>
            )}
          </div>

          {/* Desktop chat area */}
          <div className="hidden sm:flex flex-col flex-1 h-full bg-black min-w-[340px] max-w-[540px] mx-auto">
            {/* Desktop conversation header with refresh button */}
            {selectedTenant && (
              <ChatHeader
                selectedTenant={selectedTenant}
                property={property}
                refreshAll={refreshAll}
                refreshStatus={refreshStatus}
                isRefreshing={isRefreshing}
                mobile={false}
              />
            )}
            <div className="flex flex-col flex-1 min-h-0">
              <ChatMessages
                loading={loading}
                selectedTenant={selectedTenant}
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
                loadMoreMessages={loadMoreMessages}
                userHasScrolledUp={userHasScrolledUp}
                noGradient
              />
              {/* Message input always docked at bottom, even if no messages */}
              <MessageInput
                messageText={messageText}
                setMessageText={setMessageText}
                handleSendMessage={handleSendMessage}
                handleKeyDown={handleKeyDown}
                disabled={!selectedTenant}
                ref={messageInputRef}
                mobile={false}
              />
            </div>
          </div>
        </div>
      </DialogContent>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteChat}
      />
    </Dialog>
  )
}

function toast({ title, description, variant }: { 
  title: string; 
  description: string; 
  variant: "default" | "destructive" | string 
}): void {
  //console.log(`[${variant.toUpperCase()}] ${title}: ${description}`);
}