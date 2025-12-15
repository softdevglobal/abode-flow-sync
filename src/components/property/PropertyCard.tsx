import { Property } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bed, Bath, Car, Ruler, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PropertyCardProps {
  property: Property;
  linkPrefix?: string;
  onEdit?: (property: Property) => void;
}

export function PropertyCard({ property, linkPrefix = '/property', onEdit }: PropertyCardProps) {
  const statusVariant = {
    available: 'success' as const,
    under_offer: 'warning' as const,
    sold: 'default' as const,
    leased: 'default' as const,
    off_market: 'secondary' as const,
  };

  const statusLabel = {
    available: 'Available',
    under_offer: 'Under Offer',
    sold: 'Sold',
    leased: 'Leased',
    off_market: 'Off Market',
  };

  const cardContent = (
    <Card variant="property" className="group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={statusVariant[property.status]}>
            {statusLabel[property.status]}
          </Badge>
          {property.listingType === 'rent' && (
            <Badge variant="info">For Rent</Badge>
          )}
        </div>

        {onEdit && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(property);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}

        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-primary-foreground font-display text-xl font-semibold">
            {property.priceDisplay}
          </p>
        </div>
      </div>

      <CardContent className="pt-4">
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1 mb-1">
          {property.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {property.address}, {property.suburb}
        </p>

        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Bed className="w-4 h-4" />
            <span className="text-sm font-medium">{property.bedrooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4" />
            <span className="text-sm font-medium">{property.bathrooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Car className="w-4 h-4" />
            <span className="text-sm font-medium">{property.parking}</span>
          </div>
          {property.landSize && (
            <div className="flex items-center gap-1.5">
              <Ruler className="w-4 h-4" />
              <span className="text-sm font-medium">{property.landSize}m²</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (onEdit) {
    return (
      <Link to={`${linkPrefix}/${property.id}`}>
        {cardContent}
      </Link>
    );
  }

  return (
    <Link to={`${linkPrefix}/${property.id}`}>
      {cardContent}
    </Link>
  );
}
