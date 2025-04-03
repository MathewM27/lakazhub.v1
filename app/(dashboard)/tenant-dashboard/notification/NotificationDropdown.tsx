"use client"

import { Bell } from "lucide-react"
import { DropdownMenu, DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"

// Mock notification data
const NOTIFICATIONS = [
  {
    id: 1,
    title: "New Message",
    description: "You have a new message from your landlord",
    time: "2 minutes ago",
    unread: true,
  },
  {
    id: 2,
    title: "Rent Due",
    description: "Your rent payment is due in 3 days",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 3,
    title: "Maintenance Update",
    description: "Your maintenance request has been completed",
    time: "2 hours ago",
    unread: false,
  },
  {
    id: 4,
    title: "New Property Alert",
    description: "A new property matching your criteria is available",
    time: "1 day ago",
    unread: false,
  }
]

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const unreadCount = notifications.filter(n => n.unread).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, unread: false } : notification
    ))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Notifications</p>
            <p className="text-xs text-muted-foreground">
              You have {unreadCount} unread messages
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="cursor-pointer">
              <div
                className="flex flex-col space-y-1 w-full"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex justify-between items-center">
                  <p className={`text-sm font-medium ${notification.unread ? 'text-black' : 'text-gray-500'}`}>
                    {notification.title}
                  </p>
                  <span className="text-xs text-gray-400">{notification.time}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {notification.description}
                </p>
                {notification.unread && (
                  <span className="h-2 w-2 rounded-full bg-red-500 absolute right-2 top-2" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-center">
          <Button variant="ghost" className="w-full text-xs">
            View all notifications
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}