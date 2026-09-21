-- Fictional charities only. Execute after the migration in a development project.
insert into public.charities (name, slug, category, description, accent_color, featured) values
('Green Horizon Foundation', 'green-horizon', 'Climate', 'A fictional community network restoring urban green space and helping neighbourhoods care for shared places.', '#7d9c74', true),
('Bright Futures Initiative', 'bright-futures', 'Education', 'A fictional programme helping young people access mentoring, practical learning and confident next steps.', '#d7a36a', true),
('Clean Water Collective', 'clean-water', 'Environment', 'A fictional collective supporting locally led water stewardship, education and resilient public spaces.', '#75a7ac', false),
('Hope & Health Foundation', 'hope-health', 'Wellbeing', 'A fictional wellbeing fund connecting communities with practical support and welcoming social programmes.', '#bd7c8d', true),
('Community Roots Trust', 'community-roots', 'Community', 'A fictional grassroots trust backing neighbour-led projects, shared spaces and local connections.', '#a88d63', false)
on conflict (slug) do update set name = excluded.name, category = excluded.category, description = excluded.description, accent_color = excluded.accent_color, featured = excluded.featured;

-- Create demo auth users through Supabase Auth (Dashboard or Admin API), then
-- set `profiles.role = 'admin'` for the admin account. Credentials belong in
-- deployment documentation, never in this SQL seed.
