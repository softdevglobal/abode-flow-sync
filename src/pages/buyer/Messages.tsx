import { useState } from 'react';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { useBuyerMessages, MessageCategory, BuyerMessage } from '@/hooks/useBuyerMessages';
import { MessageCard } from '@/components/buyer/MessageCard';
import { MessageDetailSheet } from '@/components/buyer/MessageDetailSheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Mail, 
  MailOpen,
  Newspaper, 
  Gavel, 
  Home, 
  Calendar, 
  MessageSquare,
  Inbox
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CategoryTab = 'all' | MessageCategory;

const tabs: { id: CategoryTab; label: string; icon: typeof Mail }[] = [
  { id: 'all', label: 'All', icon: Mail },
  { id: 'newsletter', label: 'Newsletters', icon: Newspaper },
  { id: 'auction', label: 'Auctions', icon: Gavel },
  { id: 'pre_market', label: 'Pre-Market', icon: Home },
  { id: 'inspection', label: 'Inspections', icon: Calendar },
  { id: 'message', label: 'Messages', icon: MessageSquare },
];

export default function BuyerMessages() {
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<BuyerMessage | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { 
    messages, 
    isLoading, 
    unreadCounts, 
    markAsRead, 
    markAllAsRead, 
    toggleStarred 
  } = useBuyerMessages(activeTab, unreadOnly);

  const handleMessageClick = (message: BuyerMessage) => {
    setSelectedMessage(message);
    setSheetOpen(true);
    if (!message.read) {
      markAsRead(message.id);
    }
  };

  const handleToggleStar = (message: BuyerMessage) => {
    toggleStarred({ messageId: message.id, starred: !message.starred });
  };

  const getTabCount = (tabId: CategoryTab) => {
    if (tabId === 'all') return unreadCounts.all;
    return unreadCounts[tabId] || 0;
  };

  return (
    <BuyerLayout>
      <div className="px-4 py-4 pb-24 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent/10">
              <Mail className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">Messages</h1>
              <p className="text-xs text-muted-foreground">
                {unreadCounts.all > 0 ? `${unreadCounts.all} unread` : 'All caught up!'}
              </p>
            </div>
          </div>

          {unreadCounts.all > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs px-2"
              onClick={() => markAllAsRead(activeTab === 'all' ? undefined : activeTab as MessageCategory)}
            >
              <MailOpen className="w-3.5 h-3.5 mr-1" />
              Mark Read
            </Button>
          )}
        </div>

        {/* Category Tabs - Horizontal Scroll */}
        <div className="flex gap-2 pb-3 border-b border-border overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const count = getTabCount(tab.id);
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold rounded-full",
                    isActive 
                      ? "bg-accent-foreground/20 text-accent-foreground" 
                      : "bg-accent text-accent-foreground"
                  )}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Unread Filter */}
        <div className="flex items-center gap-2">
          <Switch
            id="unread-only"
            checked={unreadOnly}
            onCheckedChange={setUnreadOnly}
          />
          <Label htmlFor="unread-only" className="text-xs text-muted-foreground cursor-pointer">
            Unread only
          </Label>
        </div>

        {/* Messages List */}
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </div>
            ))
          ) : messages.length === 0 ? (
            // Empty state
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Inbox className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No messages</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {unreadOnly 
                  ? "You've read all your messages. Toggle off the filter to see all." 
                  : "You don't have any messages yet. Check back later!"}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onClick={() => handleMessageClick(message)}
                onMarkRead={() => markAsRead(message.id)}
                onToggleStar={() => handleToggleStar(message)}
              />
            ))
          )}
        </div>
      </div>

      {/* Message Detail Sheet */}
      <MessageDetailSheet
        message={selectedMessage}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onToggleStar={() => {
          if (selectedMessage) {
            handleToggleStar(selectedMessage);
            setSelectedMessage({ ...selectedMessage, starred: !selectedMessage.starred });
          }
        }}
      />
    </BuyerLayout>
  );
}
