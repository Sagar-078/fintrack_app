# fintrack_backend - Finance Data Processing and Access Control Backend

A Node.js/TypeScript backend for a finance dashboard system with role-based access control, financial records management, and advanced dashboard analytics.

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Development Server**: Nodemon

## Project Structure

```
src/
├── controllers/
│   ├── auth.controller.ts          # User registration & login
│   ├── user.controller.ts          # User management (admin endpoints)
│   ├── financial.controller.ts     # CRUD for financial records
│   └── dashboard.controller.ts     # Dashboard summaries & analytics
├── middleware/
│   ├── auth.middleware.ts          # JWT verification
│   └── rbac.middleware.ts          # Role-based access control
├── models/
│   ├── user.model.ts               # User schema with roles
│   └── financialRecord.model.ts    # Financial record schema
├── routes/
│   ├── auth.routes.ts              # Auth endpoints
│   ├── user.routes.ts              # User management endpoints
│   ├── financial.routes.ts         # Record CRUD endpoints
│   └── dashboard.routes.ts         # Dashboard analytics endpoints
├── utils/
│   └── constants.ts                # Application constants (roles)
├── app.ts                          # Express app configuration
└── server.ts                       # Server initialization
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas connection)
- npm or yarn

### Installation

1. **Clone/Extract the project**
   ```bash
   cd fintrack_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** in the root directory
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/fintrack
   JWT_SECRET=your_secret_key_here
   NODE_ENV=development
   ```

4. **Build TypeScript**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm run start
   ```

The API will be available at `https://fintrack-app-g6pc.onrender.com`

## User Roles and Permissions

The system supports three roles with different access levels:

### **Viewer**
- ❌ Cannot access records endpoints
- ✅ View own dashboard summary
- ❌ Cannot create/edit/delete records
- ❌ Cannot manage users

### **Analyst**
- ❌ Cannot create financial records (read-only for records per assignment)
- ✅ View records (and access insights)
- ❌ Cannot update or delete records
- ✅ View own dashboard summary
- ✅ View category breakdown & trends
- ❌ Cannot manage users

### **Admin**
- ✅ Create/view/edit/delete all records
- ✅ View all users' dashboard data
- ✅ See analytics across all users
- ✅ Full system access

## Category Model
- Categories are managed by `admin` with a dedicated collection (`Category`).
- `categoryId` references `Category` and `categoryName` resolves to category text in financial records.
- Analysts can view categories, admin can create categories.

## API Endpoints

### **Authentication**

#### Register User
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "analyst"  // Optional: viewer | analyst | admin (defaults to viewer)
}

Response (201):
{
  "message": "User registered successfully",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "analyst",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Login User
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "analyst"
  }
}

Response (403) - If account is inactive:
{
  "message": "Account is inactive. Please contact administrator."
}
```
```

### **User and Role Management** (Requires JWT token)

#### Get Current User Profile
```
GET /api/v1/users/profile/me
Authorization: Bearer <token>

Response (200):
{
  "message": "Current user profile",
  "data": {
    "id": "user_id",
    "role": "analyst"
  }
}
```

#### Get All Users (Admin Only)
```
GET /api/v1/users?page=1&limit=10
Authorization: Bearer <token>

Query Parameters:
- page: Page number (default: 1)
- limit: Users per page (default: 10)

Response (200):
{
  "message": "Users retrieved successfully",
  "data": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "analyst",
      "isActive": true,
      "createdAt": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}

Required Roles: admin
```

#### Get User By ID
```
GET /api/v1/users/:id
Authorization: Bearer <token>

Response (200): User object (without password)

Access Rules:
- Admin: Can view any user
- Regular Users: Can only view their own profile
```

#### Get User Statistics (Admin Only)
```
GET /api/v1/users/stats/overview
Authorization: Bearer <token>

Response (200):
{
  "message": "User statistics retrieved successfully",
  "data": {
    "totalUsers": 25,
    "activeUsers": 22,
    "inactiveUsers": 3,
    "roleDistribution": {
      "admin": 2,
      "analyst": 15,
      "viewer": 8
    }
  }
}

Required Roles: admin
```

#### Update User Profile
```
PUT /api/v1/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com"
}

Response (200): Updated user object (without password)

Access Rules:
- Admin: Can update any user
- Regular Users: Can only update their own profile
```

#### Change User Role (Admin Only)
```
PATCH /api/v1/users/:id/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"  // viewer | analyst | admin
}

Response (200):
{
  "message": "User role successfully changed to admin",
  "data": { ... }
}

Required Roles: admin
```

