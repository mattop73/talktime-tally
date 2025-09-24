# TalkTime Tally

A modern web application for tracking speaking time during meetings and conferences. Monitor participants, manage discussion topics, and collect questions in real-time with precision timing.

![TalkTime Tally](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)

## ✨ Features

### 🎯 Core Functionality
- **Real-time Speaker Tracking** - Monitor who's speaking and for how long
- **Meeting Management** - Create, start, pause, and end meetings
- **Participant Management** - Add/remove participants and track their speaking statistics
- **Speaking Sessions** - Track individual speaking sessions with start/stop functionality
- **Time Analytics** - View total speaking time and session counts per participant

### 📊 Advanced Features  
- **Subject Management** - Organize discussions by topics and subjects
- **Question Collection** - Gather and manage questions from participants
- **Progress Visualization** - Real-time progress bars and statistics
- **Session History** - Complete history of all speaking sessions
- **User Authentication** - Secure login with Supabase Auth

### 🎨 User Experience
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Modern UI** - Clean interface built with shadcn/ui components
- **Real-time Updates** - Live synchronization across all connected clients
- **Intuitive Controls** - Easy-to-use play/pause/stop controls
- **Visual Feedback** - Clear indicators for active speakers and session status

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for authentication and data storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/talktime-tally.git
   cd talktime-tally
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
   ```

4. **Set up Supabase database**
   
   Run the provided SQL migrations in your Supabase dashboard:
   ```bash
   # Apply migrations from supabase/migrations/
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:8080`

## 🛠️ Tech Stack

- **Frontend Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 3.4.17
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM 6.30.1
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## 📁 Project Structure

```
talktime-tally/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── ActiveMeetingView.tsx
│   │   ├── MeetingDashboard.tsx
│   │   ├── ParticipantTimer.tsx
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations
│   │   └── supabase/      # Supabase client and types
│   ├── lib/               # Utility functions
│   ├── pages/             # Page components
│   └── main.tsx           # Application entry point
├── supabase/
│   ├── migrations/        # Database migrations
│   └── config.toml       # Supabase configuration
├── public/               # Static assets
└── package.json         # Dependencies and scripts
```

## 🎮 Usage

### Creating a Meeting
1. Sign in to your account
2. Click "Create New Meeting" 
3. Enter meeting title and configure settings
4. Add participants to the meeting

### Managing Speaking Time
1. Start the meeting timer
2. Click participant names to start/stop their speaking time
3. Use play/pause controls for overall meeting control
4. View real-time statistics and progress

### Organizing Content
- **Subjects**: Add topics and discussion points
- **Questions**: Collect questions from participants
- **Analytics**: Review speaking time distribution

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Database Schema

The application uses the following main tables:
- `meetings` - Meeting information and status
- `participants` - Meeting participants and their data
- `speaking_sessions` - Individual speaking time records
- `subjects` - Discussion topics
- `questions` - Collected questions

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Railway Deployment

This project is configured for easy deployment on Railway:

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Set Environment Variables** in Railway dashboard:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon key
   - `VITE_SUPABASE_PROJECT_ID` - Your Supabase project ID

3. **Deploy**: Railway will automatically detect the configuration and deploy

The project includes:
- `railway.json` - Railway-specific build configuration (Dockerfile-based)
- `Dockerfile` - Custom Docker build for better cache control
- `nixpacks.toml` - Alternative build environment specification
- `.dockerignore` - Prevents unnecessary files from being copied

### Troubleshooting Railway Deployment

If you encounter cache-related build errors:

1. **Option 1**: The project uses a custom Dockerfile by default
2. **Option 2**: If Dockerfile fails, rename `railway-alt.json` to `railway.json` to use Nixpacks
3. **Option 3**: In Railway dashboard, try clearing the build cache and redeploy

### Local Development with Production Environment

Copy the environment variables from Railway to your local `.env` file:

```bash
cp .env.example .env
# Edit .env with your actual Supabase credentials
```

### Other Deployment Platforms

For other platforms (Vercel, Netlify, etc.), ensure environment variables are set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`  
- `VITE_SUPABASE_PROJECT_ID`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Icons by [Lucide](https://lucide.dev/)

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the [documentation](https://github.com/yourusername/talktime-tally/wiki)
- Contact the maintainers

---

Made with ❤️ for better meeting management