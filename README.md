QuickChat
<p align="center">
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Badge" />
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Badge" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS Badge" />
<img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js Badge" />
<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js Badge" />
<img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Badge" />
</p>

A real-time chat application built from scratch to showcase modern full-stack development skills. QuickChat provides a platform for users to connect instantly through secure and responsive messaging.

🔗 Live Demo: https://quick-chat-nolx.onrender.com/

Key Features
Real-time Messaging: Utilizes Socket.io for smooth, instant communication.

Secure Authentication: Passwords are securely hashed with bcryptjs for user privacy and security.

Media Sharing: Users can share media files to enhance the messaging experience.

Responsive UI: The frontend is built with Vite and React, styled with Tailwind CSS for a fast and adaptable interface.

User Profiles: Users can update their profiles and personal information.

Tech Stack
Frontend
Vite: Fast build tool for a modern web development experience.

React: A component-based library for building user interfaces.

Tailwind CSS: A utility-first CSS framework for rapid UI development.

React Router DOM: Manages client-side routing and navigation.

axios: A promise-based HTTP client for API requests.

socket.io-client: The client-side library for real-time communication with the backend.

react-hot-toast: A library for lightweight and accessible notifications.

Backend
Node.js: A JavaScript runtime for server-side development.

Express.js: A flexible Node.js framework for building the server and APIs.

Socket.io: Enables real-time, bidirectional communication between the client and server.

MongoDB: A NoSQL database used to handle user data, messages, and media.

Mongoose: An object data modeling (ODM) library for MongoDB.

bcryptjs: Used to securely hash and compare user passwords.

jsonwebtoken: Creates and verifies JSON Web Tokens for user authentication.

Cloudinary: A cloud service for managing media uploads.

CORS: A Node.js middleware for enabling cross-origin requests.

Dotenv: A module for loading environment variables from a .env file.

Nodemon: A development tool that automatically restarts the server on file changes.

Getting Started
Prerequisites
Node.js and npm installed on your machine.

Installation
Clone the repository:

git clone https://github.com/DPEDITS/Chat-App.git
cd Chat-App

Set up the frontend:
Navigate to the client directory and install the dependencies.

cd client
npm install

Set up the backend:
Navigate to the server directory, install the dependencies, and create a .env file for your environment variables.

cd ../server
npm install

Configure the backend environment variables:
Create a .env file in the server directory and add the following variables, replacing the placeholder values with your own:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

To enable ES module syntax (import ... from ...), make sure your package.json file in the server directory includes the following line:

{
  "type": "module"
}

Running the Application
Start the backend server:
From the server directory, run:

npm run dev

Note: This command assumes your package.json has a dev script that uses nodemon.

Start the frontend development server:
From the client directory, run:

npm run dev

This will start the Vite development server. Open your browser and navigate to the address shown in the terminal (e.g., http://localhost:5173).
