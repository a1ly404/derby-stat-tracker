# Planning Guide

A live roller derby scoreboard visualization that displays real-time score progression as an animated line graph, consuming data from the derby-scoreboard-api spec.

**Experience Qualities**: 
1. **Dynamic** - The graph updates smoothly in real-time as jam scores come in, creating an exciting live sports experience
2. **Clear** - Score progression is immediately readable with distinct team colors and bold typography making current scores obvious at a glance
3. **Athletic** - Bold colors, sharp contrasts, and high-energy design evoke the competitive spirit of roller derby

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused visualization tool that displays live data with real-time updates, state management for score data, and interactive controls for data input/simulation.

## Essential Features

**Live Score Graph Visualization**
- Functionality: Displays cumulative score progression over time (by jam) as two line graphs
- Purpose: Shows the competitive narrative of the match - who's ahead, comeback moments, and scoring momentum
- Trigger: Automatically updates as new jam data arrives
- Progression: Initial state loads → New jam score received → Graph animates to show new data point → Running totals update → Process repeats
- Success criteria: Graph displays smoothly with no jank, lines are clearly distinguishable, axis labels are readable

**Score Input/API Integration**
- Functionality: Poll derby-scoreboard-api endpoints to fetch live game data with configurable intervals, or accept manual jam-by-jam scoring data with period/intermission tracking
- Purpose: Display real-time match data from the API or allow manual data entry during live matches with support for half-time and period breaks
- Trigger: User enables API polling with endpoint URL, manually submits jam scores, or adds intermission markers between periods
- Progression: API URL configured → Polling enabled → Fetch game data every N seconds → Parse jams array with period data → Detect period changes → Insert intermission markers → Calculate running totals → Graph updates with visual breaks → Repeat
- Success criteria: API polls successfully, connection status displays accurately, graph updates smoothly with intermission breaks shown visually, manual input available when polling disabled, period transitions clearly marked

**Current Score Display**
- Functionality: Shows current cumulative totals for both teams prominently
- Purpose: Quick reference for current match state without analyzing the graph
- Trigger: Updates automatically with each new jam
- Progression: Score changes → Number animates/transitions → New value displayed
- Success criteria: Numbers are large, readable, and update smoothly

**Match Progress Indicator**
- Functionality: Shows current jam number and period with intermission tracking
- Purpose: Provides context for where we are in the match timeline and indicates period transitions
- Trigger: Updates with each jam submission and intermission marker
- Progression: Jam submitted → Counter increments → Display updates → Intermission added → Period increments → Visual break shown in timeline
- Success criteria: Always in sync with graph data, periods clearly indicated in timeline with visual intermission markers

**API Configuration Panel**
- Functionality: Allow users to configure API endpoint URL, polling interval, and enable/disable live polling
- Purpose: Connect to derby-scoreboard-api instances for live data feeds
- Trigger: User enters API URL and toggles polling on
- Progression: Settings panel visible → User enters endpoint → Sets polling interval → Enables polling → Connection status displays → Live data flows in
- Success criteria: Settings persist, connection indicator shows live/disconnected status, polling respects configured interval

## Edge Case Handling

- **No Data State**: Display empty graph with instructions to add first jam or enable API polling
- **Single Team Scoring**: Handle jams where only one team scores (other team gets 0)
- **Large Score Differentials**: Auto-scale Y-axis to accommodate blowout games
- **Rapid Data Entry**: Queue updates if submissions come faster than animations
- **Invalid Scores**: Validate non-negative integers, reject invalid input with toast notification
- **API Connection Failures**: Show disconnected status, display error toast, continue retrying on interval
- **Empty API Response**: Handle games with no jams gracefully
- **Malformed API Data**: Validate API response structure, show error if data doesn't match expected format
- **Period Transitions**: Automatically detect and visualize intermission breaks when period numbers change in API data
- **Multiple Intermissions**: Support multiple periods with visual breaks in the timeline for each intermission

## Design Direction

