# cscHackethon-G10-LastLight-
cscHackethon-G10-LastLight 
# 🌍 LASTLIGHT

### AI-Powered Global Crisis Intelligence Platform

LASTLIGHT is a cinematic global crisis intelligence platform designed to visualize worldwide emergencies through an interactive 3D Earth.

The platform combines crisis monitoring, AI-assisted analysis, emergency response intelligence, historical replay systems, and humanitarian-focused visualization into a single immersive experience.

Built for modern emergency awareness, humanitarian coordination, and crisis intelligence.

---

## 🚀 Vision

Modern global emergencies are fragmented across thousands of sources.

LASTLIGHT aims to provide a unified crisis intelligence interface where users can:

* Monitor global disasters
* Visualize crisis locations in real time
* Understand severity and impact
* Access emergency recommendations
* Explore historical crisis evolution
* Discover nearby safe zones and resources

The platform is designed to feel like:

* NASA Mission Control
* Emergency Operations Centers
* Humanitarian Response Systems
* Modern AI Intelligence Platforms

while maintaining a hopeful and humanitarian-focused experience.

---

# ✨ Core Features

## 🌎 Interactive 3D Earth

A fully interactive Earth visualization built with React Three Fiber.

Features:

* Rotating Earth
* Atmospheric glow
* Starfield environment
* Crisis hotspots
* Severity visualization
* Smooth camera controls
* Cinematic animations

---

## 🚨 Crisis Visualization

Display global emergency events including:

* Earthquakes
* Floods
* Pandemics
* Wildfires
* Wars
* Cyber Attacks
* Climate Disasters
* Humanitarian Emergencies

Each crisis includes:

* Location
* Severity Score
* Description
* Timestamp
* AI Summary

---

## 📈 Historical Timeline

Replay previous events through a timeline interface.

Users can:

* Navigate historical crises
* Compare events over time
* Analyze crisis evolution
* Visualize severity trends

---

## 🤖 AI Analysis Layer

AI-generated summaries provide:

* Event explanations
* Impact assessments
* Risk indicators
* Emergency recommendations

Initial versions use mocked AI-generated responses.

Future versions will integrate real AI pipelines.

---

## 🛡 Safe Zone Intelligence

Provides access to:

* Shelters
* Hospitals
* Aid Centers
* Emergency Resources
* Safe Routes

Future versions will include real-time navigation support.

---

# 🏗 Architecture

## Frontend

### Technologies

* React
* TypeScript
* Tailwind CSS
* React Three Fiber
* Three.js
* Framer Motion
* Lucide React

### Structure

```txt
src/

├── components/
│   ├── Earth/
│   ├── Crisis/
│   ├── Timeline/
│   ├── UI/
│   └── Layout/
│
├── pages/
│
├── hooks/
│
├── services/
│
├── data/
│
├── store/
│
└── styles/
```

---

## Backend

### Technologies

* Node.js
* Express.js
* TypeScript
* Prisma ORM
* SQLite

### Structure

```txt
backend/

├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── schema/
│   ├── prisma/
│   └── index.ts
```

---

# 🗄 Database Schema

## Crisis

```prisma
model Crisis {
  id          String   @id @default(uuid())
  type        String
  location    String
  lat         Float
  lng         Float
  severity    Float
  description String
  createdAt   DateTime @default(now())
}
```

---

# 🎨 Design Philosophy

LASTLIGHT follows a cinematic design language.

### Principles

* Earth-first experience
* Minimal interface
* Floating glass panels
* Spatial depth
* Smooth transitions
* High contrast visuals
* Humanitarian focus

---

# 🎨 Color Palette

```txt
Background
#050816

Primary
#00E5FF

Danger
#FF3B5C

Warning
#FFC857

Safe
#2EF2A3
```

---

# 🎬 Animation System

LASTLIGHT uses three motion layers.

## Layer 1 — Planet Motion

* Earth rotation
* Camera movement
* Orbit animations

## Layer 2 — Interface Motion

* Floating panels
* Modal transitions
* Hover interactions

## Layer 3 — Environmental Motion

* Crisis pulses
* Atmospheric shimmer
* Starfield movement
* Particle effects

---

# 📡 API Endpoints

## Get All Crises

```http
GET /crises
```

---

## Get Crisis By ID

```http
GET /crises/:id
```

---

## Create Crisis

```http
POST /crises
```

---

## Delete Crisis

```http
DELETE /crises/:id
```

---

# 🔥 MVP Scope

The initial MVP focuses on:

* Interactive Earth
* Crisis Hotspots
* Crisis Details Modal
* Timeline Replay
* Mock Data
* Basic Backend API

The following features are planned for future releases:

* Realtime Crisis Feeds
* AI Agents
* Community Coordination
* Emergency Messaging
* Safe Zone Navigation
* AI Medical Assistant
* Legal Safety Assistant

---

# ⚡ Installation

## Frontend

```bash
npm install
npm run dev
```

---

## Backend

```bash
cd backend

npm install

npx prisma generate

npx prisma migrate dev

npm run dev
```

---

# 🧪 Development Roadmap

## Phase 1

Visual Foundation

* Earth Visualization
* Atmosphere
* Crisis Markers
* Timeline

---

## Phase 2

Crisis Intelligence

* Backend API
* Database Integration
* Historical Replay

---

## Phase 3

Realtime Systems

* WebSockets
* Live Updates
* Crisis Streams

---

## Phase 4

AI Intelligence

* Event Classification
* AI Summaries
* Severity Prediction

---

## Phase 5

Community Layer

* Authentication
* Profiles
* Emergency Requests
* Crisis Discussions

---

## Phase 6

Advanced Humanitarian Systems

* Safe Zones
* AI Doctor
* Legal Guidance
* Route Intelligence

---

#  Security Goals

Future versions will include:

* JWT Authentication
* Role-Based Access Control
* Audit Logging
* Rate Limiting
* Content Moderation
* DDoS Protection

Team :  
* Ehsan Ullah Erfani 68130500873
* Shikeb Mohebbi 68130500872
* Jasmin Osamman 68540460084
* Intouch Iewbandansook 68130500871

s

# 👥 Contributors

Built with a mission to create technology that improves global awareness, preparedness, and humanitarian response.

**LASTLIGHT — Illuminating Humanity's Critical Moments.**
