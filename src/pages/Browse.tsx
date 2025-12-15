import { useState } from 'react';
import { Header, MobileNav } from '@/components/layout/MobileNav';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, MapPin, X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Property = Tables<'properties'>;
type PropertyType = 'house' | 'apartment' | 'townhouse' | 'land' | 'commercial' | 'rural';

const propertyTypes: { value: PropertyType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'house', label: 'Houses' },
  { value: 'apartment', label: 'Apartments' },
  { value: 'townhouse', label: 'Townhouses' },
  { value: 'land', label: 'Land' },
];

export default function Browse() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<PropertyType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch active properties from the database
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['browse-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Property[];
    },
  });

  const filteredProperties = properties.filter(property => {
    const matchesSearch = 
      property.title.toLowerCase().includes(search.toLowerCase()) ||
      property.suburb.toLowerCase().includes(search.toLowerCase()) ||
      property.address.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = selectedType === 'all' || property.property_type === selectedType;

    return matchesSearch && matchesType;
  });

  // Convert database property to UI format for PropertyCard
  const mapPropertyForCard = (property: Property) => ({
    id: property.id,
    agentId: property.agent_id,
    title: property.title,
    address: property.address,
    suburb: property.suburb,
    state: property.state,
    postcode: property.postcode,
    propertyType: property.property_type as 'house' | 'apartment' | 'townhouse' | 'land' | 'commercial' | 'rural',
    listingType: property.listing_type as 'sale' | 'rent',
    status: property.status === 'active' ? 'available' as const 
          : property.status === 'pending' ? 'under_offer' as const
          : property.status as 'sold' | 'off_market',
    price: property.price || undefined,
    priceFrom: property.price_from || undefined,
    priceTo: property.price_to || undefined,
    priceDisplay: property.price_display || undefined,
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
    parking: property.parking || 0,
    landSize: property.land_size || undefined,
    buildingSize: property.building_size || undefined,
    description: property.description || '',
    features: property.features || [],
    images: property.images || [],
    createdAt: new Date(property.created_at),
    updatedAt: new Date(property.updated_at),
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header userRole="customer" />

      <main className="container px-4 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Discover Properties
          </h1>
          <p className="text-muted-foreground text-sm">
            Find your perfect home from our curated listings
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by suburb or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Button 
            variant={showFilters ? "accent" : "outline"} 
            size="icon" 
            className="h-12 w-12"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
          {propertyTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === type.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${filteredProperties.length} properties found`}
          </p>
          {search && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearch('')}
              className="text-muted-foreground"
            >
              Clear search
              <X className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Property Grid */}
        {!isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property, index) => (
              <div key={property.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <PropertyCard property={mapPropertyForCard(property)} linkPrefix="/property" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              No properties found
            </h3>
            <p className="text-muted-foreground text-sm">
              {properties.length === 0 
                ? 'No properties have been listed yet. Check back soon!'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        )}
      </main>

      <MobileNav userRole="customer" />
    </div>
  );
}
