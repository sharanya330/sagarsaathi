# SagarSaathi 🚗🌴

**Tagline: Where every journey feels like home**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://www.mongodb.com/)

SagarSaathi is a high-trust, peer-to-peer platform designed for **reliable, multi-day, long-distance outstation travel** in India. We connect families and groups with pre-vetted owner-drivers of large vehicles for custom itineraries, with a strong focus on **safety and security**.

![SagarSaathi Logo](frontend/public/assets/logo.png)

## 🌟 Features

### For Passengers
- ✅ **Verified Drivers** - All drivers thoroughly vetted with document verification
- 📍 **Live Trip Tracking** - Real-time GPS tracking with shareable links
- 🚨 **SOS Emergency Button** - Instant alerts to support team
- 🗺️ **Custom Itineraries** - Multi-stop, multi-day trip planning
- 💰 **Transparent Pricing** - No hidden charges
- 📱 **Trip Sharing** - Share your journey with family for peace of mind

### For Drivers
- 📋 **Easy Registration** - Simple onboarding with document upload
- 💼 **Steady Income** - Access to quality long-distance trips
- 📊 **Availability Management** - Control your schedule
- ⭐ **Build Reputation** - Verified badge system
- 💳 **Lead Fee System** - Pay-to-reveal contact for qualified trips

### For Admins
- 🔐 **Driver Verification** - Review and approve driver documents
- 📱 **SOS Monitoring** - Real-time emergency trip oversight
- 📊 **Analytics Dashboard** - Track active trips and transactions
- 🚫 **Strike System** - Automated penalty for cancellations

## 🛠️ Tech Stack

### Backend
- **Node.js** 18+ with Express.js
- **MongoDB** with GeoJSON for location services
- **JWT** authentication with role-based access (user/driver/admin)
- **Mongoose** ODM with 2dsphere indexes
- **ES Modules** (type: module)

### Frontend
- **React** 18.2 (Create React App)
- **React Router** for navigation
- **Axios** for API calls
- **Socket.io Client** (ready for real-time features)
- **Responsive Design** for mobile/tablet/desktop

### Optional Integrations
- **AWS S3** - Document storage
- **Twilio** - SMS and call masking
- **Stripe** - Payment processing
- **Google Maps API** - Mapping and routing

### DevOps
- **Docker** & Docker Compose
- **PM2** process management
- **Nginx** reverse proxy
- **MongoDB Atlas** support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB running (local or Atlas)
- npm or yarn package manager

### Local Development

#### 1. Clone the Repository
```bash
git clone https://github.com/sharanya330/sagarsaathi.git
cd sagarsaathi
```

#### 2. Backend Setup
```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env with your configuration
npm run server  # Development with nodemon
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

#### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/sagarsaathi_db

# Authentication
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=30d

# Admin Access
ADMIN_EMAIL=admin@sagarsaathi.com
ADMIN_PASSWORD=your_secure_password

# Business Logic
LEAD_FEE_AMOUNT=99
PUBLIC_TRACK_TTL_HOURS=48
CANCEL_STRIKE_HOURS=24

# Frontend URL
FRONTEND_BASE_URL=http://localhost:3000

# Optional: Payment Integration
STRIPE_SECRET_KEY=sk_test_xxx

# Optional: Communication Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM=your_twilio_number

# Optional: Cloud Storage
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=sagarsaathi-documents

# Optional: Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 🐳 Docker Deployment

### Quick Deploy
```bash
# Build and start all services
docker compose -f docker-compose.simple.yml up -d --build

# View logs
docker compose -f docker-compose.simple.yml logs -f

# Stop services
docker compose -f docker-compose.simple.yml down
```

### Services Included
- **MongoDB** - Database (Port 27017)
- **Backend** - API Server (Port 5001)
- **Frontend** - React App (Port 3000)

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production deployment options.

## 📁 Project Structure

```
sagarsaathi/
├── backend/                    # Node.js/Express API
│   ├── controllers/           # Business logic
│   ├── middleware/            # Auth and validation
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routes
│   ├── services/              # External integrations
│   └── server/
│       └── server.js         # Express app entry point
├── frontend/                  # React application
│   ├── public/
│   │   └── assets/           # Logo and animations
│   └── src/
│       ├── components/       # Reusable components
│       ├── pages/           # Route pages
│       ├── context/         # Global state
│       ├── styles/          # Component CSS
│       └── App.jsx          # Main app component
├── docker-compose.yml       # Full production stack
├── docker-compose.simple.yml # Simplified deployment
├── Dockerfile               # Multi-stage backend build
├── deploy.sh               # Deployment automation script
├── ecosystem.config.js     # PM2 configuration
└── README.md               # This file
```

## 🔐 Authentication & Authorization

### Three User Roles

1. **Users (Passengers)**
   - Register and login with email/password
   - Create and manage trip requests
   - Track trips in real-time
   - Trigger SOS alerts

2. **Drivers**
   - Register with vehicle details
   - Upload verification documents
   - Accept/reject trip requests
   - Update real-time location
   - Pay lead fee to reveal contact

3. **Admins**
   - Verify driver documents
   - Monitor active trips
   - Handle SOS emergencies
   - Manage strike penalties
   - View transactions

### JWT Token Flow
- Tokens issued on successful login
- Bearer token authentication
- Role-based route protection
- Middleware: `userProtect`, `driverProtect`, `adminProtect`

## 🗺️ GeoJSON & Location Services

### MongoDB Geospatial Indexes
```javascript
// 2dsphere index on driver location
DriverSchema.index({ 'location.coordinates': '2dsphere' });

