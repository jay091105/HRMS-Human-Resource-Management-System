# Complete Setup Instructions

## ✅ Fixed Issues

1. **TypeScript Configuration**: Updated `backend/tsconfig.json` with better compiler options
2. **Admin Creation Script**: Created `backend/scripts/createAdmin.ts` for easy admin user creation
3. **Login Guide**: Created comprehensive `LOGIN_GUIDE.md`

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Configure Environment

Create `backend/.env` file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/dayflow-hrms
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### Step 3: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Create Admin:**
```bash
cd backend
npm run create-admin
```

## 🔐 How to Login

1. **Create Admin User** (if not done):
   ```bash
   cd backend
   npm run create-admin
   ```
   Default credentials:
   - Email: `admin@dayflow.com`
   - Password: `admin123`

2. **Open Browser**: Go to `http://localhost:5173`

3. **Login**: 
   - Enter the email and password
   - Click "Login"
   - You'll be redirected to the dashboard

## 📝 Login Process Explained

1. User enters credentials on `/login` page
2. Frontend sends POST to `/api/auth/login`
3. Backend validates and returns JWT token
4. Token stored in localStorage
5. User redirected to `/dashboard`
6. All API calls include token in headers

## 🛠️ Available Scripts

### Backend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run create-admin` - Create admin user

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔧 Troubleshooting

### TypeScript Errors
If you see TypeScript errors before installing dependencies, that's normal. Run:
```bash
npm install
```

### MongoDB Connection Error
- Make sure MongoDB is running
- Check `MONGO_URI` in `.env` file
- Default: `mongodb://localhost:27017/dayflow-hrms`

### Port Already in Use
- Backend uses port 5000
- Frontend uses port 5173
- Change ports in config files if needed

### Cannot Login
- Verify admin user was created: `npm run create-admin`
- Check backend server is running
- Check browser console for errors
- Verify MongoDB connection

## 📚 Additional Resources

- See `LOGIN_GUIDE.md` for detailed login instructions
- See `README.md` for full documentation
- See `QUICKSTART.md` for quick reference

## 🎯 Next Steps After Login

1. **As Admin**:
   - Go to Employees → Add Employee
   - View all attendance records
   - Approve/reject leave requests
   - Manage payroll

2. **As Employee**:
   - Check in/out from Attendance
   - Apply for leave
   - View your payroll
   - Update your profile

## 🔒 Security Notes

- Change default admin password after first login
- Use strong JWT_SECRET in production
- Never commit `.env` file to git
- Use environment variables for sensitive data

