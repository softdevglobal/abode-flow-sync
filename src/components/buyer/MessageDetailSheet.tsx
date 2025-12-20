import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BuyerMessage, MessageCategory } from '@/hooks/useBuyerMessages';
import { 
  Newspaper, 
  Gavel, 
  Home, 
  Calendar, 
  MessageSquare, 
  Star,
  ExternalLink,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface MessageDetailSheetProps {
  message: BuyerMessage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleStar: () => void;
}

const categoryConfig: Record<MessageCategory, { icon: typeof Newspaper; label: string; color: string }> = {
  newsletter: { icon: Newspaper, label: 'Newsletter', color: 'text-blue-500 bg-blue-500/10' },
  auction: { icon: Gavel, label: 'Auction Update', color: 'text-orange-500 bg-orange-500/10' },
  pre_market: { icon: Home, label: 'Pre-Market Update', color: 'text-emerald-500 bg-emerald-500/10' },
  inspection: { icon: Calendar, label: 'Inspection', color: 'text-purple-500 bg-purple-500/10' },
  message: { icon: MessageSquare, label: 'Agent Message', color: 'text-pink-500 bg-pink-500/10' },
};

export function MessageDetailSheet({ message, open, onOpenChange, onToggleStar }: MessageDetailSheetProps) {
  if (!message) return null;

  const config = categoryConfig[message.category] || categoryConfig.message;
  const Icon = config.icon;
  const formattedDate = format(new Date(message.created_at), 'PPP \'at\' p');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium", config.color)}>
              <Icon className="w-4 h-4" />
              {config.label}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleStar}
              >
                <Star className={cn(
                  "w-4 h-4",
                  message.starred ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                )} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <SheetTitle className="text-xl font-display mb-2">{message.subject}</SheetTitle>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
        </SheetHeader>

        {/* Agent Info */}
        {message.agent && (
          <div className="flex items-center gap-3 mt-6 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10">
              <AvatarImage src={message.agent.profile_image || undefined} />
              <AvatarFallback className="bg-accent/20 text-accent">
                {message.agent.agency_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{message.agent.agency_name || 'Agent'}</p>
              <p className="text-xs text-muted-foreground">Real Estate Agent</p>
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className="mt-6 prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {message.content}
          </div>
        </div>

        {/* Related Links */}
        {(message.property_id || message.appraisal_id || message.auction_id) && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Related</p>
            <div className="flex flex-wrap gap-2">
              {message.property_id && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/property/${message.property_id}`}>
                    <Home className="w-4 h-4 mr-2" />
                    View Property
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Link>
                </Button>
              )}
              {message.auction_id && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/auction/live/${message.auction_id}`}>
                    <Gavel className="w-4 h-4 mr-2" />
                    View Auction
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Link>
                </Button>
              )}
              {message.appraisal_id && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/pre-market">
                    <Home className="w-4 h-4 mr-2" />
                    View Pre-Market
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