Bold, high-contrast sports aesthetic with electric energy. Think ESPN graphics meets modern data visualization - punchy colors, clean lines, and information that pops off the screen. The design should feel like you're trackside at a derby bout.

## Color Selection

High-energy sports palette with electric blues and fierce magentas representing the competing teams, set against a deep charcoal background for maximum contrast and visual impact.

- **Primary Color**: Electric Blue (oklch(0.65 0.22 240)) - Team 1's line color, energetic and bold, communicates speed and competition
- **Secondary Colors**: 
  - Hot Magenta (oklch(0.62 0.28 330)) - Team 2's line color, fierce and attention-grabbing
  - Deep Charcoal (oklch(0.15 0.01 270)) - Background, provides dramatic contrast for colored elements
  - Soft White (oklch(0.97 0.005 90)) - Primary text and axis labels
- **Accent Color**: Neon Yellow (oklch(0.88 0.19 95)) - Highlight color for current values and CTAs - Ratio with Charcoal 12.5:1 ✓
- **Foreground/Background Pairings**: 
  - Background (Deep Charcoal): Soft White text - Ratio 11.8:1 ✓
  - Electric Blue: White text - Ratio 5.2:1 ✓
  - Hot Magenta: White text - Ratio 4.8:1 ✓

## Font Selection

Strong geometric sans-serif with excellent legibility at all sizes, conveying athleticism and modern sports broadcasting.

- **Typographic Hierarchy**: 
  - H1 (Current Scores): Teko Bold/72px/tight tracking - Stadium scoreboard feel
  - H2 (Team Names): Teko SemiBold/32px/normal tracking
  - Body (Labels/Jam Numbers): Inter Medium/16px/normal tracking
  - Small (Axis Labels): Inter Regular/13px/wide tracking

## Animations

Smooth, purposeful animations reinforce the live nature of the event. Score updates should feel immediate and exciting with quick number transitions. Graph lines draw in with elastic easing to create anticipation. Avoid slow, laggy animations - everything should feel snappy and responsive like live sports coverage.

## Component Selection

- **Components**: 
  - Card - Contain the main graph visualization and API config panel with subtle shadow
  - Input - Number inputs for jam score entry and text input for API URL with validation
  - Button - Submit scores with "Add Jam" primary action style, "Add Intermission" for period breaks
  - Badge - Show current jam number, period, connection status (Live/Disconnected)
  - Separator - Divide sections cleanly
  - Switch - Toggle API polling on/off
  - Label - Form field labels for accessibility
- **Customizations**: 
  - Custom D3.js graph component for the line chart visualization with intermission markers
  - Intermission breaks shown as vertical highlighted regions with dashed borders and rotated "INTERMISSION" labels
  - Custom score display with large animated numbers
  - Custom color scheme override for team-specific elements
  - Connection status badges with green (connected) and red (disconnected) states
  - Period indicator badge showing current period number
- **States**: 
  - Buttons: Default has solid fill, hover brightens 10%, active scales 98%, disabled is muted at 50% opacity
  - Inputs: Default has subtle border, focus has 2px accent ring, error state shows red border with shake animation, disabled state when polling is active
  - Switch: Off state is muted, on state uses accent color
  - Connection badge: Green pulsing when live, red when disconnected
  - Intermission markers: Semi-transparent accent-colored vertical bands with dashed borders in the graph
- **Icon Selection**: 
  - Plus (add jam data)
  - Coffee (add intermission break)
  - Timer (jam/period indicators)
  - WifiHigh (connected status)
  - WifiSlash (disconnected status)
- **Spacing**: 
  - Outer container: p-6
  - Card padding: p-8
  - Graph margins: m-4
  - Form fields: gap-4
  - Section spacing: space-y-6
- **Mobile**: 
  - Stack score displays vertically instead of horizontal
  - Reduce graph height from 500px to 350px
  - Form inputs stack full-width
  - API config fields stack vertically
  - Font sizes scale down: H1 to 48px, H2 to 24px
  - Reduce outer padding to p-4
  - Intermission labels remain visible but scale appropriately
