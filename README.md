# Meetr - Video Meeting App

A simple and beautiful video meeting application built with Next.js and LiveKit.

## Features

- HD Video Calls with automatic quality adaptation
- Group Meetings with multiple participants
- Real-time Chat using LiveKit data channels
- Screen Sharing
- Mute/Unmute microphone and camera controls
- Participants list with audio/video status indicators
- Beautiful, modern UI with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Video/Audio**: LiveKit (Cloud or self-hosted)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Chat**: LiveKit Data Channels
- **State**: React hooks

## Getting Started

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up LiveKit

1. Create a free account at [livekit.io](https://cloud.livekit.io)
2. Get your API Key, API Secret, and WebSocket URL
3. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter your name on the home page
2. Click "New Meeting" to create a new meeting
3. Share the meeting link with others to join
4. Or enter a meeting code to join an existing meeting

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home page - create/join meeting
│   ├── meeting/[code]/page.tsx     # Meeting room
│   └── api/
│       ├── meeting/route.ts        # Create meeting, generate code
│       └── token/route.ts          # Generate LiveKit access token
├── components/
│   ├── MeetingControls.tsx         # Mute/unmute, video, leave controls
│   ├── ParticipantsList.tsx        # Show all participants
│   ├── ChatPanel.tsx               # Real-time text chat
│   └── VideoGrid.tsx               # Display participant video tiles
```

## License

MIT
