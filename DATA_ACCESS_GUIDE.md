# SagarSaathi - Data Access Guide

## 📊 Where Data is Stored

All application data is stored in **MongoDB** running in a Docker container.

### Database Details:
- **Container Name**: `sagarsaathi-mongodb`
- **Port**: `27017`
- **Database Name**: `sagarsaathi`
- **Username**: `admin`
- **Password**: `password123`

---

## 🔍 Method 1: Access MongoDB via Docker Container (Easiest)

### View All Collections
```bash
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
docker exec -it sagarsaathi-mongodb mongosh -u admin -p password123 --authenticationDatabase admin
```

Once inside MongoDB shell:

```javascript
// Switch to sagarsaathi database
use sagarsaathi

// List all collections (tables)
show collections

// Count documents in each collection
db.users.countDocuments()
db.drivers.countDocuments()
db.trips.countDocuments()
db.transactions.countDocuments()
```

### View All Users
```javascript
use sagarsaathi
db.users.find().pretty()
```

### View All Drivers
```javascript
use sagarsaathi
db.drivers.find().pretty()
```

### View All Trips
```javascript
use sagarsaathi
db.trips.find().pretty()
```

### View Specific User by Email
```javascript
use sagarsaathi
db.users.findOne({ email: "user@example.com" })
```

### View Trips for Specific User
```javascript
use sagarsaathi
db.trips.find({ user: ObjectId("USER_ID_HERE") }).pretty()
```

### View Active Trips
```javascript
use sagarsaathi
db.trips.find({ status: "ON_TRIP" }).pretty()
```

### View SOS Trips
```javascript
use sagarsaathi
db.trips.find({ status: "SOS_ACTIVE" }).pretty()
```

### Exit MongoDB Shell
```javascript
exit
```

---

## 🔍 Method 2: MongoDB Compass (GUI Tool)

### Install MongoDB Compass
1. Download from: https://www.mongodb.com/try/download/compass
2. Install on your Mac

### Connect to Database
1. Open MongoDB Compass
2. Connection String:
   ```
   mongodb://admin:password123@localhost:27017/sagarsaathi?authSource=admin
   ```
3. Click "Connect"

### Browse Data
- Click on `sagarsaathi` database
- Click on any collection: `users`, `drivers`, `trips`, `transactions`
- View, filter, and search documents visually

---

## 🔍 Method 3: Using mongosh (MongoDB Shell)

If you have mongosh installed locally:

```bash
mongosh "mongodb://admin:password123@localhost:27017/sagarsaathi?authSource=admin"
```

Then use same commands as Method 1.

---

## 🔍 Method 4: Via Backend API

### Check Users (requires admin token)
```bash
# Get admin token first
curl -X POST http://localhost:5001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sagarsaathi.com","password":"admin123"}'

# Use token to get data
curl http://localhost:5001/api/admin/drivers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📋 Quick Data Checks

### One-Liner Commands (Run from Terminal)

#### Count all users:
```bash
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
docker exec sagarsaathi-mongodb mongosh -u admin -p password123 --authenticationDatabase admin sagarsaathi --eval "db.users.countDocuments()"
```

#### Count all drivers:
```bash
docker exec sagarsaathi-mongodb mongosh -u admin -p password123 --authenticationDatabase admin sagarsaathi --eval "db.drivers.countDocuments()"
```

#### Count all trips:
```bash
docker exec sagarsaathi-mongodb mongosh -u admin -p password123 --authenticationDatabase admin sagarsaathi --eval "db.trips.countDocuments()"
```

#### List all user emails:
```bash
docker exec sagarsaathi-mongodb mongosh -u admin -p password123 --authenticationDatabase admin sagarsaathi --eval "db.users.find({}, {email: 1, name: 1}).forEach(printjson)"
```

#### List all driver names:
```bash
docker exec sagarsaathi-mongodb mongosh -u admin -p password123 --authenticationDatabase admin sagarsaathi --eval "db.drivers.find({}, {name: 1, email: 1, isVerified: 1}).forEach(printjson)"
```

#### View recent trips:
```bash
docker exec sagarsaathi-mongodb mongosh -u admin -p password123 --authenticationDatabase admin sagarsaathi --eval "db.trips.find().sort({createdAt: -1}).limit(5).forEach(printjson)"
```

---

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Drivers Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  password: String (hashed),
  isVerified: Boolean,
  isActive: Boolean,
  strikeCount: Number,
  documents: [
    {
      type: String,  // LICENSE, BGV_REPORT, PROFILE_PHOTO
      url: String,
      uploadedAt: Date,
      status: String  // PENDING, VERIFIED, REJECTED
    }
  ],
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  vehicleType: String,  // SEDAN, SUV, INNOVA, etc.
  capacity: Number,
  vehicleNumber: String,
  vehicleModel: String,
  availabilityRanges: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Trips Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  driver: ObjectId (ref: Driver),
  pickUpLocation: {
    name: String,
    coords: {
      type: "Point",
      coordinates: [longitude, latitude]
    }
  },
  dropOffLocation: {
    name: String,
    coords: {
      type: "Point",
      coordinates: [longitude, latitude]
    }
  },
  stops: Array,
  tripDistanceKm: Number,
  estimatedPrice: Number,
  actualPrice: Number,
  scheduledStartDate: Date,
  scheduledEndDate: Date,
  tripDurationDays: Number,
  numberOfPassengers: Number,
  vehicleType: String,
  specialRequirements: String,
  status: String,  // REQUESTED, ACCEPTED, ON_TRIP, COMPLETED, CANCELLED, SOS_ACTIVE
  cancellationReason: String,
  startTime: Date,
  endTime: Date,
  leadFeeAmount: Number,
  leadFeePaid: Boolean,
  leadFeePaidAt: Date,
  locationHistory: [
    {
      timestamp: Date,
      coords: {
        type: "Point",
        coordinates: [longitude, latitude]
      }
    }
  ],
  trackingToken: String,
  trackingTokenCreatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Transactions Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  driver: ObjectId,
  trip: ObjectId,
  amount: Number,
  type: String,  // LEAD_FEE, TRIP_PAYMENT, etc.
  status: String,
  paymentMethod: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔧 Advanced Queries

### Find Users Who Created Trips
```javascript
db.trips.aggregate([
  { $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "userDetails"
  }},
  { $unwind: "$userDetails" },
  { $project: {
      "userDetails.name": 1,
      "userDetails.email": 1,
      "pickUpLocation.name": 1,
      "status": 1,
      "createdAt": 1
  }}
])
```

### Find Verified Drivers
```javascript
db.drivers.find({ isVerified: true, isActive: true })
```

### Find Trips in Progress
```javascript
db.trips.find({ 
  status: { $in: ["ACCEPTED", "ON_TRIP"] }
}).sort({ createdAt: -1 })
```

### Find Drivers with Strikes
```javascript
db.drivers.find({ 
  strikeCount: { $gt: 0 }
}).sort({ strikeCount: -1 })
```

---

## 📥 Export Data

### Export Users to JSON
```bash
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
docker exec sagarsaathi-mongodb mongoexport \
  -u admin -p password123 --authenticationDatabase admin \
  -d sagarsaathi -c users \
  --out /tmp/users.json
  
