# Smart Voice Notes Organizer - Deployment Instructions

This guide will help you deploy the Smart Voice Notes Organizer application, which consists of two parts:
1. The Whisper Server (backend)
2. The Next.js application (frontend)

## Prerequisites

- Node.js 18 or newer
- pnpm (recommended package manager)
- Git
- FFmpeg installed on your system
- A modern browser with Web Speech API support (Chrome, Firefox, Edge recommended)
- Microphone access permissions enabled in your browser

## Step 1: Set Up and Run the Whisper Server

First, we need to set up the Whisper server that handles audio transcription:

1. Navigate to the example Whisper server directory:
   ```bash
   cd examples/whisper-server/server
   ```

2. Run the model initialization script:
   ```bash
   chmod +x model_init.sh
   ./model_init.sh
   ```
   
   Follow the prompts to:
   - Select and download the Whisper model
   - Compile the whisper.cpp library

3. Run the server initialization script:
   ```bash
   chmod +x server_init.sh
   ./server_init.sh
   ```

4. Verify that the server is running by accessing:
   ```
   http://localhost:3001/health
   ```

   You should see a JSON response with server status information.

## Step 2: Configure and Run the Next.js App

Now let's set up and run the frontend application:

1. Navigate to the voice-notes-app directory:
   ```bash
   cd voice-notes-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Create a `.env.local` file with the Whisper server URL:
   ```
   NEXT_PUBLIC_WHISPER_SERVER_URL=http://localhost:3001
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Step 3: Production Deployment

For a production deployment, follow these steps:

### Whisper Server Deployment

1. Set up a server with Node.js and FFmpeg installed
2. Clone the repository and navigate to the whisper server directory
3. Run the setup scripts as described in Step 1
4. Consider using a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "whisper-server" -- start
   ```

### Next.js App Deployment

1. Build the Next.js app:
   ```bash
   npm run build
   # or
   pnpm build
   ```

2. You can deploy the app to Vercel, Netlify, or any platform that supports Next.js:

   **Vercel:**
   ```bash
   npx vercel
   ```

   **Netlify:**
   ```bash
   npx netlify deploy
   ```

   **Self-hosted:**
   ```bash
   npm start
   # or
   pnpm start
   ```

## Configuration Options

### Whisper Server

- The server listens on port 3001 by default
- Edit `src/config/whisper.ts` to change model paths and other settings

### Next.js App

- Edit `.env.local` to change the Whisper server URL
- Modify `lib/api.ts` to change API endpoints or behavior

## Usage Notes

### Voice Recording Workflow

1. Click the microphone button to start recording
2. Speak your note clearly
3. Click the stop button when finished
4. The transcription will start automatically
5. When transcription completes, the AI analysis will categorize your content

Note: Your browser will request permission to access your microphone the first time you record.

## Troubleshooting

### Common Issues

1. **Error: MediaRecorder is not supported**
   - Make sure you're using a modern browser (Chrome, Firefox, etc.)
   - HTTPS is required for media recording in production

2. **Error connecting to Whisper server**
   - Check that the server is running (`http://localhost:3001/health`)
   - Verify the URL in `.env.local` is correct
   - Ensure no firewall is blocking the connection

3. **Transcription errors**
   - Check that the model was downloaded correctly
   - Verify that FFmpeg is installed and available in the PATH
   - Check the Whisper server logs for detailed error messages
