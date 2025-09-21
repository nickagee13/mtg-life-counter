# MTG Life Counter - Project Documentation

## Project Overview
A comprehensive web application for tracking life totals and commander damage in Magic: The Gathering games. Features complete player profile management, Supabase backend integration, commander search via Scryfall API, multiple layout options, real-time life tracking with animations, commander damage matrix, game statistics tracking, and professional PWA support.

## Current File Structure (Updated September 19, 2025)
```
mtg-life-counter/
├── index.html                          # Main HTML entry point
├── vite.config.js                     # Vite configuration
├── netlify.toml                       # Netlify deployment config
├── package.json                       # Dependencies and scripts
├── CLAUDE.md                          # Project documentation
├── README.md                          # Basic project info
├── public/                            # Static assets
│   ├── favicon.ico
│   ├── manifest.json                  # PWA manifest
│   ├── sw.js                         # Service worker
│   ├── mtg-logo-192x192.png          # PWA icons
│   ├── mtg-logo-180x180.png
│   └── mtg-logo-512x512.png
├── src/
│   ├── index.jsx                     # Application entry point
│   ├── App.jsx                       # Main application component (2300+ lines)
│   ├── App.css                       # Application styles
│   ├── index.css                     # Global styles
│   ├── components/                   # React components
│   │   ├── GameCompleteScreen.jsx    # Game completion and results
│   │   ├── ProfileManager.jsx        # User profile management
│   │   └── StatsScreen.jsx           # Statistics and game history
│   ├── contexts/                     # React contexts
│   │   └── ProfileContext.jsx        # Profile state management
│   ├── lib/                          # Utility libraries
│   │   ├── supabase.js               # Supabase client setup
│   │   └── supabase-queries.js       # Database query functions
│   ├── assets/images/                # Mana color assets
│   │   ├── white.jpeg
│   │   ├── blue.jpeg
│   │   ├── black.jpeg
│   │   ├── red.png
│   │   ├── green.png
│   │   └── hotchi-motchi-logo.png
│   ├── Matrix-Bold.ttf               # MTG-themed fonts
│   ├── windsorbtelongated.TTF
│   ├── pwaUtils.js                   # PWA utilities
│   ├── reportWebVitals.js            # Performance monitoring
│   └── setupTests.js                 # Test configuration
├── build/                             # Production build output
├── .netlify/                          # Netlify deployment state
└── node_modules/                      # Dependencies
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

### Latest Major Release (September 19, 2025) - Game Completion & Stats System

#### 🏆 **Game Completion Screen**
- **Professional Winner Display**: Trophy icon with gradient background and winner announcement
- **Final Standings**: Ranked list showing all players with their final life totals and placements
- **Game Statistics**: Total turns played and game duration prominently displayed
- **Commander Damage Summary**: Shows top damage dealers with totals
- **Action Options**: Quick rematch with same players, new game setup, or view detailed stats
- **Automatic Game Saving**: Games are automatically saved to Supabase database

#### 📊 **Comprehensive Stats & History System**
- **Tabbed Interface**: Overview, By Commander, By Colors, and Records sections
- **Overview Stats**: Total games, win rate, average duration, average turns, recent games list
- **Commander Performance**: Win rates and game counts for each commander played
- **Color Analysis**: Performance breakdown by color combinations used
- **Recent Games Timeline**: Last 5 games with commanders, placements, and timing
- **Guest Mode Support**: Informative screen for users not logged in with profiles

#### 👤 **User Profile Management**
- **Profile Creation**: Username and display name registration with uniqueness validation
- **Profile Selection**: Easy switching between multiple user profiles
- **Guest Mode**: Play without account for casual sessions
- **Profile Integration**: Current profile displayed in setup screen header
- **Automatic Profile Persistence**: Last selected profile remembered across sessions

#### 🗄️ **Enhanced Database Architecture**
- **User Profiles Table**: Complete user management with stats caching
- **Enhanced Games Table**: Detailed game tracking with metadata
- **Game Participants Table**: Individual player performance per game
- **Automatic Stats Calculation**: Real-time win rates and performance metrics
- **Row Level Security**: Proper data protection and access controls
- **Migration Support**: Handles existing games during database transition

#### 🔧 **Touch Interaction Improvements**
- **Optimized 2-Player Layout**: Player 1 on right, Player 2 on left facing opposite directions
- **Enhanced Cross-Table Experience**: Perfect orientation for players sitting across from each other
- **Refined Touch Detection**: Improved swipe vs tap detection with early cancellation
- **Mobile-Optimized Gestures**: Reduced thresholds for better mobile accessibility
- **Protected Life Zones**: Life changes prevented during commander damage swipes

### Previous Major Improvements (September 2025)
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

## Current Session Progress (September 21, 2025)

### Session Overview: PlayerSlot Profile Integration & Database Constraint Fixes
This session focused on implementing the "Use My Profile" feature in PlayerSlot components and resolving critical database constraint violations that were preventing game saves. All database issues have been resolved and the profile system is now fully operational.

### Major Achievements Completed

#### 👤 **PlayerSlot Profile Integration**
- [x] **"Use My Profile" Feature Implementation**
  - Added ProfileContext integration to PlayerSlot component
  - "Use My Profile" option now appears above "Enter Share Code" in profile dropdown
  - Shows current profile's display name and username for easy identification
  - Removes need to manually enter share codes for your own profile
  - Seamless integration with existing profile selection flow

#### 🗄️ **Database Constraint Resolution**
- [x] **Games Table Format Constraint Fix**
  - Identified duplicate save operations causing constraint violations
  - Old `games` table had conflicting format constraints preventing saves
  - Created migration to properly drop and recreate `games` table with correct schema
  - Fixed format constraint to accept lowercase 'commander' value

- [x] **Eliminated Duplicate Save Logic**
  - Removed conflicting save operation from GameCompleteScreen component
  - App.jsx now handles all game saving through `saveGameWithProfiles()`
  - Eliminated race conditions between multiple save attempts
  - Fixed case-sensitivity issue: 'Commander' vs 'commander' format values

- [x] **Game Players Table Recreation**
  - Recreated `game_players` table with proper foreign key relationships
  - Fixed PostgREST relationship errors preventing stats queries
  - Restored proper table structure after CASCADE deletion
  - Added proper indexes and Row Level Security policies

#### 📊 **Statistics System Restoration**
- [x] **StatsScreen Query Fixes**
  - Fixed "column profiles.stats does not exist" database error
  - Updated profile stats query to use individual stat columns
  - Restored full statistics functionality showing game history and performance
  - Stats screen now loads properly with comprehensive game analytics

#### 🧹 **Code Cleanup & Optimization**
- [x] **Component State Management**
  - Removed unused saving/saved state variables from GameCompleteScreen
  - Cleaned up import statements and unused dependencies
  - Simplified game completion flow with single save operation
  - Added proper error handling and success messaging

## Previous Session Progress (September 20, 2025)

### Session Overview: Profile System Database Integration & Bug Fixes
This session focused on completing the profile system integration by running the database migration, fixing critical bugs in username validation, and restoring commander search functionality. All profile features are now fully operational with proper database connectivity.

### Major Achievements Completed

#### 🗄️ **Database Migration & Integration**
- [x] **Supabase Migration Executed**
  - Successfully ran complete profile system migration in production Supabase
  - Fixed SQL aggregate function error in profile stats view creation
  - Created all required tables: `profiles`, `games`, `game_players`, `profile_stats_view`
  - Verified Row Level Security policies and constraints are active

#### 🐛 **Critical Bug Fixes**
- [x] **Username Validation System Fixed**
  - Resolved "table not found" error preventing profile creation
  - Username availability checking now works correctly with real-time validation
  - Added debugging and removed after successful testing
  - Both new and existing usernames properly validated

- [x] **Profile Context Integration**
  - Updated ProfileContext to use new profile service instead of old queries
  - Fixed profile persistence between ProfileManager and game setup
  - "Select Profile" button now correctly shows selected profile display name
  - Profile selection properly updates across all components

#### 🔍 **Commander Search Restoration**
- [x] **Auto-Complete Search Functionality**
  - Restored real-time commander search using existing Scryfall API integration
  - Type-as-you-search with suggestions appearing after 2+ characters
  - Professional dropdown with commander names, types, and images
  - Click-to-select automatically fills commander data and artwork
  - Removed redundant search button in favor of seamless typing experience

#### 🎯 **Per-Turn Timer System** (Previous Session)
- [x] **Turn-Based Timer Reset**
  - Timer now resets to 0:00 at the start of each new turn
  - Overall game time tracked separately in background for statistics
  - Clicking timer advances to next player and resets turn timer
  - Turn timer shows only current player's turn duration

#### 🏗️ **Complete Profile System MVP** (Previous Session)
- [x] **Database Architecture**
  - Created comprehensive SQL migration for new profile tables
  - `profiles` table with unique usernames, display names, and share codes
  - `games` and `game_players` tables for enhanced game tracking
  - Auto-generating share code system with uniqueness constraints
  - Row Level Security for data protection

- [x] **Share Code System**
  - 6-character codes in XXX### format (e.g., "BLT423")
  - Uses consonants + numbers for easy distinction and memorability
  - Copy-to-clipboard functionality with formatted display
  - Validates share code format and prevents duplicates

#### 👥 **Profile Management Components**
- [x] **ProfileManager**: Complete profile management interface
  - Create, edit, and select profiles
  - View profile statistics and recent games
  - Set "My Profile" designation for primary account
  - Beautiful gradient UI matching app theme

- [x] **ProfileSetup**: Profile creation/editing with validation
  - Real-time username availability checking
  - Auto-generated share codes with display formatting
  - Optional primary commander field
  - Success animations and error handling

- [x] **ProfileQuickAdd**: Share code entry modal
  - Formatted 6-character input boxes (XXX-###)
  - Paste support for quick code entry
  - Recent players tab for quick selection
  - Search functionality for finding previous players

- [x] **ProfileStats**: Comprehensive statistics display
  - Overview, Commanders, and Colors tabs
  - Win rates, average placements, and game counts
  - Commander-specific performance tracking
  - Recent games timeline with detailed breakdowns

- [x] **PlayerSlot**: Game setup integration component
  - Profile selection during game setup
  - "Use My Profile" quick option
  - Recent players dropdown (last 10 used)
  - Guest mode for casual play
  - Commander search integration

#### 🔧 **Service Layer Architecture**
- [x] **profileService.js**: All Supabase CRUD operations
  - Create, read, update, delete profiles
  - Share code lookup and validation
  - Game saving with profile integration
  - Stats calculation and caching

- [x] **codeGenerator.js**: Share code utilities
  - Safe code generation avoiding inappropriate combinations
  - Format validation and parsing
  - Memorable code patterns for better UX

- [x] **statsCalculator.js**: Advanced analytics
  - Win rate calculations and trend analysis
  - Commander and color performance tracking
  - Achievement system foundation
  - Streak tracking and placement analysis

- [x] **localStorage.js**: Offline support utilities
  - Recent players list management
  - Profile caching for offline access
  - Session player state management
  - "My Profile" persistence

#### 🎮 **Game Integration**
- [x] **Enhanced Game Setup**
  - Replaced complex player setup with PlayerSlot components
  - Profile selection with share code entry
  - Recent players quick access
  - Guest mode integration
  - First player indicator preserved

- [x] **Profile-Aware Game End Logic**
  - Automatic placement calculation (1st, 2nd, 3rd, etc.)
  - Commander damage tracking integration
  - Profile statistics updates after each game
  - Guest player support (no stats tracking)

- [x] **Cross-Device Syncing**
  - Profiles stored in Supabase for universal access
  - Share codes work across any device
  - Recent players stored locally for privacy
  - Real-time stats synchronization

#### 📊 **Statistics & Analytics**
- [x] **Comprehensive Tracking**
  - Games played, wins, win rate, average placement
  - Commander-specific performance metrics
  - Color combination analysis
  - Recent games history with full details

- [x] **Performance Insights**
  - Win rate trends and improvement tracking
  - Streak analysis (current and longest)
  - Achievement system foundation
  - Average game duration and turn counts

#### 🔒 **Security & Privacy**
- [x] **Data Protection**
  - Row Level Security on all Supabase tables
  - Share codes are non-guessable and anonymous
  - Recent players stored locally for privacy
  - Guest mode doesn't affect profile data

### Previous Game Mechanics (Earlier in Session)

#### 🎮 **Enhanced Game Mechanics**
- [x] **Fixed Life Total Tap Responsiveness**
  - Removed 150ms delay from life total tap zones for immediate response
  - Simplified touch detection logic by removing pendingLifeChange state
  - Life totals now change instantly with simple taps instead of requiring long presses

- [x] **Timer Visibility Toggle**
  - Added Clock icon toggle button in game settings menu
  - Players can now hide timer display and show only turn numbers
  - Settings button text dynamically changes between "Hide Timer" and "Show Timer"
  - Preserves game state when toggling timer visibility

- [x] **Commander Damage Life Integration**
  - Commander damage now properly affects both tracking AND life totals
  - Each point of commander damage reduces life total by the same amount
  - Maintains accurate life tracking while preserving commander damage counters
  - Only applies when damage is actually being dealt (positive amounts)

- [x] **21 Commander Damage Lethal Rule**
  - Enhanced existing lethal damage detection with instant death mechanics
  - When player reaches 21 commander damage from any single opponent, they are instantly eliminated
  - Player's life is automatically set to 0 and marked as eliminated
  - Follows official MTG rules where 21 commander damage is lethal regardless of current life total

### Previous Session Achievements (September 19, 2025)

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
    - 🕐 → `<Clock size={18} />` (Timer Toggle)
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

---

## Future Features - Profile System V2

The following enhancements are planned for future iterations of the profile system:

### 🔐 **Authentication & Social**
- **QR Code Sharing**: Generate and scan QR codes for instant profile sharing
- **Friend System**: Add friends for easier profile management and game invites
- **Privacy Settings**: Control profile visibility (public/friends only/private)
- **OAuth Integration**: Sign in with Google/Discord for account recovery

### 📊 **Advanced Statistics**
- **Commander-Specific Win Rates**: Track performance with each commander
- **Elimination Order Tracking**: Record who eliminated whom and when
- **Commander Damage Analytics**: Detailed breakdown of damage dealt/received
- **Win Percentage by Starting Position**: Analyze if going first affects win rate
- **Favorite Opponents**: Track most-played-against players
- **Average Game Duration by Commander**: See which decks lead to longer games
- **Turn Count Analysis**: Track average turns survived and turns to win
- **Color Performance Matrix**: Win rates against specific color combinations

### 🏆 **Achievements & Gamification**
- **Achievement System**: Unlock badges for milestones (100 wins, perfect game, etc.)
- **Seasonal Rankings**: Monthly/quarterly leaderboards
- **Rivalry Tracking**: Head-to-head records and nemesis system
- **Streak Rewards**: Special badges for win/loss streaks
- **Commander Mastery**: Levels and rewards for playing specific commanders

### 🎯 **Deck Management**
- **Multiple Deck Links**: Store Moxfield/Archidekt/Manabox URLs
- **Deck Performance Tracking**: Stats per deck, not just commander
- **Power Level Rating**: Track and display deck power levels
- **Deck History**: Version control for deck changes over time
- **EDHREC Integration**: Pull commander data and suggestions

### 👥 **Playgroup Features**
- **Regular Groups**: Save and manage recurring playgroups
- **Group Statistics**: Overall group meta analysis
- **Schedule Games**: Plan future game sessions
- **Group Chat**: In-app messaging for playgroup coordination
- **House Rules**: Store custom rules per playgroup

### 📱 **Export & Integration**
- **Export Statistics**: Generate CSV/PDF reports
- **API Access**: Developer API for third-party integrations
- **Discord Bot**: Share game results to Discord servers
- **Stream Overlays**: OBS/StreamLabs integration for content creators

### 🎨 **Customization**
- **Profile Avatars**: Upload custom images or use commander art
- **Custom Backgrounds**: Personalized profile themes
- **Vanity URLs**: Custom profile links (e.g., /player/username)
- **Profile Badges**: Display achievements and milestones

### 📈 **Analytics Dashboard**
- **Meta Analysis**: Track local meta trends
- **Performance Graphs**: Visualize improvement over time
- **Heatmaps**: Win rate by day/time analysis
- **Predictive Stats**: ML-based win probability calculations

---

## Document Status
**Last Updated**: September 21, 2025
**Status**: ✅ Production Ready - All database issues resolved, profile system fully operational
**Branch**: `main` - PlayerSlot integration complete, database constraints fixed
**Next Review**: When significant features are added or major changes occur

---

*This documentation reflects the current state of the MTG Life Counter application as of September 21, 2025. The profile system is fully operational with all database constraint issues resolved. The "Use My Profile" feature has been successfully implemented and all game saving functionality works correctly.*

**Latest Session Accomplishments:**
- ✅ "Use My Profile" feature implemented in PlayerSlot components
- ✅ Database constraint violations completely resolved
- ✅ Eliminated duplicate save operations causing conflicts
- ✅ Fixed games table format constraint issues
- ✅ Recreated game_players table with proper relationships
- ✅ Statistics screen fully functional with game history
- ✅ Code cleanup and optimization completed
- ✅ All database tables properly structured and operational

**Ready for:** Continued feature development and enhancements