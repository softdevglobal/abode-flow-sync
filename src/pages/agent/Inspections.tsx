import { useState, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { Plus, Calendar as CalendarIcon, List, Loader2 } from 'lucide-react';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAgentInspections } from '@/hooks/useAgentInspections';
import { useAgentProperties } from '@/hooks/useAgentProperties';
import { InspectionCard } from '@/components/inspection/InspectionCard';
import { InspectionCalendar } from '@/components/inspection/InspectionCalendar';
import { InspectionDetailSheet } from '@/components/inspection/InspectionDetailSheet';
import { InspectionQRDialog } from '@/components/inspection/InspectionQRDialog';
import { ScheduleInspectionModal } from '@/components/inspection/ScheduleInspectionModal';
import type { InspectionWithProperty } from '@/hooks/useAgentInspections';

type ViewMode = 'list' | 'calendar';
type StatusFilter = 'all' | 'upcoming' | 'today' | 'past' | 'cancelled';

export default function AgentInspections() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<InspectionWithProperty | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [qrInspection, setQrInspection] = useState<InspectionWithProperty | null>(null);

  const { inspections, isLoading, createInspection, cancelInspection } = useAgentInspections();
  const { properties } = useAgentProperties();

  const filteredInspections = useMemo(() => {
    let filtered = inspections;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Filter by status
    switch (statusFilter) {
      case 'upcoming':
        filtered = filtered.filter(i => 
          new Date(i.date_time) > now && i.status !== 'cancelled'
        );
        break;
      case 'today':
        filtered = filtered.filter(i => 
          isSameDay(new Date(i.date_time), today) && i.status !== 'cancelled'
        );
        break;
      case 'past':
        filtered = filtered.filter(i => 
          new Date(i.date_time) < now && i.status !== 'cancelled'
        );
        break;
      case 'cancelled':
        filtered = filtered.filter(i => i.status === 'cancelled');
        break;
    }

    // Filter by selected date in calendar view
    if (viewMode === 'calendar' && selectedDate) {
      filtered = filtered.filter(i => 
        isSameDay(new Date(i.date_time), selectedDate)
      );
    }

    return filtered;
  }, [inspections, statusFilter, viewMode, selectedDate]);

  const handleScheduleSubmit = async (data: {
    property_id: string;
    date_time: string;
    duration: number;
    max_attendees: number;
    notes?: string;
  }) => {
    await createInspection.mutateAsync({
      property_id: data.property_id,
      date_time: data.date_time,
      duration: data.duration,
      max_attendees: data.max_attendees,
      notes: data.notes,
      status: 'scheduled',
      current_attendees: 0,
    });
  };

  const handleInspectionClick = (inspection: InspectionWithProperty) => {
    setSelectedInspection(inspection);
    setIsDetailOpen(true);
  };

  const handleCancelInspection = (id: string) => {
    cancelInspection.mutate(id);
  };

  const handleGenerateQR = (inspection: InspectionWithProperty) => {
    setQrInspection(inspection);
    setIsQROpen(true);
  };

  const handleDetailQR = () => {
    if (selectedInspection) {
      setQrInspection(selectedInspection);
      setIsQROpen(true);
    }
  };

  // Stats
  const todayCount = inspections.filter(i => 
    isSameDay(new Date(i.date_time), new Date()) && i.status !== 'cancelled'
  ).length;
  const upcomingCount = inspections.filter(i => 
    new Date(i.date_time) > new Date() && i.status !== 'cancelled'
  ).length;

  return (
    <AgentLayout>
      <div className="container px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Inspections
            </h1>
            <p className="text-muted-foreground text-sm">
              {upcomingCount} upcoming • {todayCount} today
            </p>
          </div>
          <Button onClick={() => setIsScheduleOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Inspection
          </Button>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </div>

          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-5 w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs sm:text-sm">Upcoming</TabsTrigger>
              <TabsTrigger value="today" className="text-xs sm:text-sm">Today</TabsTrigger>
              <TabsTrigger value="past" className="text-xs sm:text-sm">Past</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs sm:text-sm">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className={viewMode === 'calendar' ? 'grid lg:grid-cols-[350px_1fr] gap-6' : ''}>
            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <div>
                <InspectionCalendar
                  inspections={inspections}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
                {selectedDate && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {filteredInspections.length} inspection{filteredInspections.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Inspection List */}
            <div className="space-y-3">
              {filteredInspections.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {viewMode === 'calendar' && selectedDate
                      ? `No inspections on ${format(selectedDate, 'MMM d, yyyy')}`
                      : 'No inspections found'}
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => setIsScheduleOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Inspection
                  </Button>
                </div>
              ) : (
                filteredInspections.map((inspection) => (
                  <InspectionCard
                    key={inspection.id}
                    inspection={inspection}
                    onClick={() => handleInspectionClick(inspection)}
                    onGenerateQR={() => handleGenerateQR(inspection)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        <ScheduleInspectionModal
          open={isScheduleOpen}
          onOpenChange={setIsScheduleOpen}
          properties={properties}
          onSubmit={handleScheduleSubmit}
        />

        {/* Detail Sheet */}
        <InspectionDetailSheet
          inspection={selectedInspection}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onCancel={handleCancelInspection}
          onGenerateQR={handleDetailQR}
        />

        {/* QR Code Dialog */}
        <InspectionQRDialog
          inspection={qrInspection}
          open={isQROpen}
          onOpenChange={setIsQROpen}
        />
      </div>
    </AgentLayout>
  );
}
