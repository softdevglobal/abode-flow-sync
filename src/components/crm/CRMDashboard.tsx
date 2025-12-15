import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  Eye, 
  Gavel, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Flame,
  Target,
  BarChart3,
} from 'lucide-react';
import { CRMCustomer, getLeadScoreLabel } from '@/hooks/useAgentCRM';

interface CRMDashboardProps {
  customers: CRMCustomer[];
  isLoading: boolean;
}

export function CRMDashboard({ customers, isLoading }: CRMDashboardProps) {
  // Calculate funnel metrics
  const totalCustomers = customers.length;
  const customersWithInspections = customers.filter(c => c.inspection_count > 0).length;
  const customersWithViewings = customers.filter(c => c.viewing_count > 0).length;
  const customersWithBids = customers.filter(c => c.bid_count > 0).length;
  
  // Multiple engagement (customers who did more than one type of action)
  const customersWithMultipleEngagements = customers.filter(
    c => (c.inspection_count > 0 ? 1 : 0) + (c.viewing_count > 0 ? 1 : 0) + (c.bid_count > 0 ? 1 : 0) >= 2
  ).length;

  // Lead score distribution
  const hotLeads = customers.filter(c => c.lead_score >= 60).length;
  const warmLeads = customers.filter(c => c.lead_score >= 30 && c.lead_score < 60).length;
  const coolLeads = customers.filter(c => c.lead_score >= 10 && c.lead_score < 30).length;
  const newLeads = customers.filter(c => c.lead_score < 10).length;

  // Conversion rates
  const inspectionToViewingRate = customersWithInspections > 0 
    ? Math.round((customersWithViewings / customersWithInspections) * 100) 
    : 0;
  const viewingToBidRate = customersWithViewings > 0 
    ? Math.round((customersWithBids / customersWithViewings) * 100) 
    : 0;
  const inspectionToBidRate = customersWithInspections > 0
    ? Math.round((customersWithBids / customersWithInspections) * 100)
    : 0;

  // Total activities
  const totalInspections = customers.reduce((sum, c) => sum + c.inspection_count, 0);
  const totalViewings = customers.reduce((sum, c) => sum + c.viewing_count, 0);
  const totalBids = customers.reduce((sum, c) => sum + c.bid_count, 0);

  // Average lead score
  const avgLeadScore = totalCustomers > 0 
    ? Math.round(customers.reduce((sum, c) => sum + c.lead_score, 0) / totalCustomers)
    : 0;

  if (isLoading) {
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
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-bold">{totalCustomers}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hot Leads</p>
                <p className="text-3xl font-bold text-red-500">{hotLeads}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Lead Score</p>
                <p className="text-3xl font-bold">{avgLeadScore}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Multi-Engaged</p>
                <p className="text-3xl font-bold">{customersWithMultipleEngagements}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Funnel Visualization */}
            <div className="flex items-center justify-between gap-4">
              {/* Stage 1: Inspections */}
              <div className="flex-1">
                <div 
                  className="relative bg-blue-500/20 rounded-lg p-4 text-center"
                  style={{ minHeight: '120px' }}
                >
                  <Calendar className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-3xl font-bold text-blue-600">{customersWithInspections}</p>
                  <p className="text-sm text-muted-foreground">Inspections</p>
                  <p className="text-xs text-muted-foreground mt-1">{totalInspections} total</p>
                </div>
              </div>

              {/* Arrow with conversion rate */}
              <div className="flex flex-col items-center gap-1 px-2">
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {inspectionToViewingRate}%
                </Badge>
              </div>

              {/* Stage 2: Viewings */}
              <div className="flex-1">
                <div 
                  className="relative bg-green-500/20 rounded-lg p-4 text-center"
                  style={{ minHeight: '120px' }}
                >
                  <Eye className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="text-3xl font-bold text-green-600">{customersWithViewings}</p>
                  <p className="text-sm text-muted-foreground">Viewings</p>
                  <p className="text-xs text-muted-foreground mt-1">{totalViewings} total</p>
                </div>
              </div>

              {/* Arrow with conversion rate */}
              <div className="flex flex-col items-center gap-1 px-2">
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {viewingToBidRate}%
                </Badge>
              </div>

              {/* Stage 3: Bids */}
              <div className="flex-1">
                <div 
                  className="relative bg-purple-500/20 rounded-lg p-4 text-center"
                  style={{ minHeight: '120px' }}
                >
                  <Gavel className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                  <p className="text-3xl font-bold text-purple-600">{customersWithBids}</p>
                  <p className="text-sm text-muted-foreground">Bidders</p>
                  <p className="text-xs text-muted-foreground mt-1">{totalBids} total</p>
                </div>
              </div>
            </div>

            {/* Conversion Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{inspectionToViewingRate}%</p>
                <p className="text-xs text-muted-foreground">Inspection → Viewing</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{viewingToBidRate}%</p>
                <p className="text-xs text-muted-foreground">Viewing → Bid</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{inspectionToBidRate}%</p>
                <p className="text-xs text-muted-foreground">Inspection → Bid</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Score Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Inspections</p>
                    <p className="text-xs text-muted-foreground">{customersWithInspections} customers</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600">{totalInspections}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Viewing Requests</p>
                    <p className="text-xs text-muted-foreground">{customersWithViewings} customers</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">{totalViewings}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Gavel className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Bids Placed</p>
                    <p className="text-xs text-muted-foreground">{customersWithBids} customers</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-600">{totalBids}</p>
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
