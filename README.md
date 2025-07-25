# English Pal App

An interactive English learning application built with React and TypeScript, powered by OpenAI's GPT models.

## Features

- **Reading Practice**: Generate and read short stories for English learners
- **Translation**: Translate text from Urdu to English
- **Conversation Practice**: Interactive chat-based exercises for grammar, vocabulary, and conversation
- **Text-to-Speech**: Built-in speech synthesis for pronunciation practice
- **Speech Recognition**: Voice input support for hands-free interaction

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your OpenAI API key:
   Create a `.env` file in the root directory and add:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `VITE_OPENAI_API_KEY`: Your OpenAI API key (required)

## Technologies Used

- React 19
- TypeScript
- OpenAI API (GPT-4o-mini)
- Vite
- Lucide React (icons)
- Web Speech API (TTS and Speech Recognition)

## API Integration

The app uses OpenAI's GPT-4o-mini model for:
- Generating reading stories
- Translating text
- Creating interactive exercises
- Providing conversation feedback
- Powering chat-based learning sessions
