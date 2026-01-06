-- Create a function to seed demo properties for new agents
CREATE OR REPLACE FUNCTION public.seed_demo_properties_for_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert demo properties for the new agent
  INSERT INTO properties (agent_id, title, description, address, suburb, state, postcode, property_type, listing_type, status, price, price_from, price_to, price_display, bedrooms, bathrooms, parking, land_size, building_size, images, features)
  VALUES
    (
      NEW.id,
      'Modern Family Home with Pool',
      'Stunning 4 bedroom family home featuring open plan living, a gourmet kitchen with stone benchtops, and a sparkling in-ground pool. Perfectly positioned in a quiet cul-de-sac with easy access to schools, shops, and transport.',
      '24 Eucalyptus Drive',
      'Castle Hill',
      'NSW',
      '2154',
      'house',
      'sale',
      'active',
      1850000,
      1800000,
      1900000,
      '$1,800,000 - $1,900,000',
      4,
      2,
      2,
      650,
      280,
      ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
      ARRAY['Swimming Pool', 'Ducted Air Conditioning', 'Solar Panels', 'Double Garage', 'Alarm System', 'Built-in Wardrobes']
    ),
    (
      NEW.id,
      'Luxury Penthouse with Harbour Views',
      'Experience breathtaking harbour views from this stunning penthouse apartment. Features include floor-to-ceiling windows, a chef''s kitchen, private rooftop terrace, and secure parking for two vehicles.',
      '88 Waterfront Boulevard, Unit 2501',
      'Pyrmont',
      'NSW',
      '2009',
      'apartment',
      'sale',
      'active',
      3200000,
      3000000,
      3400000,
      'Expressions of Interest',
      3,
      2,
      2,
      NULL,
      185,
      ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'],
      ARRAY['Harbour Views', 'Rooftop Terrace', 'Concierge', 'Gym', 'Indoor Pool', 'Wine Cellar']
    ),
    (
      NEW.id,
      'Charming Renovated Townhouse',
      'Beautifully renovated townhouse in the heart of the village. This home offers a perfect blend of character and modern convenience with polished timber floors, a sun-drenched courtyard, and a designer kitchen.',
      '15 Victoria Street',
      'Paddington',
      'NSW',
      '2021',
      'townhouse',
      'sale',
      'active',
      1450000,
      1400000,
      1500000,
      '$1,400,000 - $1,500,000',
      3,
      2,
      1,
      120,
      165,
      ARRAY['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800'],
      ARRAY['Polished Timber Floors', 'Courtyard', 'Skylight', 'Gas Cooking', 'Study Nook', 'Storage']
    ),
    (
      NEW.id,
      'Investment Opportunity - Leased Apartment',
      'Solid investment in a well-maintained security building. Currently tenanted with reliable long-term tenant. Features include air conditioning, internal laundry, and undercover parking.',
      '42 Railway Parade, Unit 12',
      'Burwood',
      'NSW',
      '2134',
      'apartment',
      'sale',
      'pending',
      680000,
      650000,
      700000,
      '$650,000 - $700,000',
      2,
      1,
      1,
      NULL,
      75,
      ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800'],
      ARRAY['Air Conditioning', 'Internal Laundry', 'Security Building', 'Intercom', 'Lift Access']
    ),
    (
      NEW.id,
      'Premium Development Site',
      'Rare opportunity to acquire a prime development site with DA approved for 12 luxury apartments. North-facing aspect with existing infrastructure. All reports and plans available for serious buyers.',
      '156 Main Road',
      'Epping',
      'NSW',
      '2121',
      'land',
      'sale',
      'active',
      4500000,
      4200000,
      4800000,
      'Contact Agent',
      0,
      0,
      0,
      1200,
      NULL,
      ARRAY['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
      ARRAY['DA Approved', 'North Facing', 'Corner Block', 'Town Water', 'Sewer Connected']
    );

  RETURN NEW;
END;
$$;

-- Create trigger to seed demo properties when a new agent is created
DROP TRIGGER IF EXISTS seed_demo_properties_on_agent_create ON agents;
CREATE TRIGGER seed_demo_properties_on_agent_create
  AFTER INSERT ON agents
  FOR EACH ROW
  EXECUTE FUNCTION seed_demo_properties_for_agent();