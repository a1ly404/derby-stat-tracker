# Derby Stat Tracker

A modern web application for tracking roller derby statistics, built with React, TypeScript, Vite, and Supabase.

## Features

- **Player Management**: Track players, their derby names, numbers, and positions
- **Team Organization**: Manage multiple teams and their rosters
- **Bout Tracking**: Record and monitor derby bouts/games
- **Real-time Statistics**: Track detailed player performance metrics
- **User Authentication**: Secure login and user management with Supabase
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite (fast development and building)
- **Backend**: Supabase (PostgreSQL database, authentication, real-time)
- **Styling**: CSS with modern layouts and responsive design
- **Deployment**: Ready for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Setup Instructions

1. **Clone the repository**

    ```bash
    git clone https://github.com/a1ly404/derby-stat-tracker.git
    cd derby-stat-tracker
    ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Run the SQL schema from `database/schema.sql` in your Supabase SQL editor

4. **Configure environment variables**
   - Copy `.env.example` to `.env.local` and update with your Supabase credentials:

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your actual values:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5174`
   - Create an account or sign in to start tracking derby stats!

## Database Schema

The application uses the following main tables:

- **teams**: Store team information
- **players**: Player details with team associations
- **bouts**: Derby game/match records
- **player_stats**: Detailed performance statistics per player per bout

See `database/schema.sql` for the complete database structure.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

### Project Structure

```text
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── contexts/           # React contexts (if needed)
└── assets/             # Static assets
```

## Deployment

### Environment Variables for Production

⚠️ **Important**: Never commit `.env.local` to your repository! It contains secrets.

For production deployment, you need to set these environment variables in your hosting platform:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Vercel Deployment

1. **Push your code to GitHub** (without `.env.local`)

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository

3. **Add Environment Variables**
   - In Vercel dashboard: Project Settings > Environment Variables
   - Add:

     ```env
     VITE_SUPABASE_URL = your_supabase_project_url
     VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
     ```

4. **Deploy!** - Vercel will automatically build and deploy

### Netlify Deployment

1. **Push to GitHub** (without `.env.local`)

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub repository

3. **Add Environment Variables**
   - In Netlify dashboard: Site Settings > Environment Variables
   - Add the same variables as above

4. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

### Other Platforms

For other hosting platforms (Cloudflare Pages, Firebase, etc.), the process is similar:

1. Connect your GitHub repository
2. Set the environment variables in the platform's dashboard
3. Configure build command as `npm run build` with output directory `dist`

### Error Handling

If environment variables are missing in production, users will see a friendly configuration error page instead of a broken app.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you have any questions or run into issues, please open an issue on GitHub or contact the development team.
