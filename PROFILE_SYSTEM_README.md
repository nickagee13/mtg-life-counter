# Profile System Implementation Guide

## Overview
This branch (`feature/profile-system`) contains a comprehensive profile system for the MTG Life Counter app, enabling players to create persistent profiles, share them across devices, and track detailed game statistics.

## Key Features Implemented

### 1. **Profile Management**
- Create profiles with unique usernames and display names
- Auto-generated 6-character share codes (format: XXX### like BLT423)
- Profile editing and deletion
- "My Profile" designation for primary account
- Guest mode for casual play without profiles

### 2. **Share Code System**
- Unique codes using consonants + numbers (avoiding confusing characters)
- Easy profile sharing across devices
- Quick code entry with formatted input boxes
- Copy-to-clipboard functionality

### 3. **Game Integration**
- PlayerSlot component for profile selection during game setup
- Recent players list (max 10, stored locally)
- Profile badges showing win rate and games played
- Automatic profile stats updates after each game

### 4. **Statistics Tracking**
- Games played, wins, and win rate
- Commander-specific performance
- Color combination analytics
- Recent game history
- Streak tracking
- Achievement system foundation

### 5. **Local Storage Management**
- Recent players list
- My profile designation
- Session player management
- Profile caching for offline access

## Database Schema

### New Tables Created:
1. **profiles** - Player profiles with share codes
2. **games** - Enhanced game tracking
3. **game_players** - Individual player performance per game

Run the migration: `/supabase/migrations/20250920_profile_system.sql`

## File Structure

```
src/
├── lib/profiles/
│   ├── profileService.js      # Supabase CRUD operations
│   ├── codeGenerator.js       # Share code generation/validation
│   ├── statsCalculator.js     # Statistics calculations
│   └── localStorage.js        # Local storage utilities
└── components/profiles/
    ├── ProfileManager.jsx      # Main profile management UI
    ├── ProfileSetup.jsx        # Create/edit profile form
    ├── ProfileQuickAdd.jsx     # Share code entry modal
    ├── ProfileStats.jsx        # Statistics display
    └── PlayerSlot.jsx          # Game setup player slot
```

## Integration Steps

### 1. Database Setup
```sql
-- Run the migration file in Supabase SQL editor
-- Path: /supabase/migrations/20250920_profile_system.sql
```

### 2. Update Game Setup Component
```jsx
import PlayerSlot from './components/profiles/PlayerSlot';

// In your game setup, replace player input fields with:
<PlayerSlot
  index={index}
  player={player}
  onUpdate={updatePlayer}
  onRemove={removePlayer}
  existingProfiles={players.map(p => p.profile).filter(Boolean)}
  darkMode={darkMode}
/>
```

### 3. Update Game End Logic
```jsx
import { saveGameWithProfiles } from './lib/profiles/profileService';

// When game ends:
const gameData = {
  session_id: sessionId,
  winner_profile_id: winner?.profile_id,
  duration_seconds: elapsedTime,
  total_turns: currentTurn,
  format: 'commander'
};

const playersData = players.map((player, index) => ({
  profile_id: player.profile_id,
  profile: player.profile,
  name: player.name,
  commander: player.commander,
  colors: player.colors,
  starting_life: 40,
  final_life: player.life,
  placement: player.placement,
  commander_damage_dealt: calculateDamageDealt(player),
  commander_damage_received: commanderDamage[player.id],
  turns_survived: currentTurn,
  eliminations: player.eliminations || 0
}));

await saveGameWithProfiles(gameData, playersData);
```

### 4. Add Profile Manager to Navigation
```jsx
import ProfileManager from './components/profiles/ProfileManager';

// Add to your main menu:
<button onClick={() => setShowProfileManager(true)}>
  Profiles
</button>

{showProfileManager && (
  <ProfileManager
    darkMode={darkMode}
    onClose={() => setShowProfileManager(false)}
    onProfileChange={handleProfileChange}
  />
)}
```

## Testing Checklist

### Profile Creation
- [ ] Create new profile with unique username
- [ ] Verify share code is generated
- [ ] Check username availability validation
- [ ] Test profile editing
- [ ] Confirm "My Profile" designation

### Share Code System
- [ ] Enter share code manually
- [ ] Test copy/paste functionality
- [ ] Verify code format validation
- [ ] Add profile via share code
- [ ] Check duplicate prevention

### Game Integration
- [ ] Add profiles to game setup
- [ ] Use "My Profile" quick selection
- [ ] Select from recent players
- [ ] Play with guest accounts
- [ ] Mix profiles and guests in same game

### Statistics
- [ ] Verify stats update after game
- [ ] Check win rate calculation
- [ ] View commander-specific stats
- [ ] Review color performance
- [ ] Confirm recent games display

### Edge Cases
- [ ] Network failures (offline mode)
- [ ] Duplicate usernames
- [ ] Invalid share codes
- [ ] Deleted profiles
- [ ] Migration of existing data

## API Usage Examples

### Create Profile
```javascript
import { createProfile } from './lib/profiles/profileService';

const profile = await createProfile({
  username: 'player123',
  display_name: 'John Doe',
  primary_commander: 'Atraxa, Praetors\' Voice'
});
console.log('Share code:', profile.share_code);
```

### Get Profile by Share Code
```javascript
import { getProfileByShareCode } from './lib/profiles/profileService';

const profile = await getProfileByShareCode('BLT423');
```

### Update Stats After Game
```javascript
import { updateProfileStatsForGame } from './lib/profiles/profileService';

await updateProfileStatsForGame(gameId);
```

## Environment Variables
No new environment variables required. Uses existing Supabase configuration.

## Performance Considerations
- Profile caching reduces API calls
- Recent players stored locally
- Stats calculated on-demand with caching
- Optimistic updates for better UX

## Security Notes
- Row Level Security enabled on all tables
- Share codes are non-guessable (20^3 * 1000 combinations)
- No personal data exposed via share codes
- Guest players don't affect profile stats

## Future Enhancements (V2)
See `CLAUDE.md` for comprehensive V2 feature list including:
- QR code generation/scanning
- OAuth authentication
- Advanced analytics
- Achievement system
- Deck management
- Playgroup features
- Export capabilities

## Deployment
1. Merge this branch to main
2. Run database migration in production Supabase
3. Deploy to Netlify
4. Test share code system across devices

## Support
For issues or questions about the profile system implementation, refer to the inline documentation or create an issue in the repository.

---

**Branch Status**: Ready for testing and review
**Last Updated**: September 20, 2025
**Author**: Claude (Anthropic)