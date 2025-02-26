This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



---------------------------

# Smart Voice Notes Organizer

![Smart Voice Notes Organizer](https://via.placeholder.com/1200x600?text=Smart+Voice+Notes+Organizer)

A modern web application that allows users to record voice notes, automatically transcribes them, uses AI to analyze and categorize the content, and organizes them into a structured format. This is an implementation of Task 2 from the technical assessment tasks.

## Features

- 🎙️ Real-time voice recording with audio preview
- 🔄 Automatic transcription using Whisper model
- 🧠 AI-powered content analysis and categorization
- 📋 Action item extraction and organization
- 🩺 **Medical notes classification with specialized sections**
- 📊 Dashboard with analytics and insights
- 🔒 Local storage for notes persistence
- 🌐 Server health monitoring

## Tech Stack

- **Frontend**:
  - Next.js 14 with App Router
  - TypeScript
  - Tailwind CSS
  - React Hooks for state management

- **Backend**:
  - Node.js Express server
  - Whisper.cpp for speech-to-text
  - FFmpeg for audio processing

## Getting Started

### Prerequisites

- Node.js 18 or newer
- pnpm (recommended package manager)
- Git
- FFmpeg installed on your system

### Installation

1. Clone this repository with your forked version:
   ```bash
   git clone https://github.com/KacperJanowski98/technical-assessment-tasks.git
   cd technical-assessment-tasks
   ```

2. Set up the Whisper server (backend):
   ```bash
   cd examples/whisper-server/server
   
   # Run model initialization script
   chmod +x model_init.sh
   ./model_init.sh
   
   # Run server initialization script
   chmod +x server_init.sh
   ./server_init.sh
   ```

3. Create and set up the Next.js app (frontend):
   ```bash
   cd voice-notes-app
   npm install
   # or
   pnpm install
   ```

4. Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_WHISPER_SERVER_URL=http://localhost:3001
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Recording Voice Notes

1. Click the microphone button to start recording
2. Speak your note clearly
3. Click the stop button when finished
4. Click "Transcribe" to process the recording
5. Wait for the AI to analyze and categorize the content

### Managing Notes

- View all your notes in the list
- Filter by category or sort by date
- Click on a note to view details
- Edit notes to add or modify action items
- Delete notes you no longer need

### Medical Notes Classification

This application features specialized support for medical notes:

1. **Automatic Detection**: Notes with medical terminology are automatically identified
2. **Section Classification**: Medical content is organized into five sections:
   - Wywiad (Medical History)
   - Badanie (Examination)
   - Diagnoza (Diagnosis)
   - Zalecenia (Recommendations)
   - Kontekst (Context)
3. **Visual Highlights**: Medical notes are visually distinct in the notes list
4. **Specialized View**: Medical notes display sections in a color-coded interface

For more details, see [MEDICAL_NOTES.md](./MEDICAL_NOTES.md)

### Dashboard

- View analytics about your notes collection
- See category distribution and trends
- Monitor action items by type and priority
- Track your productivity over time

## Project Structure

```
voice-notes-app/
├── public/
├── src/
│   ├── app/               # Next.js pages using App Router
│   ├── components/        # React components
│   │   └── MedicalNoteView.tsx  # Medical note section display
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and API clients
│   │   └── medical-classifier.ts  # Medical notes classification
│   └── types/             # TypeScript type definitions
│       └── medical.ts     # Medical note type definitions
├── .env.local             # Environment variables
├── MEDICAL_NOTES.md       # Medical classification documentation
└── next.config.js         # Next.js configuration
```

## Implementation Decisions

- **Client-side Storage**: Using localStorage for data persistence to keep the implementation simple and avoid needing a database.
- **Mock AI Analysis**: Implementing a client-side analysis function to simulate AI categorization.
- **Whisper Integration**: Using the provided whisper-server as the backend for transcription.
- **Responsive Design**: Using Tailwind CSS for a mobile-first responsive interface.
- **Medical Classification**: Implementing pattern-based classification for medical notes using the medical.ts module from the whisper-server example.

## Trade-offs and Limitations

- **Browser Compatibility**: The Web Speech API may not work in all browsers.
- **Persistence**: localStorage has size limitations and is cleared if the browser storage is cleared.
- **Transcription Accuracy**: The accuracy depends on the chosen Whisper model.
- **Security**: This implementation focuses on functionality rather than security.
- **Medical Classification**: The current keyword-based classification is simplistic and could be improved with machine learning.

## Future Improvements

With more time, I would add:
- User authentication and server-side storage
- Real AI integration for better analysis
- Export to electronic health record systems for medical notes
- Mobile app using React Native
- End-to-end encryption for sensitive data
- Improved voice recording controls and quality
- Machine learning-based classification for medical notes

## License

This project is licensed under the MIT License - see the LICENSE file for details.
