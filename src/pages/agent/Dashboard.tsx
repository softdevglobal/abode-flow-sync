import { AgentLayout } from '@/components/layout/AgentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Calendar, Users, Clock, Plus, ArrowRight, Bell, CheckCircle, AlertCircle, Info, Handshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAgentProperties } from '@/hooks/useAgentProperties';
import { useAgentDashboard, useAgentNotifications } from '@/hooks/useAgentDashboard';
import { usePartnerMetrics } from '@/hooks/usePartnerMetrics';
import { formatDistanceToNow } from 'date-fns';

export default function AgentDashboard() {
  const { properties, loading: propertiesLoading } = useAgentProperties();
  const { 
    activeCount, 
    pendingCount, 
    upcomingInspectionsCount, 
    pendingBookingsCount,
    isLoading: statsLoading 
  } = useAgentDashboard();
  const { data: notifications = [], isLoading: notificationsLoading } = useAgentNotifications(5);
  const { data: partnerMetrics, isLoading: partnerMetricsLoading } = usePartnerMetrics();

  const loading = statsLoading;

  const stats = [
    {
      title: 'Active Listings',
      value: activeCount,
      icon: Building2,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Upcoming Inspections',
      value: upcomingInspectionsCount,
      icon: Calendar,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Pending Bookings',
      value: pendingBookingsCount,
      icon: Users,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Pending Listings',
      value: pendingCount,
      icon: Clock,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inspection_reminder':
        return <Calendar className="w-4 h-4 text-primary" />;
      case 'booking_confirmed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'booking_cancelled':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <AgentLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="font-display text-xl md:text-3xl font-bold text-foreground mb-1">
            Welcome back!
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            Here's an overview of your real estate portfolio.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors cursor-default">
              <CardContent className="p-3 sm:pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                  </div>
                  <div>
                    {loading ? (
                      <Skeleton className="h-6 sm:h-8 w-10 sm:w-12 mb-1" />
                    ) : (
                      <p className="text-xl sm:text-2xl font-display font-bold">
                        {stat.value}
                      </p>
                    )}
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-body leading-tight">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="default" size="sm" className="h-auto py-3 sm:py-4 flex-col gap-1 sm:gap-2 font-body shadow-glow-sm text-xs sm:text-sm">
            <Link to="/agent/properties">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Listing</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-auto py-3 sm:py-4 flex-col gap-1 sm:gap-2 font-body hover:border-primary/50 text-xs sm:text-sm">
            <Link to="/agent/inspections">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Inspections</span>
            </Link>
          </Button>
        </div>

        {/* Partner Activity & Quick Links */}
        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {/* Partner Activity Widget */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Handshake className="w-5 h-5 text-accent" />
                Partner Activity
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="font-body hover:text-primary">
                <Link to="/agent/network">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {partnerMetricsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Active Partners</span>
                    <span className="font-semibold text-foreground">{partnerMetrics?.activePartners || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Partner Listings</span>
                    <span className="font-semibold text-foreground">{partnerMetrics?.partnerPropertyViews || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Bookings (7 days)</span>
                    <span className="font-semibold text-foreground">{partnerMetrics?.partnerInspectionBookings || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-display text-lg">Manage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-between font-body hover:border-primary/50">
                <Link to="/agent/properties">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Manage Listings
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between font-body hover:border-primary/50">
                <Link to="/agent/inspections">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    View Inspections
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between font-body hover:border-primary/50">
                <Link to="/agent/requests">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Client Requests
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity / Notifications */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-body">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-xl transition-colors border ${
                        notification.read ? 'bg-muted/20 border-border/30' : 'bg-muted/40 border-border/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-body ${notification.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate font-body">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1 font-body">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CTA Card */}
        <Card className="border-primary/30 gradient-orange text-white shadow-glow-sm rounded-xl overflow-hidden">
          <CardContent className="p-4 sm:pt-6">
            <h3 className="font-display text-lg sm:text-xl font-bold mb-1 sm:mb-2">
              Add a New Listing
            </h3>
            <p className="text-white/80 mb-3 sm:mb-4 font-body text-sm">
              List a new property and start receiving enquiries from potential buyers.
            </p>
            <Button asChild variant="secondary" size="sm" className="bg-white text-primary hover:bg-white/90 font-body">
              <Link to="/agent/properties">
                <Plus className="w-4 h-4 mr-2" />
                Create Listing
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Properties */}
        {!propertiesLoading && properties.length > 0 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">Recent Listings</CardTitle>
              <Button asChild variant="ghost" size="sm" className="font-body hover:text-primary">
                <Link to="/agent/properties">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {properties.slice(0, 5).map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <img
                      src={property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100'}
                      alt={property.title}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate font-body">{property.title}</p>
                      <p className="text-sm text-muted-foreground truncate font-body">
                        {property.suburb}, {property.state}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize font-body ${
                      property.status === 'active'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : property.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : 'bg-muted/50 text-muted-foreground border border-border/50'
                    }`}>
                      {property.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AgentLayout>
  );
}
