import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Calendar, 
  Eye, 
  Gavel, 
  TrendingUp, 
  ArrowRight,
  Flame,
  Target,
  BarChart3,
  CalendarDays,
  Download,
} from 'lucide-react';
import { CRMCustomer, getLeadScoreLabel } from '@/hooks/useAgentCRM';
import { 
  useCRMMetrics, 
  calculateMetricsFromActivities, 
  getDateRangeFromPreset,
  DateRangePreset 
} from '@/hooks/useCRMMetrics';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CRMDashboardProps {
  customers: CRMCustomer[];
  isLoading: boolean;
  agentId: string | undefined;
}

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
];

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

function exportMetricsToCSV(
  metrics: ReturnType<typeof calculateMetricsFromActivities> | null,
  customers: CRMCustomer[],
  datePreset: DateRangePreset
) {
  if (!metrics) {
    toast.error('No metrics data to export');
    return;
  }

  const hotLeads = customers.filter(c => c.lead_score >= 60).length;
  const warmLeads = customers.filter(c => c.lead_score >= 30 && c.lead_score < 60).length;
  const coolLeads = customers.filter(c => c.lead_score >= 10 && c.lead_score < 30).length;
  const newLeads = customers.filter(c => c.lead_score < 10).length;
  const avgLeadScore = customers.length > 0 
    ? Math.round(customers.reduce((sum, c) => sum + c.lead_score, 0) / customers.length)
    : 0;

  const rows = [
    ['CRM Metrics Report'],
    ['Generated', format(new Date(), 'yyyy-MM-dd HH:mm')],
    ['Time Period', DATE_PRESETS.find(p => p.value === datePreset)?.label || 'All Time'],
    [''],
    ['Summary Metrics'],
    ['Total Leads', metrics.totalLeads],
    ['Hot Leads', hotLeads],
    ['Warm Leads', warmLeads],
    ['Cool Leads', coolLeads],
    ['New Leads', newLeads],
    ['Average Lead Score', avgLeadScore],
    [''],
    ['Activity Metrics'],
    ['Total Inspections', metrics.totalInspections],
    ['Customers with Inspections', metrics.customersWithInspections],
    ['Total Viewing Requests', metrics.totalViewings],
    ['Customers with Viewings', metrics.customersWithViewings],
    ['Total Bids', metrics.totalBids],
    ['Customers with Bids', metrics.customersWithBids],
    [''],
    ['Conversion Rates'],
    ['Inspection to Viewing', `${metrics.inspectionToViewingRate}%`],
    ['Viewing to Bid', `${metrics.viewingToBidRate}%`],
    ['Inspection to Bid', `${metrics.inspectionToBidRate}%`],
  ];

  const csv = rows.map(row => row.join(',')).join('\n');
  const date = format(new Date(), 'yyyy-MM-dd');
  downloadCSV(csv, `crm-metrics-${date}.csv`);
  toast.success('Metrics exported successfully');
}