#### Toggle User Active Status (Admin Only)
```
PATCH /api/v1/users/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "isActive": false  // true to activate, false to deactivate
}

Response (200):
{
  "message": "User account deactivated successfully",
  "data": { ... }
}

Required Roles: admin
Note: Inactive users cannot login to the system
```

#### Delete User (Admin Only)
```
DELETE /api/v1/users/:id
Authorization: Bearer <token>

Response (200):
{
  "message": "User deleted successfully"
}

Required Roles: admin
Note: Permanent deletion - cannot be undone
```

### **Category Management** (All require JWT token)

#### Create Category
```
POST /api/v1/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Rent",
  "description": "Office rent, utilities, etc."
}

Response (201): Created category object
Required Roles: admin
```

#### List Categories
```
GET /api/v1/categories
Authorization: Bearer <token>

Response (200): [ { "_id":"...", "name":"Rent" } ]
Required Roles: analyst, admin
```

### **Financial Records** (All require JWT token)

#### Create Record
```
POST /api/v1/records
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000,
  "type": "income",  // income | expense
  "category": "salary",
  "date": "2024-01-15",
  "notes": "Monthly salary"
}

Response (201): Created record object
Required Roles: admin
```

#### Get All Records (with filtering)
```
GET /api/v1/records?type=income&category=salary&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=10
Authorization: Bearer <token>

Query Parameters:
- type: "income" or "expense" (optional)
- category: "salary", "groceries", etc. (optional)
- startDate: ISO date (optional)
- endDate: ISO date (optional)
- page: Page number (default: 1)
- limit: Records per page (default: 10)

Response (200):
{
  "message": "Records retrieved successfully",
  "data": [...],
}

Required Roles: analyst, admin
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### Get Record by ID
```
GET /api/v1/records/:id
Authorization: Bearer <token>

Response (200): Record object
Required Roles: analyst, admin
```

#### Update Record
```
PUT /api/v1/records/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5500,
  "category": "salary_updated",
  "notes": "Updated monthly salary"
}

Response (200): Updated record object
Required Roles: admin
Access: Admin only
```

#### Delete Record
```
DELETE /api/v1/records/:id
Authorization: Bearer <token>

Response (200): Success message
Required Roles: admin
Access: Admin only
```

### **Dashboard Analytics** (All require JWT token)

#### Get Dashboard Summary
```
GET /api/v1/dashboard/summary?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>

Query Parameters:
- startDate: ISO date (optional)
- endDate: ISO date (optional)

Response (200):
{
  "message": "Dashboard summary retrieved successfully",
  "data": {
    "overview": {
      "totalIncome": 50000,
      "totalExpenses": 15000,
      "netBalance": 35000,
      "transactionCount": 45
    },
    "categoryBreakdown": [
      {
        "_id": "salary",
        "total": 50000,
        "count": 12,
        "type": "income"
      },
      {
        "_id": "groceries",
        "total": 5000,
        "count": 30,
        "type": "expense"
      }
    ],
    "monthlyTrends": [
      {
        "_id": { "year": 2024, "month": 12 },
        "income": 4500,
        "expenses": 1200
      }
    ],
    "recentTransactions": [...]
  }
}
```

#### Get Category Breakdown
```
GET /api/v1/dashboard/categories
Authorization: Bearer <token>

Response (200):
{
  "message": "Category breakdown retrieved successfully",
  "data": [
    {
      "_id": "salary",
      "totalAmount": 50000,
      "incomeAmount": 50000,
      "expenseAmount": 0,
      "transactionCount": 12,
      "percentage": 500
    }
  ]
}
```

#### Get Income vs Expense Comparison
```
GET /api/v1/dashboard/comparison
Authorization: Bearer <token>

