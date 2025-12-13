import { Header, MobileNav } from '@/components/layout/MobileNav';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { mockProperties } from '@/data/mockData';
import { useState } from 'react';

export default function AgentProperties() {
  const [search, setSearch] = useState('');

  const filteredProperties = mockProperties.filter(property =>
    property.title.toLowerCase().includes(search.toLowerCase()) ||
    property.suburb.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header userRole="agent" />

      <main className="container px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Your Properties
            </h1>
            <p className="text-muted-foreground text-sm">
              {mockProperties.length} listings
            </p>
          </div>
          <Button variant="gold">
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search your listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property, index) => (
            <div key={property.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <PropertyCard property={property} linkPrefix="/agent/property" />
            </div>
          ))}
        </div>
      </main>

      <MobileNav userRole="agent" />
    </div>
  );
}
