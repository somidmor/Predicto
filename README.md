# Predicto 🎯

A frictionless, real-time event betting platform built with React, Firebase, and TypeScript.

## Features

- **Zero Authentication Friction** - No login required. Users identified via LocalStorage UUIDs.
- **Real-Time Updates** - Live odds calculation using Firebase Realtime Database.
- **Pari-Mutuel Betting** - Fair odds based on pool distribution.
- **Bilingual Support** - English and Farsi (Persian) with RTL layout.
- **All-In Volunteering** - Contestants risk 100% of their balance for 3x rewards.
- **Beautiful UI** - Modern glass-morphism design with Framer Motion animations.

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite 7 (Build tool)
- Tailwind CSS (Styling)
- Framer Motion (Animations)
- React Router DOM (Routing)

### Backend
- Firebase Cloud Functions (Node.js 22)
- Firebase Firestore (Structured data)
- Firebase Realtime Database (Live game state)
- Firebase Hosting

## Project Structure

```
predicto/
├── src/                    # Frontend source
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React Context providers
│   ├── pages/              # Route pages
│   ├── services/           # Firebase service layer
│   ├── types/              # TypeScript types
│   └── utils/              # Utilities (i18n)
├── functions/              # Cloud Functions
│   └── src/
│       ├── controllers/    # Callable functions
│       ├── math/           # Pari-mutuel calculations
│       ├── services/       # Admin SDK wrapper
│       ├── triggers/       # Database triggers
│       └── types/          # Backend types
└── public/                 # Static assets
```

## Getting Started

### Prerequisites

- Node.js 22+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Firestore and Realtime Database enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd predicto
```

2. Install dependencies:
```bash
npm install
cd functions && npm install && cd ..
```

3. Configure Firebase:
```bash
firebase login
firebase use <your-project-id>
```

4. Create environment file:
```bash
# Create .env.local with your Firebase config
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

### Development

```bash
# Start frontend dev server
npm run dev

# In another terminal, start Firebase emulators
firebase emulators:start
```

### Deployment

```bash
# Build and deploy everything
npm run build
firebase deploy

# Or deploy separately:
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only database
```

## Game Flow

### For Hosts (Admins)

1. Click "Create Session" on the home page
2. Share the 6-character session code with players
3. Create challenges (e.g., "Push-up Contest")
4. Start the volunteer phase
5. Select contestants (manual or random)
6. Start the betting phase
7. Close betting when ready
8. Declare the winner

### For Players (Guests)

1. Enter the session code to join
2. Provide name and age to register (receive 100 Anars)
3. **Volunteer Phase**: Risk your entire balance to compete
4. **Betting Phase**: Bet on contestants with live odds
5. **Results**: Winners receive payouts based on final odds

## Key Concepts

### Identity Management (No Auth)

- **Admin**: Session creator stores `adminToken` in LocalStorage
- **Guest**: UUID generated and stored in LocalStorage
- All functions validate identity via payload, not Firebase Auth

### Pari-Mutuel Betting

Odds are calculated dynamically:
```
Coefficient = TotalPool / ContestantPool
```

If 100 Anars total are bet, with 80 on Player A and 20 on Player B:
- Player A odds: 100/80 = 1.25x
- Player B odds: 100/20 = 5.00x

### Volunteer "All-In" Mechanic

- Volunteers must stake 100% of their balance
- If selected and they win: 3x their stake
- If selected and they lose: 0 (stake forfeited)
- If not selected: stake is refunded

## API Reference

### Cloud Functions

| Function | Description |
|----------|-------------|
| `createSession` | Create a new game session |
| `joinSession` | Register a player in a session |
| `createChallenge` | Add a new challenge |
| `startVolunteerPhase` | Open volunteering |
| `volunteerForChallenge` | Lock balance as volunteer |
| `selectContestants` | Pick contestants (manual/random) |
| `startBettingPhase` | Open betting with timer |
| `placeBet` | Place a bet on a contestant |
| `closeBetting` | Lock all bets |
| `resolveChallenge` | Declare winner, process payouts |

### Database Triggers

| Trigger | Description |
|---------|-------------|
| `calculateOdds` | Recalculates odds when bets change |

## Testing

```bash
# Run backend tests
cd functions
npm test
```

## License

MIT
