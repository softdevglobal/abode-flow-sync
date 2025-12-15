import { Check, Snowflake, Home, TreePine, Wifi, Car, Shield, Droplets } from 'lucide-react';

interface PropertyFeaturesGridProps {
  features: string[];
}

// Map features to categories and icons
const featureCategories: Record<string, { icon: React.ReactNode; features: string[] }> = {
  'Indoor': {
    icon: <Home className="w-4 h-4" />,
    features: ['Home Theatre', 'Wine Cellar', 'Home Office', 'Renovated Kitchen', 'Period Features', 'Furnished Option'],
  },
  'Climate': {
    icon: <Snowflake className="w-4 h-4" />,
    features: ['Air Conditioning', 'Gas Heating', 'Ducted Heating', 'Split System'],
  },
  'Outdoor': {
    icon: <TreePine className="w-4 h-4" />,
    features: ['Pool', 'Courtyard', 'Rooftop Terrace', 'Balcony', 'Garden'],
  },
  'Security & Parking': {
    icon: <Shield className="w-4 h-4" />,
    features: ['Concierge', 'Private Lift', 'Secure Parking', 'Intercom', 'Alarm System'],
  },
  'Utilities': {
    icon: <Wifi className="w-4 h-4" />,
    features: ['Smart Home', 'Solar Panels', 'NBN Connected', 'Water Tank'],
  },
  'Views': {
    icon: <Droplets className="w-4 h-4" />,
    features: ['Harbour Views', 'Ocean Views', 'City Views', 'Garden Views'],
  },
};

export function PropertyFeaturesGrid({ features }: PropertyFeaturesGridProps) {
  // Group features by category
  const categorizedFeatures: Record<string, string[]> = {};
  const uncategorized: string[] = [];

  features.forEach((feature) => {
    let found = false;
    for (const [category, data] of Object.entries(featureCategories)) {
      if (data.features.some((f) => f.toLowerCase() === feature.toLowerCase())) {
        if (!categorizedFeatures[category]) {
          categorizedFeatures[category] = [];
        }
        categorizedFeatures[category].push(feature);
        found = true;
        break;
      }
    }
    if (!found) {
      uncategorized.push(feature);
    }
  });

  // Add uncategorized features
  if (uncategorized.length > 0) {
    categorizedFeatures['Other Features'] = uncategorized;
  }

  const categories = Object.entries(categorizedFeatures);

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold">Property Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(([category, categoryFeatures]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-accent">
                {featureCategories[category]?.icon || <Check className="w-4 h-4" />}
              </span>
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
            </div>
            <ul className="space-y-2">
              {categoryFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
