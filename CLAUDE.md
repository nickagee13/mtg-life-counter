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
**Recently completed**: Major UX improvements with enhanced mobile interface and streamlined interaction system:

### Latest Improvements (September 2025)
- **Polished Commander Damage Interface**: Redesigned with large, prominent +/- controls (5rem) directly on opponent cards, grey overlay on initiating player, and styled "RETURN TO GAME" button
- **Enhanced Life Change Animations**: Increased animation size to 3rem and repositioned to top-left of life totals for better visibility and cleaner layout
- **Enhanced Life Total Display**: Increased life total font size from 4.5rem to 6rem for much better visibility and readability
- **Perfected Commander Damage Logic**: Corrected swipe gesture behavior - swiping on your card shows opponent cards with intuitive +/- controls to track damage received FROM them
- **Improved Timer Visibility**: Made turn/timer display larger (1.125rem), more prominent with better styling, higher z-index for guaranteed clickability
- **Safari Mobile Compatibility**: Added Safari-specific PWA support with minimal-ui viewport, 180x180 touch icons, and startup image meta tags
- **Mobile Viewport Fix**: Replaced 100vh with 100dvh (dynamic viewport height) to prevent bottom content cutoff on mobile browsers with dynamic UI
- **Streamlined Life Counter Interface**: Removed visible +/- buttons and implemented invisible tap zones
  - Left half of player card = decrease life (-1, right-click for -5)
  - Right half of player card = increase life (+1, right-click for +5)
  - Much cleaner interface with larger, more intuitive tap targets
- **Fixed Commander Image Display**: Restored commander artwork as player card backgrounds with proper fallback to gradients
- **Enhanced Life Change Animations**: Repositioned change indicators to the left of life totals to prevent overlap
- **Active Player Visual Indicator**: Added subtle golden glowing border to highlight whose turn it is
- **Orientation-Independent 2-Player Layout**: Fixed landscape layout to remain consistent regardless of device orientation
- **Improved Commander Damage Integration**: Fixed tap zone interference with swipe gestures for seamless commander damage tracking

### Previous Major UI Redesign 
- **Simplified Game Interface**: Removed cluttered header and replaced with central settings button
- **Touch-Based Commander Damage**: Implemented swipe gestures (left/right) for tracking commander damage between players
- **Interactive Turn Management**: Made timer clickable to advance player turns
- **Central Settings Modal**: All game controls accessible through centered floating button

### Previous Migration Success
- Successfully migrated from Create React App to Vite for faster development
- Converted file structure and build configuration for Vite compatibility
- Updated all import paths and environment variables for Vite standards

## Current Session Progress (September 19, 2025)

### Session Overview: UI Polish & Game Logic Enhancement
This session focused on major UI improvements, replacing emojis with Lucide icons, timer redesign, life change animations, and implementing game over logic.

### Major Achievements Completed

#### 🎨 **UI Design Polish**
- [x] **Timer Redesign**: Complete overhaul to sleek horizontal layout
  - Removed "TURN" text, now shows clean format: `2 | 0:07`
  - Added vertical separator line between turn and timer
  - Resized to 110px × 70px rectangle for better proportions
  - Increased font size to 1.375rem for better visibility
  - Positioned in bottom-right corner for both players

- [x] **Life Total Display Enhancement**
  - Increased font size from 6rem → 7rem → 8rem → 9rem
  - Much more prominent and readable across the table
  - Enhanced player name size from 1.25rem → 1.5rem

- [x] **Life Change Animation Improvements**
  - Extended timeout from 2 seconds to 10 seconds for bigger damage
  - Fixed both JavaScript setTimeout AND CSS animation duration
  - **Smart Positioning**: Negative changes (damage) appear top-left, positive changes (healing) appear top-right
  - Better visual distinction between damage and healing

#### 🎯 **Game Logic Features**
- [x] **Player Elimination System**
  - Grey overlay with "ELIMINATED" text when player reaches 0 life
  - Covers entire player card with semi-transparent black overlay
  - Clear visual indicator of eliminated players

- [x] **Automatic Game Over Detection**
  - Monitors players in real-time during gameplay
  - Automatically detects when only 1 player remains alive
  - Shows confirmation dialog: "Game Over! [Winner] wins!"
  - Option to end game or continue playing

