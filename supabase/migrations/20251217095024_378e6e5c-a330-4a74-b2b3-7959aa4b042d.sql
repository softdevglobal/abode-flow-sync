-- Drop the foreign key constraint to allow sample agents for prototype
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_user_id_fkey;

-- Insert sample agents for testing the partner network
INSERT INTO agents (user_id, agency_name, theme_agency_name, bio, profile_image, license_number)
VALUES 
  (gen_random_uuid(), 'Ray White Sydney', 'Michael Thompson', 'Award-winning agent with 15 years experience in Sydney''s Eastern Suburbs. Specializing in luxury waterfront properties.', 'https://randomuser.me/api/portraits/men/32.jpg', 'REA12345'),
  (gen_random_uuid(), 'LJ Hooker Melbourne', 'Sarah Chen', 'Top performer in Melbourne CBD apartments. Known for exceptional client service and market knowledge.', 'https://randomuser.me/api/portraits/women/44.jpg', 'REA23456'),
  (gen_random_uuid(), 'McGrath Estate Agents', 'James Wilson', 'Family homes specialist in Brisbane northside. Over $500M in career sales.', 'https://randomuser.me/api/portraits/men/67.jpg', 'REA34567'),
  (gen_random_uuid(), 'Harcourts Gold', 'Emma Davis', 'First home buyer expert in Perth. Passionate about helping young Australians into the property market.', 'https://randomuser.me/api/portraits/women/28.jpg', 'REA45678'),
  (gen_random_uuid(), 'Raine & Horne', 'David Park', 'Commercial and investment property specialist in Adelaide. REIA award winner 2023.', 'https://randomuser.me/api/portraits/men/45.jpg', 'REA56789');