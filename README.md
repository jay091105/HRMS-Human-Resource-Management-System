# Dayflow HRMS - Human Resource Management System

A comprehensive HRMS built with TypeScript, React, Node.js, Express, and MongoDB.

## Features

- **Authentication**: User registration and login with JWT
- **Employee Management**: Create, view, update, and manage employees (Admin only)
- **Attendance Tracking**: Check-in/check-out system with attendance history
- **Leave Management**: Apply for leave, view leave requests, and approve/reject (Admin)
- **Payroll Management**: View salary details and payroll history
- **Profile Management**: View and update personal profile
- **Role-based Access**: Admin and Employee roles with different permissions

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite
- React Router
- Zustand (State Management)
- Axios
- Tailwind CSS

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

## Project Structure

```
dayflow-hrms/
├── frontend/          # React frontend application
├── backend/           # Express backend API
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/dayflow-hrms
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

4. Start the development server:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Employees (Admin only)
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/me` - Get my attendance
- `GET /api/attendance` - Get all attendance (Admin)

### Leave
- `POST /api/leaves` - Apply for leave
- `GET /api/leaves/me` - Get my leave requests
- `GET /api/leaves` - Get all leave requests (Admin)
- `PATCH /api/leaves/:id/status` - Approve/reject leave (Admin)

### Payroll
- `GET /api/payroll/me` - Get my payroll
- `GET /api/payroll` - Get all payroll (Admin)
- `POST /api/payroll` - Create payroll (Admin)

## User Roles

### Admin
- Full access to all features
- Manage employees
- Approve/reject leave requests
- View all attendance records
- Manage payroll

### Employee
- View own profile
- Check in/out
- Apply for leave
- View own attendance
- View own payroll

## Development

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
```

## License

ISC

