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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Home,
  FileText,
  Tag,
  X,
  Check,
  Flame,
  ArrowUpDown,
  TrendingUp,
  LayoutDashboard,
  UserSearch,
  Download,
} from 'lucide-react';
import { useAgentCRM, useCustomerDetails, CRMCustomer, CRMNote, CRMTag, getLeadScoreLabel } from '@/hooks/useAgentCRM';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CRMDashboard } from '@/components/crm/CRMDashboard';

const NOTE_TYPE_CONFIG = {
  call: { label: 'Call', icon: Phone, color: 'bg-blue-500' },
  email: { label: 'Email', icon: Mail, color: 'bg-green-500' },
  meeting: { label: 'Meeting', icon: Users, color: 'bg-purple-500' },
  follow_up: { label: 'Follow Up', icon: Clock, color: 'bg-orange-500' },
  general: { label: 'General', icon: FileText, color: 'bg-gray-500' },
};

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

const DEFAULT_TAGS = [
  { name: 'Hot Lead', color: '#ef4444' },
  { name: 'First Home Buyer', color: '#3b82f6' },
  { name: 'Investor', color: '#22c55e' },
  { name: 'Downsizer', color: '#8b5cf6' },
  { name: 'Follow Up', color: '#f97316' },
];

// CSV Export utilities
function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportCustomersToCSV(
  customers: CRMCustomer[], 
  customerTagsMap: Map<string, string[]>,
  tags: CRMTag[]
) {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Lead Score',
    'Lead Status',
    'Inspections',
    'Viewings',
    'Bids',
    'Tags',
    'Last Interaction',
  ];

  const rows = customers.map(customer => {
    const customerTagIds = customerTagsMap.get(customer.id) || [];
    const customerTags = tags.filter(t => customerTagIds.includes(t.id)).map(t => t.name).join('; ');
    const scoreInfo = getLeadScoreLabel(customer.lead_score);
    const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown';
    
    return [
      escapeCSV(name),
      escapeCSV(customer.email),
      escapeCSV(customer.phone),
      customer.lead_score,
      scoreInfo.label,
      customer.inspection_count,
      customer.viewing_count,
      customer.bid_count,
      escapeCSV(customerTags),
      customer.last_interaction ? format(new Date(customer.last_interaction), 'yyyy-MM-dd HH:mm') : '',
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const date = format(new Date(), 'yyyy-MM-dd');
  downloadCSV(csv, `crm-customers-${date}.csv`);
}

export default function CRM() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CRMCustomer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'recent' | 'name'>('score');
  const [activeView, setActiveView] = useState<'dashboard' | 'customers'>('dashboard');

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

  const { 
    customers, 
    customersLoading, 
    tags, 
    customerTagsMap,
    createTag,
    isCreatingTag,
    deleteTag,
  } = useAgentCRM(agentId);

  const filteredCustomers = customers
    .filter(customer => {
      const searchLower = searchQuery.toLowerCase();
      const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
      const matchesSearch = (
        fullName.includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower)
      );
      
      // Filter by tag if selected
      if (filterTag) {
        const customerTags = customerTagsMap.get(customer.id) || [];
        return matchesSearch && customerTags.includes(filterTag);
      }
      
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.lead_score - a.lead_score;
        case 'recent':
          if (!a.last_interaction && !b.last_interaction) return 0;
          if (!a.last_interaction) return 1;
          if (!b.last_interaction) return -1;
          return new Date(b.last_interaction).getTime() - new Date(a.last_interaction).getTime();
        case 'name':
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
          return nameA.localeCompare(nameB);
        default:
          return 0;
      }
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

  const getCustomerTags = (customerId: string) => {
    const tagIds = customerTagsMap.get(customerId) || [];
    return tags.filter(t => tagIds.includes(t.id));
  };

  return (
    <AgentLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Customer CRM</h1>
            <p className="text-muted-foreground font-body">
              Manage customer relationships and track interactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              <Users className="w-4 h-4 mr-1" />
              {customers.length} Customers
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCustomersToCSV(customers, customerTagsMap, tags)}
              disabled={customers.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <TagManager 
              tags={tags} 
              onCreateTag={createTag}
              isCreating={isCreatingTag}
              onDeleteTag={deleteTag}
            />
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 border-b">
          <Button
            variant={activeView === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('dashboard')}
            className="rounded-b-none"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={activeView === 'customers' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('customers')}
            className="rounded-b-none"
          >
            <UserSearch className="w-4 h-4 mr-2" />
            Customers
          </Button>
        </div>

        {activeView === 'dashboard' ? (
          <CRMDashboard customers={customers} isLoading={customersLoading} agentId={agentId} />
        ) : (
          <>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterTag || 'all'} onValueChange={(v) => setFilterTag(v === 'all' ? null : v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Tag className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Lead Score
                </div>
              </SelectItem>
              <SelectItem value="recent">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Most Recent
                </div>
              </SelectItem>
              <SelectItem value="name">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Name
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
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
              <h3 className="font-display text-lg font-medium text-foreground mb-2">No customers found</h3>
              <p className="text-muted-foreground font-body">
                {filterTag ? 'No customers match the selected tag filter' : 'Customers will appear here when they interact with your properties'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => {
              const customerTags = getCustomerTags(customer.id);
              const scoreInfo = getLeadScoreLabel(customer.lead_score);
              return (
                <Card
                  key={customer.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors relative"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <CardContent className="p-4">
                    {/* Lead Score Badge */}
                    <div 
                      className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: scoreInfo.color }}
                    >
                      <Flame className="w-3 h-3" />
                      {scoreInfo.label}
                      <span className="opacity-80">({customer.lead_score})</span>
                    </div>

                    <div className="flex items-start gap-3 pr-20">
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

                    {/* Customer Tags */}
                    {customerTags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                        {customerTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {customer.inspection_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {customer.inspection_count}
                        </Badge>
                      )}
                      {customer.viewing_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          {customer.viewing_count}
                        </Badge>
                      )}
                      {customer.bid_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Gavel className="w-3 h-3 mr-1" />
                          {customer.bid_count}
                        </Badge>
                      )}
                    </div>

                    {customer.last_interaction && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last: {formatDistanceToNow(new Date(customer.last_interaction), { addSuffix: true })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        </>
        )}

        {/* Customer Detail Sheet */}
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selectedCustomer && (
              <CustomerDetailPanel
                customer={selectedCustomer}
                agentId={agentId}
                allTags={tags}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AgentLayout>
  );
}

function TagManager({ 
  tags, 
  onCreateTag, 
  isCreating,
  onDeleteTag,
}: { 
  tags: CRMTag[];
  onCreateTag: (data: { name: string; color: string }) => Promise<void>;
  isCreating: boolean;
  onDeleteTag: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }
    if (newTagName.trim().length > 30) {
      toast.error('Tag name must be less than 30 characters');
      return;
    }

    try {
      await onCreateTag({ name: newTagName.trim(), color: newTagColor });
      setNewTagName('');
      toast.success('Tag created');
    } catch (error: any) {
      if (error?.code === '23505') {
        toast.error('A tag with this name already exists');
      } else {
        toast.error('Failed to create tag');
      }
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await onDeleteTag(tagId);
      toast.success('Tag deleted');
    } catch (error) {
      toast.error('Failed to delete tag');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag className="w-4 h-4 mr-2" />
          Manage Tags
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Create New Tag</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                maxLength={30}
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    style={{ backgroundColor: newTagColor }}
                  >
                    <span className="sr-only">Pick color</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <div className="grid grid-cols-4 gap-1">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      >
                        {newTagColor === color && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button onClick={handleCreateTag} disabled={isCreating} size="icon">
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Existing Tags ({tags.length})</h4>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags created yet</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 group"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteTag(tag.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CustomerDetailPanel({ 
  customer, 
  agentId,
  allTags,
}: { 
  customer: CRMCustomer; 
  agentId: string;
  allTags: CRMTag[];
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
    customerTags,
    assignTag,
    isAssigningTag,
    removeTag,
    isRemovingTag,
  } = useCustomerDetails(agentId, customer.id);

  const assignedTags = allTags.filter(t => customerTags.includes(t.id));
  const availableTags = allTags.filter(t => !customerTags.includes(t.id));

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

  const handleAssignTag = async (tagId: string) => {
    try {
      await assignTag(tagId);
      toast.success('Tag assigned');
    } catch (error) {
      toast.error('Failed to assign tag');
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeTag(tagId);
      toast.success('Tag removed');
    } catch (error) {
      toast.error('Failed to remove tag');
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

      {/* Tags Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Tags</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {assignedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                disabled={isRemovingTag}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {availableTags.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Tag
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="space-y-1">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleAssignTag(tag.id)}
                      disabled={isAssigningTag}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 text-left"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {assignedTags.length === 0 && availableTags.length === 0 && (
            <span className="text-sm text-muted-foreground">No tags available. Create tags first.</span>
          )}
        </div>
      </div>

      {/* Lead Score */}
      {(() => {
        const scoreInfo = getLeadScoreLabel(customer.lead_score);
        return (
          <Card className="border-2" style={{ borderColor: scoreInfo.color }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: scoreInfo.color }}
                  >
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lead Score</p>
                    <p className="text-2xl font-bold">{customer.lead_score}</p>
                  </div>
                </div>
                <Badge 
                  className="text-sm font-semibold text-white"
                  style={{ backgroundColor: scoreInfo.color }}
                >
                  {scoreInfo.label} Lead
                </Badge>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span><TrendingUp className="w-3 h-3 inline mr-1" />Bids: +{customer.bid_count * 30}</span>
                  <span>Viewings: +{customer.viewing_count * 15}</span>
                  <span>Inspections: +{customer.inspection_count * 10}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

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
            <ScrollArea className="h-[350px] pr-4">
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
                maxLength={1000}
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
            <ScrollArea className="h-[250px] pr-4">
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
