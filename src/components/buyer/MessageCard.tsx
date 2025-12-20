import { cn } from '@/lib/utils';
import { BuyerMessage, MessageCategory } from '@/hooks/useBuyerMessages';
import { 
  Newspaper, 
  Gavel, 
  Home, 
  Calendar, 
  MessageSquare, 
  Star,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface MessageCardProps {
  message: BuyerMessage;
  onClick: () => void;
  onMarkRead: () => void;
  onToggleStar: () => void;
}

const categoryConfig: Record<MessageCategory, { icon: typeof Newspaper; label: string; color: string }> = {
  newsletter: { icon: Newspaper, label: 'Newsletter', color: 'text-blue-500 bg-blue-500/10' },
  auction: { icon: Gavel, label: 'Auction', color: 'text-orange-500 bg-orange-500/10' },
  pre_market: { icon: Home, label: 'Pre-Market', color: 'text-emerald-500 bg-emerald-500/10' },
  inspection: { icon: Calendar, label: 'Inspection', color: 'text-purple-500 bg-purple-500/10' },
  message: { icon: MessageSquare, label: 'Message', color: 'text-pink-500 bg-pink-500/10' },
};

export function MessageCard({ message, onClick, onMarkRead, onToggleStar }: MessageCardProps) {
  const config = categoryConfig[message.category] || categoryConfig.message;
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

  return (
    <div
      className={cn(
        "group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer",
        message.read
          ? "bg-card border-border hover:border-accent/50"
          : "bg-accent/5 border-accent/20 hover:border-accent/50 shadow-sm"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Category Icon */}
        <div className={cn("p-2 rounded-lg shrink-0", config.color)}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              config.color
            )}>
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
          </div>

          <h4 className={cn(
            "text-sm mb-1 line-clamp-1",
            message.read ? "font-medium text-foreground" : "font-semibold text-foreground"
          )}>
            {message.subject}
          </h4>

          <p className="text-xs text-muted-foreground line-clamp-2">
            {message.content}
          </p>

          {message.agent && (
            <p className="text-xs text-muted-foreground mt-1.5">
              From: {message.agent.agency_name || 'Agent'}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar();
            }}
          >
            <Star className={cn(
              "w-4 h-4",
              message.starred ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
            )} />
          </Button>
          {!message.read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead();
              }}
            >
              <Check className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Unread indicator */}
      {!message.read && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent" />
      )}
    </div>
  );
}
