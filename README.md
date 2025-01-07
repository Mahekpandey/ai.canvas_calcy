AI-Powered Drawing Calculator
🎨 Overview
An innovative web application that transforms hand-drawn questions into answers using AI. Users can draw mathematical equations, diagrams, or word puzzles on a digital canvas, and receive instant solutions through advanced AI processing.
✨ Key Features

Interactive Drawing Canvas

Multi-color drawing tools
Eraser functionality
Undo/Redo capabilities
One-click canvas reset


Real-time Collaboration

Create and join drawing rooms
Live cursor tracking with user identification
Real-time drawing synchronization
Shared response viewing
Active user status indicators


AI-Powered Solutions

Processes hand-drawn:

Mathematical equations
Geometric problems
Trigonometric questions
Word puzzles
Diagram-based queries


Instant AI-generated responses
Visual and textual answer format



🛠️ Technologies Used

Frontend:

React + Vite
Tailwind CSS
Socket.IO Client
Radix UI Components


Backend:

Node.js
Express
Socket.IO
Google's Gemini AI API



🚀 Getting Started
Prerequisites

Node.js (v14 or higher)
npm

Installation

Clone the repository

bashCopygit clone https://github.com/Mahekpandey/ai.canvas_calcy.git
cd ai-drawing-calculator

Install Frontend Dependencies

bashCopycd frontend
npm install

Install Backend Dependencies

bashCopycd ../backend
npm install

Set up environment variables

bashCopy# Create .env file in backend directory
GEMINI_API_KEY=your_gemini_api_key

Start the application

bashCopy# Start backend server
cd backend
npm start

# Start frontend development server (in a new terminal)
cd frontend
npm run dev
🎯 Usage

Open the application in your browser
Enter your name when prompted
Create a new room or join an existing one
Use the drawing tools to write/draw your question
Click "Calculate" to receive AI-generated answers
Use the reset button to clear the canvas for new questions

🤝 Collaborative Features

Real-time User Tracking

See other users' cursors with their names
Active/inactive status indicators
Synchronized drawing updates
Shared response viewing



🔐 Room Management

Create private rooms
Join existing rooms with room ID
Leave room functionality with confirmation
Automatic cleanup of disconnected users

🎨 Drawing Tools

Multiple color options
Eraser tool
Undo/Redo functionality
Full canvas reset
Real-time drawing sync

🤖 AI Integration

Powered by Google's Gemini AI
Processes various types of queries:

Mathematical calculations
Geometric problems
Word puzzles
Diagram interpretations
