# Quick Start Guide

## Initial Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/dayflow-hrms
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

Start MongoDB (if running locally):
```bash
# Make sure MongoDB is running on your system
```

Start the backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Start the frontend:
```bash
npm run dev
```

## First Steps

1. **Create an Admin Account**: 
   ```bash
   cd backend
   npm run create-admin
   ```
   This will create an admin user with:
   - Email: `admin@dayflow.com`
   - Password: `admin123`
   
   Or specify custom credentials:
   ```bash
   npm run create-admin your-email@example.com yourpassword
   ```
   
   Alternatively, you can register via API:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@dayflow.com", "password": "admin123", "role": "admin"}'
   ```

2. **Login to the Application**:
   - Open `http://localhost:5173`
   - Use the admin credentials you created
   - You'll be redirected to the dashboard

3. **Create an Employee Profile**:
   - After logging in as admin, go to Employees section
   - Click "Add Employee" to create employee profiles

3. **Test Features**:
   - Check in/out from Attendance page
   - Apply for leave from Leave page
   - View payroll from Payroll page

## Default Routes

- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - Main dashboard
- `/dashboard/employees` - Employee list (Admin only)
- `/dashboard/attendance` - Attendance tracking
- `/dashboard/leave` - Leave management
- `/dashboard/payroll` - Payroll view
- `/dashboard/profile` - User profile

## Notes

- The logo.png file is a placeholder - replace it with your actual logo
- Make sure MongoDB is running before starting the backend
- All API endpoints are prefixed with `/api`
- JWT tokens are stored in localStorage
- The app uses Tailwind CSS for styling