#### 🚀 **Icon System Standardization**
- [x] **Complete Emoji Replacement with Lucide Icons**
  - **Commander Damage**: ⚔️ → `<Swords size={16} />` with proper spacing
  - **Settings Buttons**:
    - 🌙/☀️ → `<Moon size={18} />` / `<Sun size={18} />`
    - 🔄 → `<RotateCw size={18} />`
    - 🏁 → `<X size={18} />`
  - Consistent sizing, spacing, and professional appearance

#### ⚙️ **Settings Menu Enhancement**
- [x] **Visual Improvements**
  - Settings button border changed from orange to silver for cleaner look
  - "Game Settings" title increased to 1.75rem and properly centered
  - All button text increased to 1.125rem with centered alignment
  - "RETURN TO GAME" button made more bold (font-weight: 900) and larger

- [x] **Functionality Verification**
  - Confirmed "Change Layout" preserves game state during layout switches
  - All settings properly maintain game progress

#### 🔧 **Commander Damage Interface**
- [x] **Timer Z-Index Fix**
  - Reduced timer z-index from 200 to 10
  - Ensures timer appears behind commander damage overlay (z-index: 15)
  - Clean interaction without visual interference

### Previously Completed Features
- [x] **Enhanced Timer Interface**: Made turn timer larger and more prominent
- [x] **Polished Commander Damage Interface**: Large +/- controls with grey overlay
- [x] **Enhanced Life Change Animations**: 3rem size, repositioned for clarity
- [x] **Enhanced Life Total Display**: 6rem font size for optimal readability
- [x] **Commander Damage Flow**: Intuitive swipe-to-damage interaction
- [x] **Safari PWA Compatibility**: Full mobile support with dynamic viewport
- [x] **Streamlined Life Counter Interface**: Invisible tap zones for cleaner UI

## Next Steps

### Immediate Priority (Next Session)
- [ ] **Fix Card Preview Display**: Resolve HMR/WebSocket issues preventing card icon from showing
- [ ] **Finalize Card Preview Styling**: Remove debug blue background, make subtle and polished
- [ ] **Test Card Preview Functionality**: Verify hover shows Scryfall card images properly

### Development Priorities
- [ ] **Testing Migration**: Update or remove Create React App testing setup for Vite compatibility
- [ ] **Performance Optimization**: Leverage Vite's fast refresh and optimization features
- [ ] **Code Splitting**: Implement route-based code splitting if the app grows
- [ ] **Bundle Analysis**: Use Vite's built-in bundle analyzer to optimize build size

### Feature Enhancements
- [x] **Touch-Based Commander Damage**: Swipe gestures for mobile-friendly commander damage tracking
- [x] **Simplified UI**: Central settings button with modal interface
- [x] **Interactive Turn System**: Clickable timer for turn advancement
- [x] **Streamlined Life Counter**: Invisible tap zones for cleaner interface
- [x] **Commander Image Backgrounds**: Player cards display commander artwork
- [x] **Life Change Animations**: Visual feedback for life total changes
- [x] **Active Player Highlighting**: Golden glow effect for current turn
- [x] **Orientation-Independent Layout**: Consistent 2-player landscape mode
- [x] **Enhanced Life Total Visibility**: Larger 6rem font size for better readability
- [x] **Corrected Commander Damage Flow**: Fixed swipe logic to show damage dealt TO other players
- [x] **Safari Mobile Support**: Full PWA compatibility with Safari-specific optimizations
- [x] **Dynamic Viewport Handling**: Mobile-friendly viewport using dvh units
- [x] **Enhanced Turn Timer**: Larger, more prominent timer with better clickability
- [ ] **Card Preview Feature**: Hover preview of commander cards (in progress - needs HMR fix)
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
- Responsive design works on mobile and desktop with touch gesture support
- Dark/light mode toggle available through central settings modal
- Game state persists during session but resets on page refresh
- Commander search integrates with Scryfall API for accurate card data
- Touch-optimized interface with swipe gestures for commander damage tracking
- Static layout orientations independent of device rotation for consistent gameplay
- Invisible tap zones provide cleaner interface while maintaining easy life total adjustment
- Commander artwork automatically displays as player card backgrounds when selected
- Life change animations positioned to avoid visual overlap with life totals
- Active player indicator uses subtle golden glow effect for clear turn tracking
- Enhanced life total display with 6rem font size for optimal mobile readability
- Commander damage tracking with intuitive flow: swipe your card → opponent cards show large +/- controls → track damage received FROM them
- Life change animations positioned at top-left of life totals with 3rem size for clear feedback
- Safari PWA fully compatible with proper meta tags and dynamic viewport handling