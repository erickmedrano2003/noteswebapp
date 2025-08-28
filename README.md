CLIpp - A Terminal-Themed Notes App
A secure, full-stack notes application designed with a minimalist, terminal-inspired aesthetic. Built for developers, writers, or anyone who loves a clean, command-line interface.

Live Demo 
https://noteswebapp-hazel.vercel.app/login

Key Features
Secure User Authentication: Full registration and login functionality using JWT (JSON Web Tokens) to ensure all user notes are private and secure.

Full CRUD Operations: Users can Create, Read, Update, and Delete their notes in real-time.

Terminal-Themed UI: A sleek, dark-mode interface with a monospace font and green accents, designed to replicate the feel of a classic coding terminal.

Responsive Design: A clean and functional layout that works seamlessly on both desktop and mobile devices.

This project is a full-stack application built with the PERN stack and deployed using modern cloud services.
Frontend: React, Vite, and Tailwind CSS deployed using Vercel.
Backend: Node.js, Express.js deployed using Render.
Database: PostgreSQL deployed using Supabase.

Local Setup and Installation
To run this project on your local machine, follow these steps:

Prerequisites
Node.js (v18 or later)

PostgreSQL

1. Clone the Repository
git clone https://github.com/YourUsername/fullstack-notes-app.git
cd fullstack-notes-app

2. Backend Setup
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Connect to PostgreSQL and create the database
psql postgres
CREATE DATABASE notes_app_db;
\c notes_app_db

# Run the SQL commands in database.sql to create the tables

# Create a .env file in the /server directory and add your secrets
# (See .env.example for reference)
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/notes_app_db
JWT_SECRET=YOUR_SUPER_SECRET_KEY

# Start the backend server
node index.js

3. Frontend Setup
# In a new terminal, navigate to the client directory
cd client

# Install dependencies
npm install

# Start the frontend development server
npm run dev

The application should now be running locally at http://localhost:5173 (or a similar port).