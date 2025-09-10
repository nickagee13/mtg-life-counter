# MTG Life Counter

A responsive web application for tracking life totals and commander damage in Magic: The Gathering games. Built with React and Vite for optimal performance.

![MTG Life Counter](https://img.shields.io/badge/Magic%20The%20Gathering-Life%20Counter-orange)
![React](https://img.shields.io/badge/React-19.1.1-blue)
![Vite](https://img.shields.io/badge/Vite-7.1.5-646CFF)

## Features

- 🧙‍♂️ **Player Setup** - Add up to 4 players with commander search via Scryfall API
- 🎯 **Life Tracking** - Real-time life total tracking with animated changes
- ⚔️ **Commander Damage** - Track 21-point commander damage between players
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop
- 🌓 **Dark/Light Mode** - Toggle between themes
- ⏱️ **Game Timer** - Track game duration
- 💾 **Game History** - Save completed games to Supabase database
- 🎲 **First Player** - Randomize who goes first
- 🔍 **Card Search** - Integrated Scryfall API for accurate commander data

## Tech Stack

- **Frontend**: React 19.1.1 with Vite 7.1.5
- **Backend**: Supabase (PostgreSQL database)
- **Styling**: Custom CSS with responsive design
- **Icons**: Lucide React
- **API**: Scryfall API for Magic card data
- **Fonts**: Custom MTG-themed typography

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nickagee13/mtg-life-counter.git
cd mtg-life-counter
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000` (or next available port).

## Available Scripts

### `npm run dev`
Starts the Vite development server with hot module replacement.

### `npm start`
Alternative command to start the development server.

### `npm run build`
Builds the app for production to the `build/` folder using Vite.

### `npm run preview`
Preview the production build locally.

## How to Use

1. **Setup Players**: Add players (1-4) and search for their commanders
2. **Choose Layout**: Select the best layout for your player count
3. **Track Life**: Use +/- buttons to adjust life totals (right-click for ±5)
4. **Commander Damage**: Click "DAMAGE" to track 21-point commander damage
5. **End Game**: Game automatically ends when players are eliminated

## Database Schema

The app uses Supabase with two main tables:

- **games**: Stores game metadata (winner, duration, turns)
- **players**: Stores player data for each game (name, commander, final life)

## Deployment

This app is optimized for deployment on:
- **Netlify** (recommended)
- **Vercel** 
- **GitHub Pages**
- Any static hosting service

Build the project with `npm run build` and deploy the `build/` folder.

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- [Scryfall API](https://scryfall.com/docs/api) for Magic card data
- [Supabase](https://supabase.com/) for backend services
- [Lucide](https://lucide.dev/) for beautiful icons
- [Vite](https://vitejs.dev/) for lightning-fast development

---

Built with ❤️ for the Magic: The Gathering community