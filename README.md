# Tounge Compiler - Collaborative Real-Time Code Editor

![Tounge Compiler Preview](https://ik.imagekit.io/mtkm3escy/collab%20cide.png)

Welcome to **Tounge Compiler**, a premium, high-performance web application designed for real-time collaborative coding, communication, and immediate code execution. Designed with a striking "Neon-Dark" aesthetic and powered by an advanced multi-engine execution pipeline, it provides an unparalleled developer experience.

## ✨ Key Features

### 💻 Real-Time Collaborative Editor
- Implements **Yjs** alongside **Monaco Editor** for completely seamless, real-time code synchronization across multiple clients.
- Join dedicated "rooms" with peers to pair-program without conflict, complete with synchronized cursors and member lists.

### 🎥 WebRTC Audio & Video Integration
- Work together face-to-face via an integrated WebRTC stream within the coding room.
- Custom-built robust hook implementations request device permissions (microphone/camera) creating a fast signaling loop for low-latency peer-to-peer web streams.

### ⚡ Multi-Engine Code Execution pipeline
- Features a robust system for executing code efficiently. Uses **JDoodle Compiler API** for fast, high-performance execution.
- Contains an automated smart fallback mechanism switching smoothly to a keyless **Wandbox API** to ensure continuous availability even out of quota.
- Output is rendered nicely within a custom resizable, neon-styled terminal directly underneath the editor.

### 🤖 AI Analysis & Chat Integration
- An integrated AI helper sidebar docked on the left, assisting developers in understanding code, fixing bugs, and optimizing logic on-the-fly.

### 🎨 Premium "Neon-Dark" UI & Glassmorphism
- A stunning user interface built utilizing **TailwindCSS (v4)**.
- Features deep dark-modes contrasted by vibrant neon accents, glassmorphic dashboards, and beautiful subtle micro-animations.
- Modern Typography configuration using Google Fonts (*Poppins* for global layouts and *JetBrains Mono* for a professional terminal/monospaced editing environment).

### 🔒 Authentication & Database
- Secure user session management via **NextAuth.js** and **bcrypt**.
- Member tracking and persistence handled by **MongoDB**. 

## 🛠️ Technology Stack

- **Frontend:** Next.js 16, React 19, TailwindCSS 4, Monaco Editor 
- **Collaboration Context:** Yjs, y-monaco, y-protocols  
- **Signaling / Server:** Express.js, Socket.IO, WebRTC  
- **Database:** MongoDB (with Mongoose & @auth/mongodb-adapter)  

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB connection URI (`MONGO_URI`)

### 1. Configure Environment 
Create `.env` files in both `/client` and `/server` and specify the API keys (JDoodle client ID/Secret, NextAuth secret, and Mongo URI).

### 2. Start the Backend (Signaling Server)
Navigate to the `server` directory:
```bash
cd server
npm install
npm run dev
```

### 3. Start the Frontend Application
Navigate to the `client` directory:
```bash
cd client
npm install
npm run dev
```

The application client will now be running on `http://localhost:3000`.
