import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Search, SlidersHorizontal, MapPin, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAcceptedPartners } from '@/hooks/useAgentNetwork';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';

type Property = Tables<'properties'>;
type PropertyType = 'house' | 'apartment' | 'townhouse' | 'land' | 'commercial' | 'rural';
type ListingType = 'sale' | 'rent';

const propertyTypeOptions: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment & Unit' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'rural', label: 'Rural' },
];

const bedroomOptions = [
  { value: 'any', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
];

const bathroomOptions = [
  { value: 'any', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
];

const parkingOptions = [
  { value: 'any', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
];

const priceOptions = [
  { value: 'any', label: 'Any' },
  { value: '200000', label: '$200,000' },
  { value: '300000', label: '$300,000' },
  { value: '400000', label: '$400,000' },
  { value: '500000', label: '$500,000' },
  { value: '600000', label: '$600,000' },
  { value: '750000', label: '$750,000' },
  { value: '1000000', label: '$1,000,000' },
  { value: '1250000', label: '$1,250,000' },
  { value: '1500000', label: '$1,500,000' },
  { value: '2000000', label: '$2,000,000' },
  { value: '3000000', label: '$3,000,000' },
  { value: '5000000', label: '$5,000,000' },
];

interface Filters {
  location: string;
  listingType: ListingType;
  propertyTypes: PropertyType[];
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
}

const defaultFilters: Filters = {
  location: '',
  listingType: 'sale',
  propertyTypes: [],
  minPrice: 'any',
  maxPrice: 'any',
  bedrooms: 'any',
  bathrooms: 'any',
  parking: 'any',
};

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showMoreTypes, setShowMoreTypes] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Get partner agent IDs
  const { data: partnerIds = [] } = useAcceptedPartners();

  // Initialize filters from URL params
  useEffect(() => {
    const location = searchParams.get('location') || '';
    const listingType = (searchParams.get('listingType') as ListingType) || 'sale';
    const propertyTypes = searchParams.get('propertyTypes')?.split(',').filter(Boolean) as PropertyType[] || [];
    const minPrice = searchParams.get('minPrice') || 'any';
    const maxPrice = searchParams.get('maxPrice') || 'any';
    const bedrooms = searchParams.get('bedrooms') || 'any';
    const bathrooms = searchParams.get('bathrooms') || 'any';
    const parking = searchParams.get('parking') || 'any';

    setFilters({
      location,
      listingType,
      propertyTypes,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      parking,
    });
  }, []);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.location) count++;
    if (filters.propertyTypes.length > 0) count++;
    if (filters.minPrice !== 'any') count++;
    if (filters.maxPrice !== 'any') count++;
    if (filters.bedrooms !== 'any') count++;
    if (filters.bathrooms !== 'any') count++;
    if (filters.parking !== 'any') count++;
    setActiveFiltersCount(count);
  }, [filters]);

  // Update URL when filters change
  const updateUrlParams = (newFilters: Filters) => {
    const params = new URLSearchParams();
    if (newFilters.location) params.set('location', newFilters.location);
    if (newFilters.listingType !== 'sale') params.set('listingType', newFilters.listingType);
    if (newFilters.propertyTypes.length > 0) params.set('propertyTypes', newFilters.propertyTypes.join(','));
    if (newFilters.minPrice !== 'any') params.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice !== 'any') params.set('maxPrice', newFilters.maxPrice);
    if (newFilters.bedrooms !== 'any') params.set('bedrooms', newFilters.bedrooms);
    if (newFilters.bathrooms !== 'any') params.set('bathrooms', newFilters.bathrooms);
    if (newFilters.parking !== 'any') params.set('parking', newFilters.parking);
    setSearchParams(params);
  };

  const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const handlePropertyTypeToggle = (type: PropertyType) => {
    const newTypes = filters.propertyTypes.includes(type)
      ? filters.propertyTypes.filter(t => t !== type)
      : [...filters.propertyTypes, type];
    handleFilterChange('propertyTypes', newTypes);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setSearchParams(new URLSearchParams());
  };

  // Fetch active properties from the database
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['browse-properties', partnerIds],
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

  // Fetch upcoming inspections for all properties
  const { data: inspectionsData = [] } = useQuery({
    queryKey: ['browse-inspections'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('inspections')
        .select('id, property_id, date_time')
        .eq('status', 'scheduled')
        .gte('date_time', now)
        .order('date_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Create a map of property_id to next upcoming inspection
  const propertyInspectionMap = useMemo(() => {
    const map = new Map<string, { date: Date; formatted: string }>();
    
    inspectionsData.forEach((inspection) => {
      // Only keep the first (earliest) inspection per property
      if (!map.has(inspection.property_id)) {
        const date = new Date(inspection.date_time);
        let formatted: string;
        
        if (isToday(date)) {
          formatted = `Today ${format(date, 'h:mm a')}`;
        } else if (isTomorrow(date)) {
          formatted = `Tomorrow ${format(date, 'h:mm a')}`;
        } else if (isThisWeek(date)) {
          formatted = format(date, 'EEE h:mm a');
        } else {
          formatted = format(date, 'EEE d MMM, h:mm a');
        }
        
        map.set(inspection.property_id, { date, formatted });
      }
    });
    
    return map;
  }, [inspectionsData]);
  
  // Create a set of partner agent IDs for quick lookup
  const partnerAgentIds = useMemo(() => new Set(partnerIds), [partnerIds]);
  
  // Check if a property belongs to a partner
  const isPartnerProperty = (property: Property) => partnerAgentIds.has(property.agent_id);

  const filteredProperties = properties.filter(property => {
    // Location filter
    if (filters.location) {
      const searchTerm = filters.location.toLowerCase();
      const matchesLocation = 
        property.title.toLowerCase().includes(searchTerm) ||
        property.suburb.toLowerCase().includes(searchTerm) ||
        property.address.toLowerCase().includes(searchTerm) ||
        property.postcode.toLowerCase().includes(searchTerm) ||
        property.state.toLowerCase().includes(searchTerm);
      if (!matchesLocation) return false;
    }

    // Listing type filter
    if (property.listing_type !== filters.listingType) return false;

    // Property type filter
    if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(property.property_type)) {
      return false;
    }

    // Price filters
    const price = property.price || property.price_from || 0;
    if (filters.minPrice !== 'any' && price < parseInt(filters.minPrice)) return false;
    if (filters.maxPrice !== 'any' && price > parseInt(filters.maxPrice)) return false;

    // Bedroom filter
    if (filters.bedrooms !== 'any' && (property.bedrooms || 0) < parseInt(filters.bedrooms)) return false;

    // Bathroom filter
    if (filters.bathrooms !== 'any' && (property.bathrooms || 0) < parseInt(filters.bathrooms)) return false;

    // Parking filter
    if (filters.parking !== 'any' && (property.parking || 0) < parseInt(filters.parking)) return false;

    return true;
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
    propertyType: property.property_type as PropertyType,
    listingType: property.listing_type as ListingType,
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

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Listing Type Tabs */}
      <div className="flex border-b border-border/50">
        <button
          onClick={() => handleFilterChange('listingType', 'sale')}
          className={`flex-1 py-3 text-sm font-medium font-body border-b-2 transition-colors ${
            filters.listingType === 'sale'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => handleFilterChange('listingType', 'rent')}
          className={`flex-1 py-3 text-sm font-medium font-body border-b-2 transition-colors ${
            filters.listingType === 'rent'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Rent
        </button>
      </div>

      {/* Property Type */}
      <div>
        <h4 className="font-display font-semibold text-sm mb-3">Property type</h4>
        <div className="grid grid-cols-2 gap-2">
          {propertyTypeOptions.slice(0, showMoreTypes ? undefined : 4).map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={type.value}
                checked={filters.propertyTypes.includes(type.value)}
                onCheckedChange={() => handlePropertyTypeToggle(type.value)}
              />
              <Label htmlFor={type.value} className="text-sm cursor-pointer">
                {type.label}
              </Label>
            </div>
          ))}
        </div>
        {propertyTypeOptions.length > 4 && (
          <button
            onClick={() => setShowMoreTypes(!showMoreTypes)}
            className="text-sm text-primary mt-2 flex items-center gap-1 hover:underline font-body"
          >
            {showMoreTypes ? 'Show less' : 'Show more'}
            {showMoreTypes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Price */}
      <div>
        <h4 className="font-display font-semibold text-sm mb-3">Price</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Min</Label>
            <Select value={filters.minPrice} onValueChange={(v) => handleFilterChange('minPrice', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {priceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Max</Label>
            <Select value={filters.maxPrice} onValueChange={(v) => handleFilterChange('maxPrice', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {priceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <h4 className="font-display font-semibold text-sm mb-3">Bedrooms</h4>
        <Select value={filters.bedrooms} onValueChange={(v) => handleFilterChange('bedrooms', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {bedroomOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bathrooms */}
      <div>
        <h4 className="font-display font-semibold text-sm mb-3">Bathrooms</h4>
        <Select value={filters.bathrooms} onValueChange={(v) => handleFilterChange('bathrooms', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {bathroomOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Car Spaces */}
      <div>
        <h4 className="font-display font-semibold text-sm mb-3">Car spaces</h4>
        <Select value={filters.parking} onValueChange={(v) => handleFilterChange('parking', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {parkingOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearFilters}
          className="text-sm text-primary hover:underline font-body"
        >
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <BuyerLayout>
      <div className="container px-4 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            {filters.listingType === 'rent' ? 'Properties for Rent' : 'Properties for Sale'}
          </h1>
          <p className="text-muted-foreground text-sm font-body">
            {filters.location 
              ? `Searching in "${filters.location}"`
              : 'Find your perfect home from our curated listings'}
          </p>
        </div>

        <div className="flex gap-6">
          {/* Desktop Filter Panel */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-5 shadow-lg">
              <h3 className="font-display font-semibold mb-4 text-foreground">Filters</h3>
              <FilterPanel />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search suburb, postcode or address..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              
              {/* Mobile Filter Button */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-12 lg:hidden relative border-border/50"
                  >
                    <SlidersHorizontal className="w-5 h-5 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto bg-background border-border/50">
                  <SheetHeader>
                    <SheetTitle className="font-display">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                  <SheetFooter className="mt-6">
                    <Button onClick={() => setShowFilters(false)} className="w-full">
                      Show {filteredProperties.length} results
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active Filter Pills */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.propertyTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handlePropertyTypeToggle(type)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm"
                  >
                    {propertyTypeOptions.find(t => t.value === type)?.label}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                {filters.minPrice !== 'any' && (
                  <button
                    onClick={() => handleFilterChange('minPrice', 'any')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm"
                  >
                    Min: ${parseInt(filters.minPrice).toLocaleString()}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {filters.maxPrice !== 'any' && (
                  <button
                    onClick={() => handleFilterChange('maxPrice', 'any')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm"
                  >
                    Max: ${parseInt(filters.maxPrice).toLocaleString()}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {filters.bedrooms !== 'any' && (
                  <button
                    onClick={() => handleFilterChange('bedrooms', 'any')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm"
                  >
                    {filters.bedrooms}+ beds
                    <X className="w-3 h-3" />
                  </button>
                )}
                {filters.bathrooms !== 'any' && (
                  <button
                    onClick={() => handleFilterChange('bathrooms', 'any')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm"
                  >
                    {filters.bathrooms}+ baths
                    <X className="w-3 h-3" />
                  </button>
                )}
                {filters.parking !== 'any' && (
                  <button
                    onClick={() => handleFilterChange('parking', 'any')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm"
                  >
                    {filters.parking}+ parking
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={clearFilters}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Loading...' : `${filteredProperties.length} properties found`}
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Property Grid */}
            {!isLoading && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredProperties.map((property, index) => (
                  <div key={property.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <PropertyCard 
                      property={mapPropertyForCard(property)} 
                      linkPrefix="/property"
                      isPartner={isPartnerProperty(property)}
                      upcomingInspection={propertyInspectionMap.get(property.id) || null}
                    />
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
                <p className="text-muted-foreground text-sm mb-4">
                  {properties.length === 0 
                    ? 'No properties have been listed yet. Check back soon!'
                    : 'Try adjusting your search or filters'}
                </p>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}
