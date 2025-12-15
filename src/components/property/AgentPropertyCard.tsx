import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bed, Bath, Car, Pencil, Trash2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Property = Tables<'properties'>;

interface AgentPropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
}

const statusConfig = {
  active: { label: 'Active', variant: 'success' as const },
  pending: { label: 'Pending', variant: 'warning' as const },
  sold: { label: 'Sold', variant: 'default' as const },
  off_market: { label: 'Off Market', variant: 'secondary' as const },
};

export function AgentPropertyCard({ property, onEdit, onDelete }: AgentPropertyCardProps) {
  const status = statusConfig[property.status] || statusConfig.active;
  const mainImage = property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800';

  const formatPrice = () => {
    if (property.price_display) return property.price_display;
    if (property.price) {
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        maximumFractionDigits: 0,
      }).format(property.price);
    }
    return 'Contact Agent';
  };

  return (
    <Card variant="property" className="group overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={mainImage}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(property);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(property);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Price */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-primary-foreground font-display text-xl font-semibold">
            {formatPrice()}
          </p>
        </div>
      </div>

      <CardContent className="pt-4">
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1 mb-1">
          {property.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
          {property.address}, {property.suburb}
        </p>

        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Bed className="w-4 h-4" />
            <span className="text-sm font-medium">{property.bedrooms || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4" />
            <span className="text-sm font-medium">{property.bathrooms || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Car className="w-4 h-4" />
            <span className="text-sm font-medium">{property.parking || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
