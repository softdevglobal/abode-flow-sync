import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useAuth } from '@/hooks/useAuth';
import { Heart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Property } from '@/types';

export default function SavedProperties() {
  const { user } = useAuth();

  const { data: savedProperties, isLoading } = useQuery({
    queryKey: ['saved-properties', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          property_id,
          created_at,
          properties (
            id,
            title,
            address,
            suburb,
            state,
            postcode,
            property_type,
            listing_type,
            status,
            price,
            price_from,
            price_to,
            price_display,
            bedrooms,
            bathrooms,
            parking,
            land_size,
            building_size,
            description,
            features,
            images,
            agent_id,
            created_at,
            updated_at
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <BuyerLayout>
        <div className="container px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-3">
              Sign in to view saved properties
            </h1>
            <p className="text-muted-foreground font-body mb-6">
              Create an account to save your favorite properties and access them anytime.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Saved Properties
          </h1>
          <p className="text-muted-foreground font-body">
            Properties you've saved for later
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : savedProperties && savedProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((favorite) => {
              const p = favorite.properties;
              if (!p) return null;
              
              // Map database property to Property type
              const property: Property = {
                id: p.id,
                agentId: p.agent_id,
                title: p.title,
                address: p.address,
                suburb: p.suburb,
                state: p.state,
                postcode: p.postcode,
                propertyType: p.property_type,
                listingType: p.listing_type,
                status: p.status,
                price: p.price ?? undefined,
                priceFrom: p.price_from ?? undefined,
                priceTo: p.price_to ?? undefined,
                priceDisplay: p.price_display ?? undefined,
                bedrooms: p.bedrooms ?? 0,
                bathrooms: p.bathrooms ?? 0,
                parking: p.parking ?? 0,
                landSize: p.land_size ?? undefined,
                buildingSize: p.building_size ?? undefined,
                description: p.description ?? '',
                features: p.features ?? [],
                images: p.images ?? ['/placeholder.svg'],
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at),
              };
              
              return (
                <PropertyCard
                  key={favorite.id}
                  property={property}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              No saved properties yet
            </h2>
            <p className="text-muted-foreground font-body mb-6 max-w-sm mx-auto">
              Browse properties and tap the heart icon to save them here for easy access.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/browse">Browse Properties</Link>
            </Button>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
