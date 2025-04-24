'use client';

import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import Link from "next/link";
import { 
    Home, 
    MessageCircle, 
    Bell, 
    User,
    Menu,
    ChevronRight,
    LogOut,
    X,
    Loader2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/utils/lib/utils";
import { cva } from "class-variance-authority";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import { supabase } from "../../utils/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useAuth } from "../../auth/AuthHandler";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

// Replace static import with dynamic import
const ProfileModal = dynamic(() => import("../user/ProfileModal"), { ssr: false });

// Create a custom SheetContent component that properly handles children
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

type SheetContentProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
};

const SheetContent = forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
));

SheetContent.displayName = "SheetContent";

const NOTIFICATIONS: Array<{ id: number; title: string; description: string; time: string; unread: boolean }> = [];

const Navigation = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    
    // Get user from AuthContext instead of local state
    const { user, profile, isAuthenticated } = useAuth();
    
    // Ref for controlling sheet open/close state
    const sheetOpenRef = useRef(false);
    const sheetTriggerRef = useRef<HTMLButtonElement>(null);

    // Create refs for the modal content elements
    const notificationsModalRef = useRef<HTMLDivElement>(null);

    // Function to close the sheet programmatically
    const closeSheet = () => {
        if (sheetOpenRef.current && sheetTriggerRef.current) {
            sheetTriggerRef.current.click();
            sheetOpenRef.current = false;
        }
    };

    // Add click outside handler for modals
    const handleClickOutside = useCallback((event: MouseEvent) => {
        // For Notifications Modal
        if (isNotificationsModalOpen && 
            notificationsModalRef.current && 
            !notificationsModalRef.current.contains(event.target as Node)) {
            setIsNotificationsModalOpen(false);
        }
    }, [isNotificationsModalOpen]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Setup click outside event listener
    useEffect(() => {
        // Only add the listener if notifications modal is open
        if (isNotificationsModalOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        // Clean up the listener when component unmounts or modal closes
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotificationsModalOpen, handleClickOutside]);

    // Fetch unread messages count
    useEffect(() => {
        if (!user?.id) return;

        const fetchUnreadMessagesCount = async () => {
            try {
                // Get all conversations for the current tenant with unread count
                const { data: conversationsData, error: conversationsError } = await supabase
                    .from('property_conversations')
                    .select('tenant_unread_count')
                    .eq('tenant_id', user.id);
                    
                if (conversationsError) throw conversationsError;
                
                if (!conversationsData || conversationsData.length === 0) {
                    setUnreadMessagesCount(0);
                    return;
                }
                
                // Sum up all tenant_unread_count values
                const totalUnreadCount = conversationsData.reduce(
                    (total: number, conv: { tenant_unread_count: number | null }) => total + (conv.tenant_unread_count || 0), 
                    0
                );
                
                setUnreadMessagesCount(totalUnreadCount);
            } catch (error) {
                // console.error('Error fetching unread messages count:', error);
            }
        };
        
        fetchUnreadMessagesCount();
        
        // Subscribe to conversation updates
        const conversationsSubscription = supabase
            .channel('property-conversations-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'property_conversations',
                    filter: `tenant_id=eq.${user.id}`
                },
                () => {
                    fetchUnreadMessagesCount();
                }
            )
            .subscribe();
            
        return () => {
            supabase.removeChannel(conversationsSubscription);
        };
    }, [user?.id]);

    const handleMessageLinkClick = async () => {
        setIsNavigating(true);
        // Show spinner immediately
        startTransition(() => {
            // Mark messages as read in the background
            if (unreadMessagesCount > 0 && user?.id) {
                supabase.rpc('mark_tenant_conversations_read', {
                    tenant_id: user.id
                }).then(() => {
                    setUnreadMessagesCount(0);
                });
            }
            router.push('/tenant-dashboard/chat');
        });
        // Keep spinner for minimal time for better UX
        setTimeout(() => {
            setIsNavigating(false);
        }, 1000); // You can adjust this duration
    };

    const handleNotificationsClick = () => {
        // Close the sheet if on mobile
        closeSheet();
        // Open notifications modal instead of dropdown on mobile
        setIsNotificationsModalOpen(true);
    };
    
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            // Clear all PKCE/session storage and Supabase cookies
            if (typeof window !== "undefined") {
                sessionStorage.clear();
                localStorage.clear();
                document.cookie.split(";").forEach(cookie => {
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                });
            }
            window.location.href = process.env.NEXT_PUBLIC_SITE_URL || 'https://lakazhub.com';
        } catch (err) {
            // console.error('Error logging out:', err);
        }
    };

    const handleProfileClick = () => {
        // Close the sheet if on mobile
        closeSheet();
        setIsProfileModalOpen(true);
    };

    return (
        <>
            <nav 
                className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
                    isScrolled 
                        ? "bg-black/90 backdrop-blur-md shadow-md border-b border-white/10" 
                        : "bg-transparent border-b border-white/20"
                }`}
                style={{ minHeight: 56 }} // Pre-allocate nav height (e.g., 56px)
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center">
                        {/* Mobile menu button on left */}
                        <div className="md:hidden mr-3">
                            <Sheet onOpenChange={(open: boolean) => { sheetOpenRef.current = open; }}>
                                <SheetTrigger asChild>
                                    <Button 
                                        ref={sheetTriggerRef}
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-white hover:bg-white/10"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent 
                                    side="top" 
                                    className="w-full bg-black/95 backdrop-blur-xl border-b border-white/20 text-white pt-16"
                                >
                                    {/* Content starts here */}
                                    <SheetHeader className="border-b border-white/10 pb-4 mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div 
                                                className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center cursor-pointer"
                                                onClick={handleProfileClick}
                                            >
                                                <User className="h-4 w-4 text-white" />
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-white/70 hover:text-white hover:bg-white/10"
                                                onClick={handleLogout}
                                            >
                                                <LogOut className="h-4 w-4 mr-1" />
                                                Logout
                                            </Button>
                                        </div>
                                        <SheetTitle className="text-white">Menu</SheetTitle>
                                    </SheetHeader>
                                    <ScrollArea className="h-[40vh]">
                                        <nav className="flex flex-col space-y-1">
                                            <Link 
                                                href="/tenant-dashboard" 
                                                className="flex items-center justify-between px-2 py-3 hover:bg-white/10 rounded-md transition-all duration-200"
                                                onClick={closeSheet}
                                            >
                                                <div className="flex items-center">
                                                    <Home className="mr-3 h-5 w-5 text-white/70" />
                                                    <span>Home</span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-white/50" />
                                            </Link>
                                            <button 
                                                onClick={handleMessageLinkClick}
                                                disabled={isNavigating}
                                                className="flex items-center justify-between px-2 py-3 hover:bg-white/10 rounded-md transition-all duration-200 w-full text-left"
                                            >
                                                <div className="flex items-center">
                                                    {isNavigating ? (
                                                        <Loader2 className="mr-3 h-5 w-5 text-white/70 animate-spin" />
                                                    ) : (
                                                        <MessageCircle className="mr-3 h-5 w-5 text-white/70" />
                                                    )}
                                                    <span>{isNavigating ? "Loading..." : "Messages"}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    {unreadMessagesCount > 0 && !isNavigating && (
                                                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                                                    )}
                                                    <ChevronRight className="h-4 w-4 text-white/50" />
                                                </div>
                                            </button>
                                            <button
                                                onClick={handleNotificationsClick}
                                                className="flex items-center justify-between px-2 py-3 hover:bg-white/10 rounded-md transition-all duration-200 w-full text-left"
                                            >
                                                <div className="flex items-center">
                                                    <Bell className="mr-3 h-5 w-5 text-white/70" />
                                                    <span>Notifications</span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-white/50" />
                                            </button>
                                        </nav>
                                    </ScrollArea>
                                </SheetContent>
                            </Sheet>
                        </div>
                        
                        <Link href="/" className="group flex items-center">
                            <span className="text-2xl font-bold tracking-tight transition-colors text-white">
                                Lakaz<span className="opacity-70">Hub</span>
                            </span>
                            <div 
                                className="h-1 w-0 bg-white/30 group-hover:w-full group-hover:bg-white/50 transition-all duration-700 ml-1 mt-1 rounded-full"
                                style={{ width: '100%' }}
                            />
                        </Link>
                    </div>

                    {/* Desktop navigation */}
                    <div className="hidden items-center space-x-1 md:flex">
                        <Link 
                            href="/tenant-dashboard" 
                            className="px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-300 text-white/90 hover:text-black hover:bg-white"
                        >
                            <Home className="mr-2 h-4 w-4" />
                            <span>Home</span>
                        </Link>

                        {/* Optimize message button with prefetch */}
                        <Link 
                            href="/tenant-dashboard/chat"
                            prefetch={true}
                            onClick={(e) => {
                                e.preventDefault();
                                handleMessageLinkClick();
                            }}
                            className="px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-300 text-white/90 hover:text-black hover:bg-white relative cursor-pointer"
                        >
                            {isNavigating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <MessageCircle className="mr-2 h-4 w-4" />
                            )}
                            <span>{isNavigating ? "Loading..." : "Messages"}</span>
                            {unreadMessagesCount > 0 && !isNavigating && (
                                <div className="absolute top-1 right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                        </Link>

                        {/* Notifications Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    className="relative flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 text-white/90 hover:text-black hover:bg-white"
                                >
                                    <Bell className="mr-2 h-4 w-4" />
                                    <span>Notifications</span>
                                    {NOTIFICATIONS.length > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-white text-xs text-black flex items-center justify-center font-bold">
                                            {NOTIFICATIONS.length}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                                align="end" 
                                className="w-80 bg-black/95 backdrop-blur-md border border-white/20 text-white rounded-xl shadow-xl"
                            >
                                <DropdownMenuLabel className="font-normal border-b border-white/10 bg-black/80">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium text-white">Notifications</p>
                                        <p className="text-xs text-white/60">
                                            {NOTIFICATIONS.length > 0 
                                                ? `You have ${NOTIFICATIONS.length} unread notifications` 
                                                : "No notifications"}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                
                                <ScrollArea className="h-[300px]">
                                    {NOTIFICATIONS.length > 0 ? (
                                        NOTIFICATIONS.map((notification) => (
                                            <DropdownMenuItem 
                                                key={notification.id} 
                                                className={`cursor-pointer px-4 py-3 hover:bg-white/5 border-b border-white/5 ${notification.unread ? 'bg-white/5' : ''}`}
                                            >
                                                <div className="flex flex-col space-y-1 w-full">
                                                    <div className="flex justify-between items-center">
                                                        <p className={`text-sm font-medium ${notification.unread ? 'text-white' : 'text-white/70'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <span className="text-xs text-white/50">{notification.time}</span>
                                                    </div>
                                                    <p className={`text-xs ${notification.unread ? 'text-white/80' : 'text-white/50'} line-clamp-2`}>
                                                        {notification.description}
                                                    </p>
                                                </div>
                                            </DropdownMenuItem>
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-white/50 text-sm">
                                            No notifications
                                        </div>
                                    )}
                                </ScrollArea>
                                
                                {NOTIFICATIONS.length > 0 && (
                                    <div className="p-2 border-t border-white/10">
                                        <Button 
                                            variant="ghost" 
                                            className="w-full text-xs text-white/80 hover:text-white hover:bg-white/10"
                                        >
                                            View all notifications
                                        </Button>
                                    </div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* User avatar dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <User className="h-4 w-4 text-white" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                            align="end" 
                            className="w-56 bg-black/95 backdrop-blur-md border border-white/20 text-white rounded-xl shadow-xl"
                        >
                            <div className="px-4 py-3 border-b border-white/10">
                                <p className="text-sm font-medium">My Account</p>
                                <p className="text-xs text-white/60 truncate mt-1">
                                    {user?.email || 'Sign in to access your account'}
                                </p>
                            </div>
                            <DropdownMenuItem 
                                onClick={() => setIsProfileModalOpen(true)}
                                className="text-white hover:text-black hover:bg-white focus:text-black focus:bg-white cursor-pointer px-4 py-2.5 transition-all duration-200"
                            >
                                Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="text-white hover:text-black hover:bg-white focus:text-black focus:bg-white cursor-pointer px-4 py-2.5 transition-all duration-200"
                            >
                                FAQ & Help
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem 
                                className="text-white/80 hover:text-black hover:bg-white focus:text-black focus:bg-white cursor-pointer px-4 py-2.5 transition-all duration-200" 
                                onClick={handleLogout}
                            >
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </nav>
            
            {/* Profile Modal */}
            <ProfileModal 
                user={user}
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
            
            {/* Notifications Modal for Mobile - Updated with ref */}
            {isNotificationsModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center min-h-screen">
                    <div 
                        ref={notificationsModalRef}
                        className="bg-black/95 border border-white/20 rounded-xl w-[90%] max-w-md max-h-[80vh] overflow-auto min-h-[300px]"
                    >
                        <div className="p-4 border-b border-white/10">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-white">Notifications</h3>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-white/70 hover:text-white hover:bg-white/10"
                                    onClick={() => setIsNotificationsModalOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-4">
                            {NOTIFICATIONS.length > 0 ? (
                                <div className="space-y-2">
                                    {NOTIFICATIONS.map((notification) => (
                                        <div key={notification.id} className="border-b border-white/10 pb-2 last:border-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-medium text-white">{notification.title}</p>
                                                <span className="text-xs text-white/50">{notification.time}</span>
                                            </div>
                                            <p className="text-xs text-white/70 mt-1">{notification.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-white/50">
                                    <p>No notifications</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add full-screen loading overlay during navigation */}
            {(isNavigating || isPending) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-4 border-white/30 border-t-white rounded-full mb-2"></div>
                    <div className="text-white font-medium">Loading messages...</div>
                </div>
            )}
        </>
    );
};

export default Navigation;