
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications, markNotificationsAsRead } from '@/services/notificationService';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { ScrollArea } from './ui/scroll-area';

export function Notifications({ userId }: { userId: string }) {
  const { notifications, unreadCount, loading } = useNotifications(userId);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length > 0) {
      await markNotificationsAsRead(userId, unreadIds);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && unreadCount > 0) {
      // Mark as read when the dropdown is closed
      handleMarkAllAsRead();
    }
    setIsOpen(open);
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">{unreadCount}</Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
           {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleMarkAllAsRead}>
                <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all as read
              </Button>
            )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-96">
            {loading ? (
                <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
            ) : notifications.length > 0 ? (
            notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} asChild className={`flex flex-col items-start gap-1 p-3 whitespace-normal ${!notification.isRead ? 'bg-secondary' : ''}`}>
                    <Link href={notification.link || '#'}>
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                        </p>
                    </Link>
                </DropdownMenuItem>
            ))
            ) : (
            <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
            )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