docker cp sagarsaathi-mongodb:/tmp/users.json ./users_export.json
```

### Export All Collections
```bash
docker exec sagarsaathi-mongodb mongodump \
  -u admin -p password123 --authenticationDatabase admin \
  -d sagarsaathi \
  -o /tmp/backup

docker cp sagarsaathi-mongodb:/tmp/backup ./mongodb_backup
```

---

## 🔄 Backup & Restore

### Backup Database
```bash
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
docker exec sagarsaathi-mongodb mongodump \
  -u admin -p password123 --authenticationDatabase admin \
  -d sagarsaathi \
  -o /tmp/sagarsaathi_backup_$(date +%Y%m%d)
```

### Restore Database
```bash
docker exec sagarsaathi-mongodb mongorestore \
  -u admin -p password123 --authenticationDatabase admin \
  -d sagarsaathi \
  /tmp/sagarsaathi_backup_20241027
```

---

## 🗑️ Clear Data (Use with Caution!)

### Delete All Users
```javascript
use sagarsaathi
db.users.deleteMany({})
```

### Delete All Trips
```javascript
use sagarsaathi
db.trips.deleteMany({})
```

### Delete Specific Trip
```javascript
use sagarsaathi
db.trips.deleteOne({ _id: ObjectId("TRIP_ID_HERE") })
```

### Reset Database (Delete Everything)
```javascript
use sagarsaathi
db.dropDatabase()
```

---

## 📊 Monitor Database Size

```bash
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
docker exec sagarsaathi-mongodb mongosh \
  -u admin -p password123 --authenticationDatabase admin \
  sagarsaathi --eval "db.stats()"
```

---

## 🛠️ Troubleshooting

### Can't Connect to MongoDB?
```bash
# Check if container is running
docker ps | grep mongodb

# Check MongoDB logs
docker logs sagarsaathi-mongodb

# Restart MongoDB
docker restart sagarsaathi-mongodb
```

### Authentication Failed?
Make sure you're using:
- Username: `admin`
- Password: `password123`
- Auth Database: `admin`

### Data Not Showing?
```bash
# Check if you're in the right database
use sagarsaathi
show collections

# If collections are empty, try registering a test user via the app
```

---

## 🎯 Quick Start Commands

```bash
# Enter MongoDB shell
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
docker exec -it sagarsaathi-mongodb mongosh -u admin -p password123 --authenticationDatabase admin

# Once inside:
use sagarsaathi
show collections
db.users.find().pretty()
db.drivers.find().pretty()
db.trips.find().pretty()
exit
```

---

## 📱 Test Data Creation

Want to create test data? Use the app:
1. **Register User**: https://3fc0bd635ecd.ngrok-free.app/register
2. **Register Driver**: https://3fc0bd635ecd.ngrok-free.app/driver/register
3. **Admin Login**: https://3fc0bd635ecd.ngrok-free.app/admin/login

Then check the database to see the data!

---

## 💡 Pro Tips

1. **Use MongoDB Compass** for the easiest visual experience
2. **Pretty Print** makes data readable: `.pretty()`
3. **Limit Results** when testing: `.limit(10)`
4. **Sort by Date**: `.sort({createdAt: -1})`
5. **Count First** before fetching all: `.countDocuments()`

---

Need help? Check the MongoDB docs or ask for assistance!
