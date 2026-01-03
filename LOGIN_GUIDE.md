# Login Guide - Dayflow HRMS

## How to Login

### Step 1: Start the Application

1. **Start MongoDB** (if running locally):
   ```bash
   # Make sure MongoDB is running
   # On Windows: Check MongoDB service is running
   # On Mac/Linux: mongod
   ```

2. **Start Backend Server**:
   ```bash
   cd backend
   npm install  # If not already installed
   npm run dev
   ```
   Backend will run on `http://localhost:5000`

3. **Start Frontend Server**:
   ```bash
   cd frontend
   npm install  # If not already installed
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

### Step 2: Create Your First Admin User

You have **3 options** to create an admin user:

#### Option 1: Using the Setup Script (Recommended)
```bash
cd backend
npm run create-admin
```

Or with custom credentials:
```bash
npm run create-admin admin@example.com mypassword123
```

#### Option 2: Using the Signup API
You can register via the frontend signup page, but it creates an "employee" by default. To create an admin:

1. Go to `http://localhost:5173/signup`
2. Register with your email and password
3. Then use MongoDB or API to change the role to "admin"

Or use curl/Postman:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dayflow.com",
    "password": "admin123",
    "role": "admin"
  }'
```

#### Option 3: Direct Database Entry
Connect to MongoDB and insert directly:
```javascript
// In MongoDB shell or Compass
db.users.insertOne({
  email: "admin@dayflow.com",
  password: "$2a$10$...", // Hashed password (use bcrypt)
  role: "admin"
})
```

### Step 3: Login

1. **Open the application**: Go to `http://localhost:5173`

2. **Navigate to Login**: You'll be redirected to `/login` if not authenticated

3. **Enter Credentials**:
   - **Email**: The email you registered with (e.g., `admin@dayflow.com`)
   - **Password**: The password you set

4. **Click Login**: You'll be redirected to the dashboard

### Default Admin Credentials (if using script)

After running `npm run create-admin`:
- **Email**: `admin@dayflow.com`
- **Password**: `admin123`

⚠️ **Important**: Change the default password after first login!

## Login Flow

1. User enters email and password
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates credentials
4. Backend returns JWT token and user info
5. Frontend stores token in localStorage
6. User is redirected to dashboard
7. All subsequent API requests include the token in Authorization header

## Troubleshooting

### "Invalid credentials" error
- Check if the user exists in the database
- Verify password is correct
- Make sure MongoDB is connected

### "User already exists" error
- The email is already registered
- Try logging in instead
- Or use a different email

### Cannot connect to backend
- Check if backend server is running on port 5000
- Verify MongoDB connection
- Check `.env` file configuration

### Token expired
- Tokens expire after 7 days (configurable in `.env`)
- Simply login again to get a new token

## Creating Employee Users

After logging in as admin:

1. Go to **Employees** section (admin only)
2. Click **Add Employee**
3. Fill in employee details
4. The system will automatically create a user account for the employee
5. Employee can login with their email and a default password (you'll need to set this)

## API Testing with Postman/curl

### Login Request
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dayflow.com",
    "password": "admin123"
  }'
```

### Response
```json
{
  "user": {
    "id": "user_id_here",
    "email": "admin@dayflow.com",
    "role": "admin"
  },
  "token": "jwt_token_here"
}
```

### Using the Token
```bash
curl -X GET http://localhost:5000/api/employees \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- Change default admin password immediately
- Use strong passwords in production
- Set a strong JWT_SECRET in `.env` file

