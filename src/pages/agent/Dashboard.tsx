import { useState } from 'react';
import { Header, MobileNav } from '@/components/layout/MobileNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PropertyCard } from '@/components/property/PropertyCard';
import { ViewingRequestCard } from '@/components/viewing/ViewingRequestCard';
import { 
  Building2, Calendar, Users, TrendingUp, Plus, 
  Eye, Clock, CheckCircle2, XCircle, ArrowRight
} from 'lucide-react';
import { mockProperties, mockViewingRequests, mockInspections, mockAgent } from '@/data/mockData';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function AgentDashboard() {
  const activeListings = mockProperties.filter(p => p.status === 'available').length;
  const pendingRequests = mockViewingRequests.filter(r => r.status === 'pending').length;
  const upcomingInspections = mockInspections.filter(i => i.date >= new Date()).length;

  const recentRequests = mockViewingRequests.slice(0, 3);
  const recentProperties = mockProperties.slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header userRole="agent" />

      <main className="container px-4 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Welcome back, {mockAgent.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground text-sm">
            Here's your property overview for today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card variant="interactive" className="cursor-default">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{activeListings}</p>
                  <p className="text-xs text-muted-foreground">Active Listings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive" className="cursor-default">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{pendingRequests}</p>
                  <p className="text-xs text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive" className="cursor-default">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{upcomingInspections}</p>
                  <p className="text-xs text-muted-foreground">Inspections</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive" className="cursor-default">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">24</p>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Button variant="default" size="lg" className="h-auto py-4 flex-col gap-2">
            <Plus className="w-5 h-5" />
            <span>Add Listing</span>
          </Button>
          <Button variant="outline" size="lg" className="h-auto py-4 flex-col gap-2">
            <Calendar className="w-5 h-5" />
            <span>Schedule Inspection</span>
          </Button>
        </div>

        {/* Recent Viewing Requests */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Viewing Requests</h2>
            <Link to="/agent/requests">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {recentRequests.map((request) => (
              <ViewingRequestCard 
                key={request.id} 
                request={request} 
                isAgent 
                onAccept={(id) => console.log('Accept', id)}
                onDecline={(id) => console.log('Decline', id)}
                onCounterPropose={(id) => console.log('Counter', id)}
              />
            ))}
          </div>
        </div>

        {/* Recent Properties */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Your Listings</h2>
            <Link to="/agent/properties">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recentProperties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property} 
                linkPrefix="/agent/property"
              />
            ))}
          </div>
        </div>
      </main>

      <MobileNav userRole="agent" />
    </div>
  );
}
