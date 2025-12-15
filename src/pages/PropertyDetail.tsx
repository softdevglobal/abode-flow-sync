import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { MobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Bed, Bath, Car, Ruler, Heart, Share2, 
  MapPin, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { mockProperties, mockAgent, mockInspections } from '@/data/mockData';
import { toast } from 'sonner';
import { PropertyImageGallery } from '@/components/property/PropertyImageGallery';
import { AgentEnquiryCard } from '@/components/property/AgentEnquiryCard';
import { PropertyFeaturesGrid } from '@/components/property/PropertyFeaturesGrid';
import { InspectionTimes } from '@/components/property/InspectionTimes';

export default function PropertyDetail() {
  const { id } = useParams();
  const property = mockProperties.find(p => p.id === id);
  const [isSaved, setIsSaved] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const inspections = mockInspections.filter(i => i.propertyId === id);

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
    toast.success('Inspection request sent! The agent will respond shortly.');
  };

  const statusLabel: Record<string, string> = {
    available: 'For Sale',
    under_offer: 'Under Offer',
    sold: 'Sold',
    leased: 'Leased',
    off_market: 'Off Market',
  };

  const propertyTypeLabel: Record<string, string> = {
    house: 'House',
    apartment: 'Apartment',
    townhouse: 'Townhouse',
    land: 'Land',
    commercial: 'Commercial',
  };

  const shouldTruncate = property.description.length > 300;
  const displayDescription = isDescriptionExpanded 
    ? property.description 
    : property.description.slice(0, 300);

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
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
        <PropertyImageGallery images={property.images} title={property.title} />
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
                {property.priceDisplay}
              </p>

              {/* Address */}
              <h1 className="font-display text-xl lg:text-2xl font-semibold text-foreground mb-1">
                {property.address}
              </h1>
              <div className="flex items-center gap-1 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>{property.suburb}, {property.state} {property.postcode}</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Badge variant={property.status === 'available' ? 'success' : 'warning'}>
                  {property.listingType === 'rent' ? 'For Rent' : statusLabel[property.status]}
                </Badge>
                <Badge variant="outline">
                  {propertyTypeLabel[property.propertyType]}
                </Badge>
              </div>

              {/* Quick Stats - Horizontal */}
              <div className="flex items-center gap-6 py-4 border-y border-border">
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">{property.bedrooms}</span>
                  <span className="text-muted-foreground text-sm hidden sm:inline">Beds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">{property.bathrooms}</span>
                  <span className="text-muted-foreground text-sm hidden sm:inline">Baths</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">{property.parking}</span>
                  <span className="text-muted-foreground text-sm hidden sm:inline">Parking</span>
                </div>
                {(property.landSize || property.buildingSize) && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold">{property.landSize || property.buildingSize}</span>
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
            <div className="space-y-3">
              <h2 className="font-display text-xl font-semibold">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
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

            {/* Features */}
            <PropertyFeaturesGrid features={property.features} />

            {/* Inspection Times */}
            <InspectionTimes inspections={inspections} />

            {/* Mobile Agent Card */}
            <div className="lg:hidden">
              <h2 className="font-display text-xl font-semibold mb-4">Listed by</h2>
              <AgentEnquiryCard agent={mockAgent} propertyTitle={property.title} />
            </div>
          </div>

          {/* Right Column - Sticky Agent Card (Desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <AgentEnquiryCard agent={mockAgent} propertyTitle={property.title} />
              
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
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 lg:hidden z-40">
        <Button variant="gold" size="lg" className="w-full" onClick={handleRequestInspection}>
          <Calendar className="w-5 h-5 mr-2" />
          Request an Inspection
        </Button>
      </div>

      <MobileNav userRole="customer" />
    </div>
  );
}
