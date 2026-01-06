import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAgent } from '@/hooks/useCurrentAgent';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday, parseISO } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Home, 
  Users, 
  Eye,
  MapPin,
  ChevronLeft,
  ChevronRight,
  List,
  Grid3X3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiaryEvent {
  id: string;
  type: 'inspection' | 'viewing' | 'invitation';
  title: string;
  address: string;
  dateTime: Date;
  time: string;
  status: string;
  propertyId?: string;
  customerId?: string;
  customerName?: string;
}

export default function AgentDiary() {
  const { agentId } = useCurrentAgent();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Real-time subscription for inspections
  useEffect(() => {
    const channel = supabase
      .channel('diary-inspections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inspections',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['diary-inspections'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch all inspections
  const { data: inspections = [] } = useQuery({
    queryKey: ['diary-inspections', agentId],
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('agent_id', agentId);
      
      if (!properties?.length) return [];
      
      const propertyIds = properties.map(p => p.id);
      
      const { data: inspections } = await supabase
        .from('inspections')
        .select(`
          id,
          date_time,
          status,
          property_id,
          properties:property_id (
            title,
            address,
            suburb
          )
        `)
        .in('property_id', propertyIds)
        .neq('status', 'cancelled')
        .order('date_time', { ascending: true });
      
      return inspections || [];
    },
    enabled: !!agentId,
  });

  // Fetch viewing requests
  const { data: viewingRequests = [] } = useQuery({
    queryKey: ['diary-viewings', agentId],
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data } = await supabase
        .from('viewing_requests')
        .select(`
          id,
          requested_date,
          requested_time,
          status,
          property_id,
          customer_id
        `)
        .eq('agent_id', agentId)
        .in('status', ['accepted', 'confirmed'])
        .order('requested_date', { ascending: true });
      
      if (!data?.length) return [];
      
      // Get property details
      const propertyIds = [...new Set(data.map(r => r.property_id))];
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, address, suburb')
        .in('id', propertyIds);
      
      const propertyMap = new Map(properties?.map(p => [p.id, p]) || []);
      
      // Get customer names
      const customerIds = [...new Set(data.map(r => r.customer_id))];
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', customerIds);
      
      const customerMap = new Map(customers?.map(c => [c.id, c]) || []);
      
      return data.map(r => ({
        ...r,
        property: propertyMap.get(r.property_id),
        customer: customerMap.get(r.customer_id),
      }));
    },
    enabled: !!agentId,
  });

  // Fetch confirmed inspection invitations
  const { data: invitations = [] } = useQuery({
    queryKey: ['diary-invitations', agentId],
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data } = await supabase
        .from('inspection_invitations')
        .select(`
          id,
          selected_date,
          selected_time,
          status,
          appraisal_id,
          customer_id
        `)
        .eq('agent_id', agentId)
        .eq('status', 'confirmed')
        .order('selected_date', { ascending: true });
      
      if (!data?.length) return [];
      
      // Get appraisal details
      const appraisalIds = [...new Set(data.map(r => r.appraisal_id))];
      const { data: appraisals } = await supabase
        .from('appraisals')
        .select('id, address, suburb')
        .in('id', appraisalIds);
      
      const appraisalMap = new Map(appraisals?.map(a => [a.id, a]) || []);
      
      // Get customer names
      const customerIds = [...new Set(data.map(r => r.customer_id))];
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', customerIds);
      
      const customerMap = new Map(customers?.map(c => [c.id, c]) || []);
      
      return data.map(r => ({
        ...r,
        appraisal: appraisalMap.get(r.appraisal_id),
        customer: customerMap.get(r.customer_id),
      }));
    },
    enabled: !!agentId,
  });

  // Helper to safely parse date
  const safeParseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const safeParseISO = (dateTimeStr: string): Date | null => {
    try {
      const date = parseISO(dateTimeStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  // Transform all events into unified format
  const allEvents = useMemo<DiaryEvent[]>(() => {
    const events: DiaryEvent[] = [];
    
    // Add inspections
    inspections.forEach((insp: any) => {
      const dateTime = safeParseDate(insp.date_time);
      if (!dateTime) return; // Skip invalid dates
      
      events.push({
        id: insp.id,
        type: 'inspection',
        title: insp.properties?.title || 'Property Inspection',
        address: `${insp.properties?.address || ''}, ${insp.properties?.suburb || ''}`,
        dateTime,
        time: format(dateTime, 'h:mm a'),
        status: insp.status,
        propertyId: insp.property_id,
      });
    });
    
    // Add viewing requests
    viewingRequests.forEach((vr: any) => {
      if (!vr.requested_date) return; // Skip if no date
      const dateTime = safeParseISO(`${vr.requested_date}T${vr.requested_time || '10:00'}`);
      if (!dateTime) return; // Skip invalid dates
      
      const customerName = vr.customer?.first_name 
        ? `${vr.customer.first_name} ${vr.customer.last_name || ''}`.trim()
        : vr.customer?.email || 'Unknown';
      events.push({
        id: vr.id,
        type: 'viewing',
        title: vr.property?.title || 'Property Viewing',
        address: `${vr.property?.address || ''}, ${vr.property?.suburb || ''}`,
        dateTime,
        time: vr.requested_time || '10:00 AM',
        status: vr.status,
        propertyId: vr.property_id,
        customerId: vr.customer_id,
        customerName,
      });
    });
    
    // Add confirmed invitations
    invitations.forEach((inv: any) => {
      if (!inv.selected_date || !inv.selected_time) return;
      const dateTime = safeParseISO(`${inv.selected_date}T${inv.selected_time || '10:00'}`);
      if (!dateTime) return; // Skip invalid dates
      
      const customerName = inv.customer?.first_name 
        ? `${inv.customer.first_name} ${inv.customer.last_name || ''}`.trim()
        : inv.customer?.email || 'Unknown';
      events.push({
        id: inv.id,
        type: 'invitation',
        title: 'Pre-Market Inspection',
        address: `${inv.appraisal?.address || ''}, ${inv.appraisal?.suburb || ''}`,
        dateTime,
        time: inv.selected_time,
        status: inv.status,
        customerId: inv.customer_id,
        customerName,
      });
    });
    
    // Sort by date
    return events.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [inspections, viewingRequests, invitations]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    return allEvents.filter(event => isSameDay(event.dateTime, selectedDate));
  }, [allEvents, selectedDate]);

  // Get dates with events for calendar highlighting
  const datesWithEvents = useMemo(() => {
    const dates = new Set<string>();
    allEvents.forEach(event => {
      if (event.dateTime && !isNaN(event.dateTime.getTime())) {
        dates.add(format(event.dateTime, 'yyyy-MM-dd'));
      }
    });
    return dates;
  }, [allEvents]);

  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return allEvents.filter(event => event.dateTime >= now && event.dateTime <= weekFromNow);
  }, [allEvents]);

  const getEventTypeColor = (type: DiaryEvent['type']) => {
    switch (type) {
      case 'inspection':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'viewing':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'invitation':
        return 'bg-green-500/10 text-green-600 border-green-500/30';
    }
  };

  const getEventTypeIcon = (type: DiaryEvent['type']) => {
    switch (type) {
      case 'inspection':
        return <Home className="w-4 h-4" />;
      case 'viewing':
        return <Eye className="w-4 h-4" />;
      case 'invitation':
        return <Users className="w-4 h-4" />;
    }
  };

  const getEventTypeLabel = (type: DiaryEvent['type']) => {
    switch (type) {
      case 'inspection':
        return 'Open Inspection';
      case 'viewing':
        return 'Private Viewing';
      case 'invitation':
        return 'Pre-Market Inspection';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  return (
    <AgentLayout>
      <main className="container px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Agent Diary
            </h1>
            <p className="text-muted-foreground font-body">
              View all your scheduled activities in one place
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="gap-2"
            >
              <Grid3X3 className="w-4 h-4" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              List
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{allEvents.length}</p>
                  <p className="text-xs text-muted-foreground">Total Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {allEvents.filter(e => e.type === 'inspection').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Inspections</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {allEvents.filter(e => e.type === 'viewing').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Viewings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {allEvents.filter(e => e.type === 'invitation').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pre-Market</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="font-display text-lg">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDate(new Date());
                }}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'calendar' ? (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  className="rounded-lg border border-border/50"
                  modifiers={{
                    hasEvent: (date) => datesWithEvents.has(format(date, 'yyyy-MM-dd')),
                  }}
                  modifiersStyles={{
                    hasEvent: {
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      textDecorationColor: 'hsl(var(--primary))',
                    },
                  }}
                />
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {allEvents.length > 0 ? (
                    allEvents.map((event) => (
                      <div
                        key={`${event.type}-${event.id}`}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                          isSameDay(event.dateTime, selectedDate) && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedDate(event.dateTime)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              getEventTypeColor(event.type)
                            )}>
                              {getEventTypeIcon(event.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {event.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {event.address}
                              </p>
                              {event.customerName && (
                                <p className="text-xs text-muted-foreground">
                                  with {event.customerName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium text-foreground">
                              {format(event.dateTime, 'MMM d')}
                            </p>
                            <p className="text-xs text-muted-foreground">{event.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No events scheduled</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Date Events */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((event) => (
                    <div
                      key={`${event.type}-${event.id}`}
                      className="p-3 rounded-lg border border-border/50 bg-muted/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          getEventTypeColor(event.type)
                        )}>
                          {getEventTypeIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={getEventTypeColor(event.type)}>
                              {getEventTypeLabel(event.type)}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm text-foreground truncate">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            {event.address}
                          </div>
                          {event.customerName && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Users className="w-3 h-3" />
                              {event.customerName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No events on this date
                    </p>
                  </div>
                )}
              </div>

              {/* Upcoming Events Section */}
              {upcomingEvents.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Upcoming (Next 7 Days)
                  </h4>
                  <div className="space-y-2">
                    {upcomingEvents.slice(0, 5).map((event) => (
                      <div
                        key={`upcoming-${event.type}-${event.id}`}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                        onClick={() => setSelectedDate(event.dateTime)}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded flex items-center justify-center shrink-0",
                          getEventTypeColor(event.type)
                        )}>
                          {getEventTypeIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{event.title}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(event.dateTime, 'MMM d')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </AgentLayout>
  );
}
