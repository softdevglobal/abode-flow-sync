-- Update agent profile images to use reliable ui-avatars service
-- This generates consistent avatars from names with dark theme styling

UPDATE agents 
SET profile_image = 'https://ui-avatars.com/api/?name=Michael+Thompson&background=141414&color=f97316&size=200&bold=true&format=png'
WHERE theme_agency_name = 'Michael Thompson';

UPDATE agents 
SET profile_image = 'https://ui-avatars.com/api/?name=Sarah+Chen&background=141414&color=f97316&size=200&bold=true&format=png'
WHERE theme_agency_name = 'Sarah Chen';

UPDATE agents 
SET profile_image = 'https://ui-avatars.com/api/?name=James+Wilson&background=141414&color=f97316&size=200&bold=true&format=png'
WHERE theme_agency_name = 'James Wilson';

UPDATE agents 
SET profile_image = 'https://ui-avatars.com/api/?name=Emma+Davis&background=141414&color=f97316&size=200&bold=true&format=png'
WHERE theme_agency_name = 'Emma Davis';

UPDATE agents 
SET profile_image = 'https://ui-avatars.com/api/?name=David+Park&background=141414&color=f97316&size=200&bold=true&format=png'
WHERE theme_agency_name = 'David Park';

UPDATE agents 
SET profile_image = 'https://ui-avatars.com/api/?name=Khaled+Arabzadeh&background=141414&color=f97316&size=200&bold=true&format=png'
WHERE theme_agency_name = 'Khaled Arabzadeh';