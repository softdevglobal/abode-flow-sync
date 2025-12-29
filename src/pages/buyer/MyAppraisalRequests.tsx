import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Ruler, 
  Clock, 
  CheckCircle, 
  Phone, 
  XCircle,
  Plus,
  Filter,
  ArrowUpDown,
  Calendar,
  Home,
  Loader2,
} from 'lucide-react';
import { useBuyerAppraisalRequests, useAppraisalRequestStats, AppraisalRequestStatus } from '@/hooks/useBuyerAppraisalRequests';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { 
    label: 'Pending Review', 
    variant: 'secondary' as const, 
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    description: 'Your request is awaiting agent review',
  },
  contacted: { 
    label: 'Agent Contacted', 
    variant: 'default' as const, 
    icon: Phone,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'An agent has reached out to schedule an appraisal',
  },
  completed: { 
    label: 'Appraisal Complete', 
    variant: 'default' as const, 
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    description: 'Your property appraisal has been completed',
  },
  cancelled: { 
    label: 'Cancelled', 
    variant: 'outline' as const, 
    icon: XCircle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    description: 'This request was cancelled',
  },
};

const propertyTypeLabels: Record<string, string> = {
  house: 'House',
  apartment: 'Apartment',
  townhouse: 'Townhouse',
  land: 'Land',
  rural: 'Rural',
  commercial: 'Commercial',
};

export default function MyAppraisalRequests() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<AppraisalRequestStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'suburb'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: requests = [], isLoading } = useBuyerAppraisalRequests({
    status: statusFilter,
    sortBy,
    sortOrder,
  });

  const { data: stats } = useAppraisalRequestStats();

  if (!user) {
    return (
      <BuyerLayout>
        <div className="container px-4 py-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Sign in to view your requests</h1>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view your appraisal requests.
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="container px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              My Appraisal Requests
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track and manage your property appraisal requests
            </p>
          </div>
          <Button asChild>
            <Link to="/appraisals">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.contacted || 0}</p>
                  <p className="text-xs text-muted-foreground">Contacted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.completed || 0}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status Filter Tabs */}
              <Tabs 
                value={statusFilter} 
                onValueChange={(v) => setStatusFilter(v as AppraisalRequestStatus | 'all')}
                className="flex-1"
              >
                <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs sm:text-sm">
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="contacted" className="text-xs sm:text-sm">
                    Contacted
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs sm:text-sm">
                    Completed
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date Submitted</SelectItem>
                    <SelectItem value="updated_at">Last Updated</SelectItem>
                    <SelectItem value="suburb">Suburb</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <ArrowUpDown className={cn(
                    "w-4 h-4 transition-transform",
                    sortOrder === 'asc' && "rotate-180"
                  )} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">
                {statusFilter === 'all' 
                  ? 'No appraisal requests yet' 
                  : `No ${statusFilter} requests`}
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                {statusFilter === 'all'
                  ? 'Submit your first appraisal request to get started'
                  : 'Try changing the filter to see other requests'}
              </p>
              {statusFilter === 'all' && (
                <Button asChild>
                  <Link to="/appraisals">
                    <Plus className="w-4 h-4 mr-2" />
                    Request Appraisal
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const status = statusConfig[request.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <Card 
                  key={request.id} 
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors"
                >
                  <CardContent className="py-5">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Property Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        status.bgColor
                      )}>
                        <Home className={cn("w-6 h-6", status.color)} />
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        {/* Address & Type */}
                        <div className="flex flex-wrap items-start gap-2 mb-2">
                          <h3 className="font-display font-semibold text-foreground">
                            {request.address}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {propertyTypeLabels[request.property_type] || request.property_type}
                          </Badge>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <span>{request.suburb}, {request.state} {request.postcode}</span>
                        </div>

                        {/* Property Details */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                          {request.bedrooms && (
                            <span className="flex items-center gap-1.5">
                              <Bed className="w-4 h-4" />
                              {request.bedrooms} bed
                            </span>
                          )}
                          {request.bathrooms && (
                            <span className="flex items-center gap-1.5">
                              <Bath className="w-4 h-4" />
                              {request.bathrooms} bath
                            </span>
                          )}
                          {request.parking && (
                            <span className="flex items-center gap-1.5">
                              <Car className="w-4 h-4" />
                              {request.parking} car
                            </span>
                          )}
                          {request.land_size && (
                            <span className="flex items-center gap-1.5">
                              <Ruler className="w-4 h-4" />
                              {request.land_size}m²
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {request.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {request.notes}
                          </p>
                        )}

                        {/* Dates */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Submitted {format(new Date(request.created_at), 'dd MMM yyyy')}
                          </span>
                          {request.updated_at !== request.created_at && (
                            <span>
                              Updated {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
                        <Badge 
                          variant={status.variant}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1",
                            status.bgColor,
                            status.color,
                            "border-0"
                          )}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground max-w-[200px] text-left lg:text-right">
                          {status.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
