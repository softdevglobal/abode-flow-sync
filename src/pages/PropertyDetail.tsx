import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Bed, Bath, Car, Ruler, Heart, Share2, 
  MapPin, Calendar, ChevronDown, ChevronUp, Loader2, Gavel
} from 'lucide-react';
import { toast } from 'sonner';
import { PropertyImageGallery } from '@/components/property/PropertyImageGallery';
import { AgentEnquiryCard } from '@/components/property/AgentEnquiryCard';
import { PropertyFeaturesGrid } from '@/components/property/PropertyFeaturesGrid';
import { InspectionTimes } from '@/components/property/InspectionTimes';
import { PropertyMap } from '@/components/property/PropertyMap';
import { InspectionRequestDialog } from '@/components/property/InspectionRequestDialog';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Property = Tables<'properties'>;
type Inspection = Tables<'inspections'>;

export default function PropertyDetail() {
  const { id } = useParams();
  const [isSaved, setIsSaved] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);

  // Fetch property from database
  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch agent info
  const { data: agent } = useQuery({
    queryKey: ['agent', property?.agent_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*, profiles:user_id(first_name, last_name, email, phone)')
        .eq('id', property!.agent_id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!property?.agent_id,
  });

  // Fetch inspections for this property
  const { data: inspections = [] } = useQuery({
    queryKey: ['property-inspections', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('property_id', id!)
        .eq('status', 'scheduled')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch active auction for this property
  const { data: activeAuction } = useQuery({
    queryKey: ['property-auction', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auctions')
        .select('id, status')
        .eq('property_id', id!)
        .in('status', ['live', 'pending'])
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (propertyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold mb-2">Property not found</h2>
          <Link to="/browse">
            <Button variant="outline">Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from saved' : 'Saved to your list');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: property.title,
        text: `Check out this property: ${property.title}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleRequestInspection = () => {
    setShowInspectionDialog(true);
  };

  const statusLabel: Record<string, string> = {
    active: 'For Sale',
    pending: 'Under Offer',
    sold: 'Sold',
    off_market: 'Off Market',
  };

  const propertyTypeLabel: Record<string, string> = {
    house: 'House',
    apartment: 'Apartment',
    townhouse: 'Townhouse',
    land: 'Land',
    commercial: 'Commercial',
    rural: 'Rural',
  };

  const description = property.description || '';
  const shouldTruncate = description.length > 300;
  const displayDescription = isDescriptionExpanded 
    ? description 
    : description.slice(0, 300);

  // Map inspections to format expected by InspectionTimes
  const mappedInspections: import('@/types').Inspection[] = inspections.map((i) => ({
    id: i.id,
    propertyId: i.property_id,
    agentId: property.agent_id,
    date: new Date(i.date_time),
    startTime: new Date(i.date_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }),
    endTime: new Date(new Date(i.date_time).getTime() + i.duration * 60000).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }),
    isPrivate: false,
    createdAt: new Date(i.created_at),
  }));

  // Map agent to expected format
  const mappedAgent: import('@/types').Agent = agent ? {
    id: agent.id,
    email: agent.profiles ? (agent.profiles as any).email || 'agent@example.com' : 'agent@example.com',
    name: agent.profiles ? `${(agent.profiles as any).first_name || ''} ${(agent.profiles as any).last_name || ''}`.trim() || 'Agent' : 'Agent',
    role: 'agent',
    phone: agent.profiles ? (agent.profiles as any).phone || '0400 000 000' : '0400 000 000',
    avatar: agent.profile_image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200',
    company: agent.agency_name || 'Real Estate Agency',
    license: agent.license_number || undefined,
    createdAt: new Date(agent.created_at),
  } : {
    id: 'unknown',
    email: 'agent@example.com',
    name: 'Agent',
    role: 'agent',
    phone: '0400 000 000',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200',
    company: 'Real Estate Agency',
    createdAt: new Date(),
  };

  return (
    <BuyerLayout>
      {/* Back Navigation - Fixed on mobile */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Link to="/browse">
          <Button variant="secondary" size="icon" className="shadow-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Save & Share - Fixed on mobile */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 lg:hidden">
        <Button 
          variant="secondary" 
          size="icon" 
          className="shadow-lg"
          onClick={handleSave}
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-destructive text-destructive' : ''}`} />
        </Button>
        <Button variant="secondary" size="icon" className="shadow-lg" onClick={handleShare}>
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Image Gallery */}
      <div className="group">
        <PropertyImageGallery images={property.images || []} title={property.title} />
      </div>

      {/* Main Content */}
      <div className="container px-4 lg:px-8 py-6 lg:py-10">
        {/* Desktop Back Button */}
        <div className="hidden lg:block mb-6">
          <Link to="/browse" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to search results</span>
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Section */}
            <div>
              {/* Price - Prominent */}
              <p className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {property.price_display || (property.price ? `$${property.price.toLocaleString()}` : 'Contact Agent')}
              </p>

              {/* Address */}
              <h1 className="font-display text-xl lg:text-2xl font-semibold text-foreground mb-1">
                {property.address}
              </h1>
              <div className="flex items-center gap-1 text-muted-foreground mb-4 font-body">
                <MapPin className="w-4 h-4" />
                <span>{property.suburb}, {property.state} {property.postcode}</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Badge variant={property.status === 'active' ? 'success' : 'warning'}>
                  {property.listing_type === 'rent' ? 'For Rent' : statusLabel[property.status] || property.status}
                </Badge>
                <Badge variant="outline">
                  {propertyTypeLabel[property.property_type] || property.property_type}
                </Badge>
                {activeAuction?.status === 'live' && (
                  <Badge className="bg-red-500 text-white animate-pulse">
                    <Gavel className="w-3 h-3 mr-1" />
                    Live Auction
                  </Badge>
                )}
                {activeAuction?.status === 'pending' && (
                  <Badge variant="secondary">
                    <Gavel className="w-3 h-3 mr-1" />
                    Auction Upcoming
                  </Badge>
                )}
              </div>

              {/* Quick Stats - Horizontal */}
              <div className="flex items-center gap-6 py-4 border-y border-border">
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">{property.bedrooms || 0}</span>
                  <span className="text-muted-foreground text-sm hidden sm:inline">Beds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">{property.bathrooms || 0}</span>
                  <span className="text-muted-foreground text-sm hidden sm:inline">Baths</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">{property.parking || 0}</span>
                  <span className="text-muted-foreground text-sm hidden sm:inline">Parking</span>
                </div>
                {(property.land_size || property.building_size) && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold">{property.land_size || property.building_size}</span>
                    <span className="text-muted-foreground text-sm">m²</span>
                  </div>
                )}
              </div>

              {/* Desktop Action Buttons */}
              <div className="hidden lg:flex items-center gap-3 mt-6">
                <Button
                  variant={isSaved ? 'outline' : 'ghost'}
                  onClick={handleSave}
                  className="gap-2"
                >
                  <Heart className={`w-5 h-5 ${isSaved ? 'fill-destructive text-destructive' : ''}`} />
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
                <Button variant="ghost" onClick={handleShare} className="gap-2">
                  <Share2 className="w-5 h-5" />
                  Share
                </Button>
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="space-y-3">
                <h2 className="font-display text-xl font-semibold text-foreground">Description</h2>
                <p className="text-muted-foreground leading-relaxed font-body">
                  {displayDescription}
                  {shouldTruncate && !isDescriptionExpanded && '...'}
                </p>
                {shouldTruncate && (
                  <Button
                    variant="link"
                    className="px-0 h-auto text-accent"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  >
                    {isDescriptionExpanded ? (
                      <>
                        Read less <ChevronUp className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Read more <ChevronDown className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <PropertyFeaturesGrid features={property.features} />
            )}

            {/* Inspection Times */}
            {mappedInspections.length > 0 && (
              <InspectionTimes inspections={mappedInspections} />
            )}

            {/* Map */}
            <PropertyMap
              address={property.address}
              suburb={property.suburb}
              state={property.state}
              postcode={property.postcode}
            />

            {/* Mobile Agent Card */}
            <div className="lg:hidden">
              <h2 className="font-display text-xl font-semibold mb-4">Listed by</h2>
              <AgentEnquiryCard agent={mappedAgent} propertyTitle={property.title} />
            </div>
          </div>

          {/* Right Column - Sticky Agent Card (Desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <AgentEnquiryCard agent={mappedAgent} propertyTitle={property.title} />
              
              {/* Live Auction Button - Desktop */}
              {activeAuction && (
                <Link to={`/auction/live/${activeAuction.id}`}>
                  <Button
                    variant={activeAuction.status === 'live' ? 'default' : 'outline'}
                    size="lg"
                    className={`w-full mt-4 ${activeAuction.status === 'live' ? 'bg-red-500 hover:bg-red-600' : ''}`}
                  >
                    <Gavel className="w-5 h-5 mr-2" />
                    {activeAuction.status === 'live' ? 'Watch Live Auction' : 'View Upcoming Auction'}
                  </Button>
                </Link>
              )}
              
              {/* Request Inspection Button - Desktop */}
              <Button
                variant="gold"
                size="lg"
                className="w-full mt-4"
                onClick={handleRequestInspection}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Request an Inspection
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 lg:hidden z-40 space-y-2">
        {activeAuction && (
          <Link to={`/auction/live/${activeAuction.id}`} className="block">
            <Button
              variant={activeAuction.status === 'live' ? 'default' : 'outline'}
              size="lg"
              className={`w-full ${activeAuction.status === 'live' ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              <Gavel className="w-5 h-5 mr-2" />
              {activeAuction.status === 'live' ? 'Watch Live Auction' : 'View Upcoming Auction'}
            </Button>
          </Link>
        )}
        <Button variant="gold" size="lg" className="w-full" onClick={handleRequestInspection}>
          <Calendar className="w-5 h-5 mr-2" />
          Request an Inspection
        </Button>
      </div>

      {/* Inspection Request Dialog */}
      <InspectionRequestDialog
        open={showInspectionDialog}
        onOpenChange={setShowInspectionDialog}
        propertyId={property.id}
        propertyTitle={property.title}
        agentId={property.agent_id}
      />

    </BuyerLayout>
  );
}
