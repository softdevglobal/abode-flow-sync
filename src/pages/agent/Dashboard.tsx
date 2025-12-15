import { AgentLayout } from '@/components/layout/AgentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Calendar, Users, Clock, Plus, ArrowRight, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAgentProperties } from '@/hooks/useAgentProperties';
import { useAgentDashboard, useAgentNotifications } from '@/hooks/useAgentDashboard';
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
      <div className="container px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome back!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your real estate portfolio.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} variant="interactive" className="cursor-default">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    {loading ? (
                      <Skeleton className="h-8 w-12 mb-1" />
                    ) : (
                      <p className="text-2xl font-display font-bold">
                        {stat.value}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Button asChild variant="default" size="lg" className="h-auto py-4 flex-col gap-2">
            <Link to="/agent/properties">
              <Plus className="w-5 h-5" />
              <span>Add Listing</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-auto py-4 flex-col gap-2">
            <Link to="/agent/inspections">
              <Calendar className="w-5 h-5" />
              <span>Inspections</span>
            </Link>
          </Button>
        </div>

        {/* Quick Links & Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg">Manage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to="/agent/properties">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Manage Listings
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to="/agent/inspections">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    View Inspections
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to="/agent/requests">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Client Requests
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity / Notifications */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
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
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        notification.read ? 'bg-muted/30' : 'bg-muted/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
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
        <Card className="border-border gradient-hero text-primary-foreground mb-8">
          <CardContent className="pt-6">
            <h3 className="font-display text-xl font-bold mb-2">
              Add a New Listing
            </h3>
            <p className="text-primary-foreground/80 mb-4">
              List a new property and start receiving enquiries from potential buyers.
            </p>
            <Button asChild variant="secondary">
              <Link to="/agent/properties">
                <Plus className="w-4 h-4 mr-2" />
                Create Listing
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Properties */}
        {!propertiesLoading && properties.length > 0 && (
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">Recent Listings</CardTitle>
              <Button asChild variant="ghost" size="sm">
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
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <img
                      src={property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100'}
                      alt={property.title}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{property.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {property.suburb}, {property.state}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      property.status === 'active'
                        ? 'bg-success/10 text-success'
                        : property.status === 'pending'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-muted text-muted-foreground'
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
