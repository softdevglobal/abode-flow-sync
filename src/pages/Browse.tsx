import { useState } from 'react';
import { Header, MobileNav } from '@/components/layout/MobileNav';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, MapPin, X } from 'lucide-react';
import { mockProperties } from '@/data/mockData';
import { PropertyType } from '@/types';

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

  const filteredProperties = mockProperties.filter(property => {
    const matchesSearch = 
      property.title.toLowerCase().includes(search.toLowerCase()) ||
      property.suburb.toLowerCase().includes(search.toLowerCase()) ||
      property.address.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = selectedType === 'all' || property.propertyType === selectedType;

    return matchesSearch && matchesType;
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
            {filteredProperties.length} properties found
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

        {/* Property Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property, index) => (
            <div key={property.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <PropertyCard property={property} linkPrefix="/property" />
            </div>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              No properties found
            </h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </main>

      <MobileNav userRole="customer" />
    </div>
  );
}
