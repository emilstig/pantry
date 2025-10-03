# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized

## 2. Set up the Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql` into the editor
3. Run the SQL to create the `pantry_items` table and related functions

## 3. Configure Environment Variables

1. In your Supabase project dashboard, go to Settings > API
2. Copy your Project URL and anon/public key
3. Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Test the Connection

1. Start your development server: `npm run dev`
2. Open the application in your browser
3. Try adding a pantry item to test the Supabase connection

## Database Schema

The `pantry_items` table has the following structure:

- `id` (UUID, Primary Key)
- `name` (TEXT, Required)
- `quantity` (DECIMAL, Required)
- `unit_quantity` (DECIMAL, Required)
- `unit_unit` (TEXT, Required, Values: 'g', 'ml', 'mg')
- `expiry` (DATE, Optional)
- `notes` (TEXT, Optional)
- `created_at` (TIMESTAMP, Auto-generated)
- `updated_at` (TIMESTAMP, Auto-updated)

## Security

- Row Level Security (RLS) is enabled
- Currently allows all operations (you can restrict this later)
- The `updated_at` column is automatically updated on record changes
