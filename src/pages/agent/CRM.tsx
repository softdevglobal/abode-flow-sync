import { useState } from 'react';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Search,
  Users,
  Calendar,
  Eye,
  Gavel,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Plus,
  Trash2,
  Loader2,
  User,
  Home,
  FileText,
} from 'lucide-react';
import { useAgentCRM, useCustomerDetails, CRMCustomer, CRMNote } from '@/hooks/useAgentCRM';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const NOTE_TYPE_CONFIG = {
  call: { label: 'Call', icon: Phone, color: 'bg-blue-500' },
  email: { label: 'Email', icon: Mail, color: 'bg-green-500' },
  meeting: { label: 'Meeting', icon: Users, color: 'bg-purple-500' },
  follow_up: { label: 'Follow Up', icon: Clock, color: 'bg-orange-500' },
  general: { label: 'General', icon: FileText, color: 'bg-gray-500' },
};

export default function CRM() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CRMCustomer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Get agent ID
  const { data: agentData } = useQuery({
    queryKey: ['agent-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // For prototype, use hardcoded agent ID if not logged in
  const agentId = agentData?.id || 'da39b948-790b-4a66-94b4-394445a98062';

  const { customers, customersLoading } = useAgentCRM(agentId);

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    );
  });

  const handleCustomerClick = (customer: CRMCustomer) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  const getInitials = (customer: CRMCustomer) => {
    const first = customer.first_name?.[0] || '';
    const last = customer.last_name?.[0] || '';
    return (first + last).toUpperCase() || customer.email[0].toUpperCase();
  };

  const getTotalInteractions = (customer: CRMCustomer) => {
    return customer.inspection_count + customer.viewing_count + customer.bid_count;
  };

  return (
    <AgentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Customer CRM</h1>
            <p className="text-muted-foreground">
              Manage customer relationships and track interactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              <Users className="w-4 h-4 mr-1" />
              {customers.length} Customers
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customer List */}
        {customersLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No customers yet</h3>
              <p className="text-muted-foreground">
                Customers will appear here when they interact with your properties
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleCustomerClick(customer)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={customer.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(customer)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {customer.first_name || customer.last_name
                          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                          : 'Unknown'}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                      {customer.phone && (
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {customer.inspection_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {customer.inspection_count} Inspections
                      </Badge>
                    )}
                    {customer.viewing_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        {customer.viewing_count} Viewings
                      </Badge>
                    )}
                    {customer.bid_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Gavel className="w-3 h-3 mr-1" />
                        {customer.bid_count} Bids
                      </Badge>
                    )}
                  </div>

                  {customer.last_interaction && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Last interaction: {formatDistanceToNow(new Date(customer.last_interaction), { addSuffix: true })}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Customer Detail Sheet */}
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selectedCustomer && (
              <CustomerDetailPanel
                customer={selectedCustomer}
                agentId={agentId}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AgentLayout>
  );
}

function CustomerDetailPanel({ 
  customer, 
  agentId 
}: { 
  customer: CRMCustomer; 
  agentId: string;
}) {
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<CRMNote['note_type']>('general');

  const { 
    interactions, 
    interactionsLoading, 
    notes, 
    notesLoading,
    addNote,
    isAddingNote,
    deleteNote,
    isDeletingNote,
  } = useCustomerDetails(agentId, customer.id);

  const getInitials = () => {
    const first = customer.first_name?.[0] || '';
    const last = customer.last_name?.[0] || '';
    return (first + last).toUpperCase() || customer.email[0].toUpperCase();
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      await addNote({ noteType, content: noteContent.trim() });
      setNoteContent('');
      setNoteType('general');
      toast.success('Note added');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'inspection':
        return <Calendar className="w-4 h-4" />;
      case 'viewing_request':
        return <Eye className="w-4 h-4" />;
      case 'bid':
        return <Gavel className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'inspection':
        return 'bg-blue-500';
      case 'viewing_request':
        return 'bg-green-500';
      case 'bid':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <SheetHeader>
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={customer.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <SheetTitle className="text-xl">
              {customer.first_name || customer.last_name
                ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                : 'Unknown Customer'}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
            {customer.phone && (
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
            )}
          </div>
        </div>
      </SheetHeader>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Calendar className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{customer.inspection_count}</p>
            <p className="text-xs text-muted-foreground">Inspections</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Eye className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{customer.viewing_count}</p>
            <p className="text-xs text-muted-foreground">Viewings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Gavel className="w-5 h-5 mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold">{customer.bid_count}</p>
            <p className="text-xs text-muted-foreground">Bids</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Activity</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          {interactionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : interactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No interactions found
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <div className={`p-2 rounded-full ${getInteractionColor(interaction.type)} text-white`}>
                      {getInteractionIcon(interaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium capitalize">
                          {interaction.type.replace('_', ' ')}
                        </span>
                        {interaction.status && (
                          <Badge variant="outline" className="text-xs">
                            {interaction.status}
                          </Badge>
                        )}
                        {interaction.amount && (
                          <Badge variant="default" className="text-xs">
                            ${interaction.amount.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {interaction.details}
                      </p>
                      {interaction.property_title && (
                        <Link
                          to={`/property/${interaction.property_id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          <Home className="w-3 h-3" />
                          {interaction.property_title}
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(interaction.date), 'PPp')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-4">
          {/* Add Note Form */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Select value={noteType} onValueChange={(v) => setNoteType(v as CRMNote['note_type'])}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTE_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="w-4 h-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="Add a note about this customer..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleAddNote} 
                disabled={isAddingNote || !noteContent.trim()}
                className="w-full"
              >
                {isAddingNote ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Note
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Notes List */}
          {notesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notes yet. Add your first note above.
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {notes.map((note) => {
                  const config = NOTE_TYPE_CONFIG[note.note_type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-secondary/50 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${config.color} text-white`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(note.created_at), 'PP')}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={isDeletingNote}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-sm mt-2 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
