# SagarSaathi

**Tagline: Where every journey feels like home**

## 1\. Project Overview

SagarSaathi is a high-trust, peer-to-peer (P2P) platform designed for **reliable, multi-day, long-distance outstation travel** in India. It connects families and groups with pre-vetted owner-drivers of large vehicles (e.g., Innova, Supro) for custom itineraries.

Unlike local taxi aggregators, the core value of SagarSaathi is built on a **Security-First Model**, powered by digital driver vetting and real-time safety features.

### Problem Solved

  * **For Passengers:** High operational risk and lack of verifiable trust when booking multi-day, outstation trips from unverified local operators.
  * **For Drivers:** Unpredictable income and low-value trip leads from local sources.

### Core MVP Features

The MVP focuses on establishing the secure authentication, driver vetting, and the GeoJSON-based real-time tracking foundation.

| Feature Category | User App (Passenger) | Driver App (Supply) |
| :--- | :--- | :--- |
| **Authentication** | Secure User Registration/Login (JWT Auth). | Secure Driver Registration/Login (JWT Auth). |
| **Vetting** | View driver's verification status (e.g., "Verified Driver"). | Mandatory Document Upload (License, RC, Permit) and Live Selfie. |
| **Core Logistics** | Custom Trip Request Form (Origin, Multi-Stops, Dates). | Real-Time Driver Availability/Location Update (GeoJSON). |
| **Safety** | Live Trip Tracking Map with shareable link. **In-App SOS Button**. | Continuous GPS Data Feed (via Socket.IO/GeoJSON). |

## 2\. Technical Stack (MERN)

This project is built using the MERN stack for maximum scalability and customizability, leveraging MongoDB's powerful GeoJSON capabilities for location data.

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend (R)** | **React** (or React Native for mobile) | User Interface for both Passenger and Driver portals. |
| **Backend (E, N)** | **Node.js** & **Express.js** | Core API logic, authentication, and handling of external API calls (BGV, Communication). |
| **Database (M)** | **MongoDB** | Data storage, crucial for handling **GeoJSON** for location querying and indexing. |
| **Real-Time** | **Socket.IO** | Enables persistent, bidirectional communication for **Live Location Tracking** and SOS alerts. |
| **Cloud** | **Firebase Storage** (or AWS S3) | Hosting for mandatory driver-uploaded documents (License, RC, etc.). |
| **External APIs** | **Exotel** (or Twilio), **Google Maps Platform** | OTP/Call Masking and Geospatial mapping/routing services. |

## 3\. Project Structure

The codebase follows a standard MERN stack structure:

```
Sagarsaathi/
├── server/               # ⇐ The Node/Express Backend (Formerly 'backend')
│   ├── config/           # Database and environment configurations
│   ├── controllers/      # Business logic for all API endpoints
│   ├── middleware/       # JWT authentication and error handling
│   ├── models/           # Mongoose schemas (User, Driver, Trip, etc.)
│   ├── routes/           # Express routers (driverRoutes, userRoutes)
│   └── server.js         # Main server entry point
└── frontend/             # ⇐ The React Frontend Application
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── pages/        # Home, Register, Login, TripRequest
    │   └── App.js
```

## 4\. Local Setup and Installation

Follow these steps to get the SagarSaathi MVP running on your local machine.

### Prerequisites

  * Node.js (v18+)
  * MongoDB (Local or MongoDB Atlas Cluster)

### 4.1. Clone the Repository

```bash
git clone [YOUR_GITHUB_REPO_URL] Sagarsaathi
cd Sagarsaathi
```

### 4.2. Environment Variables

Create a file named `.env` in the root of the **`server`** directory (`Sagarsaathi/server/.env`) and populate it with your configuration:

```
# MongoDB
MONGO_URI=your_mongodb_connection_string_here
PORT=5000

# JWT Token Secret
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=30d

# External Services (Examples)
EXOTEL_SID=your_exotel_sid
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4.3. Backend Setup & Launch

```bash
cd server
npm install
npx nodemon server.js
```

  * **Expected Output:** "MongoDB Connected Successfully" and "Sagarsaathi Backend Server running on port 5000"

### 4.4. Frontend Setup & Launch

Open a **separate terminal** window.

```bash
cd ../frontend
npm install
npm start
```

  * **Expected Output:** Application launches in your browser at `http://localhost:3000`.

http://googleusercontent.com/memory_tool_content/0
