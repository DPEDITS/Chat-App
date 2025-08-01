# QuickChat

<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Badge" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Badge" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS Badge" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js Badge" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js Badge" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Badge" />
</p>

---

## Overview

**QuickChat** is a real-time chat application built from scratch to showcase modern full-stack development skills. It allows users to connect instantly through secure and responsive messaging.

🔗 Live Demo: [https://quick-chat-nolx.onrender.com/](https://quick-chat-nolx.onrender.com/)

---

## Key Features

- **Real-time Messaging:** Powered by Socket.io for smooth and instant communication.
- **Secure Authentication:** Passwords are hashed with bcryptjs to ensure user privacy.
- **Media Sharing:** Users can share media files within chats.
- **Responsive UI:** Frontend built with Vite, React, and styled using Tailwind CSS.
- **User Profiles:** Users can update their profile information seamlessly.

---

## Tech Stack

### Frontend

- **Vite** — Fast modern build tool  
- **React** — UI library  
- **Tailwind CSS** — Utility-first CSS framework  
- **React Router DOM** — Client-side routing  
- **axios** — HTTP client  
- **socket.io-client** — Real-time communication  
- **react-hot-toast** — Notifications

### Backend

- **Node.js** — JavaScript runtime  
- **Express.js** — Web server framework  
- **Socket.io** — Real-time, bidirectional communication  
- **MongoDB** — NoSQL database  
- **Mongoose** — MongoDB ODM  
- **bcryptjs** — Password hashing  
- **jsonwebtoken** — JWT authentication  
- **Cloudinary** — Media upload and management  
- **CORS** — Cross-Origin Resource Sharing middleware  
- **dotenv** — Environment variable management  
- **Nodemon** — Development server auto-restart

---

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine.

---

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/DPEDITS/Chat-App.git
cd Chat-App
```
---

### Setup Frontend

```bash
cd client
npm install
```
---
### Setup Backend
```bash
cd ../server
npm install
```
---
### Configure Environment Variables
**Create a .env file inside the server directory with the following variables (replace the placeholder values):
```bash
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```
---
### Enable ES Modules
**Ensure your package.json in the server folder includes the following to enable ES module syntax:
```bash
{
  "type": "module"
}
```
---
### Running the Application
**Start Backend Server
```bash
cd server
npm run dev
```
Note: This assumes your package.json has a dev script using nodemon.
---
### Start Frontend Server
```bash
cd ../client
npm run dev
```
Open the URL displayed in the terminal (typically http://localhost:5173) to access the app.
---
### Contribution

**Feel free to fork the project, open issues, or submit pull requests!