Response (200):
{
  "message": "Income vs Expense comparison retrieved successfully",
  "data": [
    { "type": "income", "total": 50000, "count": 15 },
    { "type": "expense", "total": 15000, "count": 30 }
  ]
}
```

## Access Control Implementation

### How It Works

1. **Token Verification** (`verifyToken` middleware)
   - Extracts JWT from `Authorization: Bearer <token>` header
   - Validates token signature and expiry
   - Attaches user info (id, role) to request

2. **Role-Based Access** (`requireRole` middleware)
   - Checks if user's role is in allowed roles list
   - Returns 403 Forbidden if role not allowed
   - Used on sensitive endpoints like create/update/delete

3. **Record-Level Access** (in controllers)
   - Admins can access all records
   - Regular users can only access their own records
   - Enforced in `getRecordById`, `updateRecord`, `deleteRecord`

### Example: Create Record Workflow
```
User sends POST /api/v1/records with token
↓
verifyToken middleware: Validates token, extracts user.id and user.role
↓
requireRole(['analyst', 'admin']): Checks if role is analyst or admin
↓
createRecord controller: Creates record with userId = user.id
↓
Response: 201 if successful, 403/401 if unauthorized
```

## Data Validation

All endpoints validate input to prevent invalid data:

- **Amount**: Must be positive number
- **Type**: Must be "income" or "expense"
- **Category**: Required string
- **Date**: Valid ISO date format
- **Email**: Must be unique in registration
- **Password**: Stored as bcrypt hash (never in plain text)

## Error Handling

Standard HTTP status codes used:

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation failed)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource doesn't exist)
- **500**: Server Error

All errors return JSON with message and details:
```json
{
  "message": "Error description",
  "error": "Additional details"
}
```

## Assumptions and Design Decisions

1. **User-owned Records**: By default, users can only create/view/edit their own records. Admins can manage all records.

2. **Role Management**: Roles (viewer, analyst, admin) are assigned at registration. Admins can change roles using the PATCH `/api/v1/users/:id/role` endpoint.

3. **Active Status Enforcement**: The `isActive` field is enforced at login. Inactive users cannot login and receive a 403 Forbidden response. Admins can toggle status using PATCH `/api/v1/users/:id/status`.

4. **Admin-Only User Management**: Only admins can:
   - View all users (GET `/api/v1/users`)
   - Change user roles
   - Toggle user active status
   - Delete users
   - View user statistics

5. **Self-Protection Rules**: Users cannot:
   - Change their own role (must ask another admin)
   - Deactivate their own account (must ask another admin)
   - Delete their own account (must ask another admin)

6. **Financial Record Categories**: Categories are strings (user-defined). Not enforced to a specific list.

7. **Timezone**: All dates use UTC. Frontend should handle timezone conversion if needed.

8. **Hard Delete**: Currently uses hard delete for users and records. Could be enhanced with soft delete for audit trails.

9. **Pagination**: Default 10 records/users per page. Max reasonable limit recommended (e.g., 100).

## Future Enhancements

- [x] User management endpoints
- [x] Role-based access control
- [ ] Unit & integration tests (Jest)
- [ ] Email verification for registration
- [ ] Refresh token support along with JWT
- [ ] Rate limiting
- [ ] Soft delete for records and users
- [ ] Export data to CSV
- [ ] Budget alerts
- [ ] Transaction tags
- [ ] Multi-currency support
- [ ] User activity logs
- [ ] Password reset functionality

## Testing the API

Use Postman or cURL to test endpoints:

```bash
# Register user
curl -X POST https://fintrack-app-g6pc.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"pass123","role":"analyst"}'

# Login
curl -X POST https://fintrack-app-g6pc.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'

# Get all users (admin only - use admin token)
curl -X GET https://fintrack-app-g6pc.onrender.com/api/v1/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Get user statistics (admin only)
curl -X GET https://fintrack-app-g6pc.onrender.com/api/v1/users/stats/overview \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Get single user by ID
curl -X GET https://fintrack-app-g6pc.onrender.com/api/v1/users/:id \
  -H "Authorization: Bearer <TOKEN>"

# Update user profile
curl -X PUT https://fintrack-app-g6pc.onrender.com/api/v1/users/:id \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Updated","email":"john.updated@example.com"}'

# Change user role (admin only)
curl -X PATCH https://fintrack-app-g6pc.onrender.com/api/v1/users/:id/role \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'

# Deactivate user (admin only)
curl -X PATCH https://fintrack-app-g6pc.onrender.com/api/v1/users/:id/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"isActive":false}'

# Delete user (admin only)
curl -X DELETE https://fintrack-app-g6pc.onrender.com/api/v1/users/:id \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Create financial record (use token from login response)
curl -X POST https://fintrack-app-g6pc.onrender.com/api/v1/records \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"type":"income","category":"salary"}'

# Get dashboard summary
curl -X GET https://fintrack-app-g6pc.onrender.com/api/v1/dashboard/summary \
  -H "Authorization: Bearer <TOKEN>"
```

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hash),
  role: String (enum: viewer, analyst, admin),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### FinancialRecord Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  amount: Number (>0),
  type: String (enum: income, expense),
  category: String,
  date: Date,
  notes: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## License

This project is for educational/evaluation purposes.

## Support

For questions or issues, review the code structure and comments in:
- `src/middleware/` - Authentication and access control logic
- `src/controllers/` - Business logic and validation
- `src/routes/` - Endpoint definitions