// 2dsphere index on trip pickup
TripSchema.index({ 'pickUpLocation.coords.coordinates': '2dsphere' });
```

### Location Storage Format
```javascript
{
  type: 'Point',
  coordinates: [longitude, latitude] // [77.5946, 12.9716]
}
```

### Use Cases
- Find nearby available drivers
- Calculate trip distances
- Store location history
- Enable live tracking

## 📊 Trip Lifecycle

```
REQUESTED → ACCEPTED → ON_TRIP → COMPLETED
                    ↓
                CANCELLED / SOS_ACTIVE
```

### Status Transitions
1. **REQUESTED** - User creates trip, visible to drivers
2. **ACCEPTED** - Driver accepts (lead fee paid)
3. **ON_TRIP** - Driver starts journey
4. **COMPLETED** - Driver marks trip complete
5. **CANCELLED** - User/driver cancels (strike penalty applies)
6. **SOS_ACTIVE** - Emergency alert triggered

## 🚨 Safety Features

### SOS System
- In-app emergency button
- Instant status change to `SOS_ACTIVE`
- Admin dashboard alert
- Location snapshot captured
- Support team notification

### Driver Vetting
- Document upload (license, RC, permit)
- Manual admin review
- Verified badge system
- Strike-based penalties
- Suspension after 3 strikes

### Trip Safety
- Live GPS tracking
- Public shareable links (48h TTL)
- Location history logging
- Call masking (Twilio)
- Trip completion verification

## 🧪 Testing

### Frontend Tests (Jest/React Testing Library)
```bash
cd frontend

# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=YourFileName

# Run tests matching name
npm test -- -t "Your test name"

# Coverage report
npm test -- --coverage
```

### Backend Tests
Currently not implemented. Contribution welcome!

## 📝 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Key Endpoints

#### Users
- `POST /users/register` - User registration
- `POST /users/login` - User login
- `GET /users/profile` - Get user profile (protected)

#### Drivers
- `POST /drivers/register` - Driver registration
- `POST /drivers/login` - Driver login
- `PUT /drivers/location` - Update location (protected)
- `GET /drivers/trips/requested` - View available trips

#### Trips
- `POST /trips` - Create trip request (user)
- `GET /trips/my` - Get user's trips (user)
- `GET /trips/assigned` - Get driver's trips (driver)
- `PATCH /trips/:id/accept` - Accept trip (driver)
- `PATCH /trips/:id/start` - Start trip (driver)
- `PATCH /trips/:id/end` - End trip (driver)
- `POST /trips/:id/sos` - Trigger SOS (driver)
- `GET /trips/public/:token/last_location` - Public tracking

#### Admin
- `POST /admin/login` - Admin login
- `GET /admin/drivers` - List all drivers
- `PUT /admin/drivers/:id/verify` - Verify driver
- `GET /admin/trips/active` - Active trips
- `GET /admin/trips/sos` - SOS trips

## 🎨 Branding

### Logo
- Static logo: `frontend/public/assets/logo.png`
- Animated logo: `frontend/public/assets/logo-animation.mp4`
- Splash screen displays on app launch
- Session-based (shows once per session)

### Color Palette
- Primary: `#e8a537` (Yellow/Orange)
- Secondary: `#2c3e50` (Dark Blue)
- Background: `#f5e6d3` → `#e8d4b8` (Gradient)

### Tagline
*"Where every journey feels like home"*

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Update documentation
- Test your changes
- Keep commits atomic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Sharanya
- **GitHub**: [@sharanya330](https://github.com/sharanya330)

## 📞 Support

For issues and questions:
- GitHub Issues: [sagarsaathi/issues](https://github.com/sharanya330/sagarsaathi/issues)
- Email: admin@sagarsaathi.com

## 🗺️ Roadmap

### Current Features (MVP)
- ✅ User/Driver/Admin authentication
- ✅ Trip creation and management
- ✅ Live GPS tracking
- ✅ SOS emergency system
- ✅ Driver verification
- ✅ Public trip sharing
- ✅ Lead fee payment gating
- ✅ Animated splash screen
- ✅ Docker deployment

### Planned Features
- [ ] Real-time chat between user and driver
- [ ] In-app payment integration (Stripe/Razorpay)
- [ ] Push notifications
- [ ] Driver rating system
- [ ] Trip history and analytics
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Route optimization
- [ ] Weather integration
- [ ] Referral system

## 📚 Additional Documentation

- [WARP.md](WARP.md) - AI development guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production deployment options
- [LOGO_IMPLEMENTATION.md](LOGO_IMPLEMENTATION.md) - Logo and branding guide
- [DEPLOYED.md](DEPLOYED.md) - Current deployment status

## 🙏 Acknowledgments

- Create React App for frontend scaffolding
- MongoDB for powerful geospatial features
- Express.js for robust API framework
- Docker for containerization
- ngrok for easy public URL testing

---

**Made with ❤️ for safe and comfortable travel**

*SagarSaathi - Your trusted companion for long journeys* 🚗🌴
