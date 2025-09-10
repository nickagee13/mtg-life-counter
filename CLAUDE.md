# MTG Life Counter - Project Overview

## What This Project Does
A responsive web application for tracking life totals and commander damage in Magic: The Gathering games. Features player setup with commander search via Scryfall API, multiple layout options for different player counts, real-time life tracking with animations, commander damage matrix, game timer, and dark/light mode support.

## Current File Structure
```
mtg-life-counter/
├── index.html                   # Main HTML entry point (moved from public/ for Vite)
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies and scripts
├── public/                     # Static assets
│   ├── favicon.ico
│   ├── manifest.json
│   └── logo192.png
├── src/
│   ├── index.jsx               # Application entry point (renamed from .js)
│   ├── App.jsx                 # Main application component (renamed from .js)
│   ├── App.css                 # Application styles
│   ├── index.css               # Global styles
│   ├── lib/
│   │   └── supabase.js         # Supabase database client
│   ├── assets/images/          # Mana color images
│   │   ├── white.jpeg
│   │   ├── blue.jpeg
│   │   ├── black.jpeg
│   │   ├── red.png
│   │   └── green.png
│   ├── Matrix-Bold.ttf         # Custom font file
│   └── windsorbtelongated.TTF  # Custom font file
├── build/                      # Vite production build output
└── node_modules/               # Dependencies
```

## Main Technologies Used

### Core Framework & Build Tools
- **React 19.1.1** - Frontend framework
- **Vite 7.1.5** - Build tool and dev server (recently migrated from Create React App)
- **@vitejs/plugin-react 5.0.2** - React plugin for Vite

### Backend & Database
- **Supabase** - Backend-as-a-Service for game data persistence
- **@supabase/supabase-js 2.56.0** - Supabase JavaScript client

### UI & Styling
- **Lucide React 0.541.0** - Modern icon library
- **Custom CSS** - Responsive design with dark/light mode
- **Custom fonts** - Matrix Bold and Windsor BT for MTG theming

### External APIs
- **Scryfall API** - For commander card search and data

### Testing (Legacy from CRA)
- **@testing-library/react 16.3.0**
- **@testing-library/jest-dom 6.8.0**
- **@testing-library/user-event 13.5.0**

## Current Focus
**Recently completed**: Successfully migrated the project from Create React App to Vite for faster development and better performance. This involved:
- Removing react-scripts dependency
- Installing Vite and React plugin
- Creating vite.config.js with port 3000 and build output to 'build' folder
- Moving index.html to project root and updating it for Vite
- Converting .js files to .jsx for proper JSX handling
- Updating package.json scripts to use Vite commands
- Verifying build and dev server functionality

## Next Steps

### Development Priorities
- [ ] **Testing Migration**: Update or remove Create React App testing setup for Vite compatibility
- [ ] **Performance Optimization**: Leverage Vite's fast refresh and optimization features
- [ ] **Code Splitting**: Implement route-based code splitting if the app grows
- [ ] **Bundle Analysis**: Use Vite's built-in bundle analyzer to optimize build size

### Feature Enhancements
- [ ] **Game History**: Display past games from Supabase database
- [ ] **Player Statistics**: Track win rates and game performance
- [ ] **Export Game Data**: Allow users to export game results
- [ ] **Improved Commander Search**: Add better filtering and card details
- [ ] **Multiplayer Layouts**: Additional layout options for 5+ players

### Technical Improvements
- [ ] **Error Boundaries**: Add React error boundaries for better error handling
- [ ] **Loading States**: Improve loading indicators throughout the app
- [ ] **Offline Support**: Add PWA features for offline gameplay
- [ ] **TypeScript Migration**: Consider migrating to TypeScript for better type safety

## Development Commands

```bash
# Development
npm start           # Start Vite dev server on http://localhost:3000
npm run dev         # Alternative dev command

# Production
npm run build       # Build for production to build/
npm run preview     # Preview production build locally

# Legacy (removed)
npm test           # Testing setup needs updating for Vite
npm run eject      # No longer available (was CRA-specific)
```

## Database Schema (Supabase)
- **games** table: Stores completed game data
- **players** table: Stores player information for each game
- Commander damage tracking stored as JSON in games table

## Notes
- Project uses custom MTG-themed fonts and styling
- Responsive design works on mobile and desktop
- Dark/light mode toggle available
- Game state persists during session but resets on page refresh
- Commander search integrates with Scryfall API for accurate card data