export function CRMDashboard({ customers, isLoading, agentId }: CRMDashboardProps) {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const dateRange = getDateRangeFromPreset(datePreset);
  
  const { data: metricsData, isLoading: metricsLoading } = useCRMMetrics(agentId, dateRange);
  
  // Calculate metrics from filtered activities
  const metrics = metricsData 
    ? calculateMetricsFromActivities(metricsData.activities, metricsData.customerIds)
    : null;

  // Lead score distribution (from all customers - not date filtered)
  const hotLeads = customers.filter(c => c.lead_score >= 60).length;
  const warmLeads = customers.filter(c => c.lead_score >= 30 && c.lead_score < 60).length;
  const coolLeads = customers.filter(c => c.lead_score >= 10 && c.lead_score < 30).length;
  const newLeads = customers.filter(c => c.lead_score < 10).length;
  const totalCustomers = customers.length;

  // Average lead score
  const avgLeadScore = totalCustomers > 0 
    ? Math.round(customers.reduce((sum, c) => sum + c.lead_score, 0) / totalCustomers)
    : 0;

  // Multiple engagement
  const customersWithMultipleEngagements = customers.filter(
    c => (c.inspection_count > 0 ? 1 : 0) + (c.viewing_count > 0 ? 1 : 0) + (c.bid_count > 0 ? 1 : 0) >= 2
  ).length;

  const loading = isLoading || metricsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Time Period:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DateRangePreset)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dateRange && (
                <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                  {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportMetricsToCSV(metrics, customers, datePreset)}
                disabled={!metrics}
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {datePreset === 'all' ? 'Total Leads' : 'Active Leads'}
                </p>
                <p className="text-2xl sm:text-3xl font-bold">{metrics?.totalLeads ?? 0}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Hot Leads</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-500">{hotLeads}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Avg Lead Score</p>
                <p className="text-2xl sm:text-3xl font-bold">{avgLeadScore}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Multi-Engaged</p>
                <p className="text-2xl sm:text-3xl font-bold">{customersWithMultipleEngagements}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Lead Funnel
            {datePreset !== 'all' && (
              <Badge variant="outline" className="ml-2 text-xs font-normal">
                {DATE_PRESETS.find(p => p.value === datePreset)?.label}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 sm:space-y-6">
            {/* Funnel Visualization - Horizontal scroll on mobile */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0">
              {/* Stage 1: Inspections */}
              <div className="flex-shrink-0 w-[100px] sm:w-auto sm:flex-1">
                <div 
                  className="relative bg-blue-500/20 rounded-lg p-3 sm:p-4 text-center"
                  style={{ minHeight: '100px' }}
                >
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-blue-500 mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-3xl font-bold text-blue-600">{metrics?.customersWithInspections ?? 0}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Inspections</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{metrics?.totalInspections ?? 0} total</p>
                </div>
              </div>

              {/* Arrow with conversion rate */}
              <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-shrink-0">
                <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground" />
                <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-2">
                  {metrics?.inspectionToViewingRate ?? 0}%
                </Badge>
              </div>

              {/* Stage 2: Viewings */}
              <div className="flex-shrink-0 w-[100px] sm:w-auto sm:flex-1">
                <div 
                  className="relative bg-green-500/20 rounded-lg p-3 sm:p-4 text-center"
                  style={{ minHeight: '100px' }}
                >
                  <Eye className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-green-500 mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-3xl font-bold text-green-600">{metrics?.customersWithViewings ?? 0}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Viewings</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{metrics?.totalViewings ?? 0} total</p>
                </div>
              </div>

              {/* Arrow with conversion rate */}
              <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-shrink-0">
                <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground" />
                <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-2">
                  {metrics?.viewingToBidRate ?? 0}%
                </Badge>
              </div>

              {/* Stage 3: Bids */}
              <div className="flex-shrink-0 w-[100px] sm:w-auto sm:flex-1">
                <div 
                  className="relative bg-purple-500/20 rounded-lg p-3 sm:p-4 text-center"
                  style={{ minHeight: '100px' }}
                >
                  <Gavel className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-purple-500 mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-3xl font-bold text-purple-600">{metrics?.customersWithBids ?? 0}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Bidders</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{metrics?.totalBids ?? 0} total</p>
                </div>
              </div>
            </div>

            {/* Conversion Summary */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t">
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{metrics?.inspectionToViewingRate ?? 0}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Inspection → Viewing</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-green-600">{metrics?.viewingToBidRate ?? 0}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Viewing → Bid</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{metrics?.inspectionToBidRate ?? 0}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Inspection → Bid</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Score Distribution */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5" />
              Lead Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Hot Leads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">Hot (60+)</span>
                  </div>
                  <span className="text-sm font-bold">{hotLeads}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${totalCustomers > 0 ? (hotLeads / totalCustomers) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Warm Leads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-sm font-medium">Warm (30-59)</span>
                  </div>
                  <span className="text-sm font-bold">{warmLeads}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all"
                    style={{ width: `${totalCustomers > 0 ? (warmLeads / totalCustomers) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Cool Leads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">Cool (10-29)</span>
                  </div>
                  <span className="text-sm font-bold">{coolLeads}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${totalCustomers > 0 ? (coolLeads / totalCustomers) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* New Leads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <span className="text-sm font-medium">New (0-9)</span>
                  </div>
                  <span className="text-sm font-bold">{newLeads}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-500 transition-all"
                    style={{ width: `${totalCustomers > 0 ? (newLeads / totalCustomers) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Activity Summary
              {datePreset !== 'all' && (
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  {DATE_PRESETS.find(p => p.value === datePreset)?.label}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Inspections</p>
                    <p className="text-xs text-muted-foreground">{metrics?.customersWithInspections ?? 0} customers</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600">{metrics?.totalInspections ?? 0}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Viewing Requests</p>
                    <p className="text-xs text-muted-foreground">{metrics?.customersWithViewings ?? 0} customers</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">{metrics?.totalViewings ?? 0}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Gavel className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Bids Placed</p>
                    <p className="text-xs text-muted-foreground">{metrics?.customersWithBids ?? 0} customers</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-600">{metrics?.totalBids ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Hot Leads */}
      {hotLeads > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              Top Hot Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customers
                .filter(c => c.lead_score >= 60)
                .sort((a, b) => b.lead_score - a.lead_score)
                .slice(0, 5)
                .map((customer) => {
                  const scoreInfo = getLeadScoreLabel(customer.lead_score);
                  return (
                    <div 
                      key={customer.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {customer.first_name?.[0] || customer.email[0].toUpperCase()}
                          {customer.last_name?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-medium">
                            {customer.first_name || customer.last_name
                              ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                              : customer.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {customer.inspection_count} inspections · {customer.viewing_count} viewings · {customer.bid_count} bids
                          </p>
                        </div>
                      </div>
                      <Badge 
                        className="text-white"
                        style={{ backgroundColor: scoreInfo.color }}
                      >
                        {customer.lead_score} pts
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
