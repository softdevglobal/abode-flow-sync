import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Header, MobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, Bed, Bath, Car, Ruler, Heart, Share2, 
  MapPin, Calendar, Check, Phone, Mail, User
} from 'lucide-react';
import { mockProperties, mockAgent, mockInspections } from '@/data/mockData';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PropertyDetail() {
  const { id } = useParams();
  const property = mockProperties.find(p => p.id === id);
  const [currentImage, setCurrentImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

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

  const handleRequestViewing = () => {
    toast.success('Viewing request sent! The agent will respond shortly.');
  };

  const statusLabel = {
    available: 'Available',
    under_offer: 'Under Offer',
    sold: 'Sold',
    leased: 'Leased',
    off_market: 'Off Market',
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Image Gallery */}
      <div className="relative">
        <div className="aspect-[4/3] md:aspect-[16/9] overflow-hidden bg-secondary">
          <img
            src={property.images[currentImage]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Navigation */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Link to="/browse">
            <Button variant="secondary" size="icon" className="shadow-lg">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="icon" 
              className="shadow-lg"
              onClick={handleSave}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-destructive text-destructive' : ''}`} />
            </Button>
            <Button variant="secondary" size="icon" className="shadow-lg">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {property.images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentImage === index ? 'bg-primary-foreground w-6' : 'bg-primary-foreground/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="container px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={property.status === 'available' ? 'success' : 'warning'}>
              {statusLabel[property.status]}
            </Badge>
            {property.listingType === 'rent' && (
              <Badge variant="info">For Rent</Badge>
            )}
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            {property.title}
          </h1>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{property.address}, {property.suburb} {property.state} {property.postcode}</span>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <p className="font-display text-3xl font-bold text-accent">
            {property.priceDisplay}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-secondary rounded-lg p-3 text-center">
            <Bed className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-semibold">{property.bedrooms}</p>
            <p className="text-xs text-muted-foreground">Beds</p>
          </div>
          <div className="bg-secondary rounded-lg p-3 text-center">
            <Bath className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-semibold">{property.bathrooms}</p>
            <p className="text-xs text-muted-foreground">Baths</p>
          </div>
          <div className="bg-secondary rounded-lg p-3 text-center">
            <Car className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-semibold">{property.parking}</p>
            <p className="text-xs text-muted-foreground">Parking</p>
          </div>
          <div className="bg-secondary rounded-lg p-3 text-center">
            <Ruler className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-semibold">{property.landSize || property.buildingSize}</p>
            <p className="text-xs text-muted-foreground">m²</p>
          </div>
        </div>

        {/* Description */}
        <Card variant="flat" className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">About this property</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {property.description}
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <Card variant="flat" className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {property.features.map((feature) => (
                <div key={feature} className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full">
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inspections */}
        {inspections.length > 0 && (
          <Card variant="elevated" className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Upcoming Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inspections.map((inspection) => (
                  <div 
                    key={inspection.id} 
                    className="flex items-center justify-between bg-secondary rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">{format(inspection.date, 'EEEE, MMMM d')}</p>
                      <p className="text-sm text-muted-foreground">
                        {inspection.startTime} - {inspection.endTime}
                      </p>
                    </div>
                    <Badge variant={inspection.isPrivate ? 'outline' : 'success'}>
                      {inspection.isPrivate ? 'Private' : 'Open'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent Card */}
        <Card variant="glass" className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Listed by</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                <User className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-display font-semibold">{mockAgent.name}</p>
                <p className="text-sm text-muted-foreground">{mockAgent.company}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 md:hidden">
        <Button variant="gold" size="lg" className="w-full" onClick={handleRequestViewing}>
          <Calendar className="w-5 h-5 mr-2" />
          Request a Viewing
        </Button>
      </div>

      <MobileNav userRole="customer" />
    </div>
  );
}
