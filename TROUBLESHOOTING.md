# Troubleshooting Guide

## Common Issues and Solutions

### 1. TypeScript Compilation Errors

**Error**: `Interface 'UserDocument' cannot simultaneously extend types 'User' and 'Document'`

**Solution**: This has been fixed by using `Omit` to exclude conflicting properties. If you still see this error:
- Clear ts-node cache: Delete `node_modules/.cache` if it exists
- Restart your terminal/IDE
- Run `npm run create-admin` again

### 2. JWT Secret Error / Backend Crashes

**Error**: `JWT_SECRET is not configured` or backend crashes on startup

**Solution**:
1. Create a `.env` file in the `backend` directory:
   ```env
   JWT_SECRET=your-super-secret-key-change-this-in-production-min-32-characters
   JWT_EXPIRES_IN=7d
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/dayflow-hrms
   ```

2. Make sure the `.env` file is in the `backend` folder (not root)

3. Restart the backend server

4. For production, use a strong, random secret (at least 32 characters)

### 3. MongoDB Connection Error

**Error**: `Error connecting to MongoDB`

**Solution**:
1. Make sure MongoDB is running:
   - Windows: Check MongoDB service in Services
   - Mac/Linux: Run `mongod` or check service status

2. Verify the connection string in `.env`:
   ```env
   MONGO_URI=mongodb://localhost:27017/dayflow-hrms
   ```

3. If using MongoDB Atlas, use the full connection string:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dayflow-hrms
   ```

### 4. Admin User Already Exists

**Error**: `User with email admin@dayflow.com already exists!`

**Solution**: This is normal if you've already created the admin. You can:
- Use the existing credentials to login
- Delete the user from MongoDB and run the script again
- Create a new admin with different email: `npm run create-admin newadmin@example.com newpassword`

### 5. Port Already in Use

**Error**: `Port 5000 is already in use`

**Solution**:
1. Change the port in `.env`:
   ```env
   PORT=5001
   ```

2. Or kill the process using port 5000:
   - Windows: `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`
   - Mac/Linux: `lsof -ti:5000 | xargs kill`

### 6. CORS Errors in Frontend

**Error**: CORS policy blocked request

**Solution**:
1. Make sure `CORS_ORIGIN` in backend `.env` matches your frontend URL:
   ```env
   CORS_ORIGIN=http://localhost:5173
   ```

2. Restart the backend after changing `.env`

### 7. Token Expired / Invalid Token

**Error**: `Invalid or expired token`

**Solution**:
1. Logout and login again to get a new token
2. Check if `JWT_EXPIRES_IN` is set correctly in `.env`
3. Clear localStorage in browser and login again

### 8. ts-node Compilation Issues

**Error**: TypeScript compilation errors when running scripts

**Solution**:
1. Make sure all dependencies are installed: `npm install`
2. Check `tsconfig.json` is properly configured
3. Try using `npx ts-node` directly: `npx ts-node scripts/createAdmin.ts`
4. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## Quick Fixes

### Reset Everything
```bash
# Stop all servers
# Delete node_modules
rm -rf node_modules
rm -rf frontend/node_modules

# Reinstall
npm install
cd ../frontend && npm install

# Restart
cd ../backend && npm run dev
```

### Check Environment Variables
```bash
# In backend directory
cat .env
# Make sure all required variables are set
```

### Test Database Connection
```bash
# In backend directory
node -e "require('./src/config/db').connectDB().then(() => console.log('Connected!')).catch(e => console.error(e))"
```

## Getting Help

If you're still experiencing issues:
1. Check the console/terminal for detailed error messages
2. Verify all environment variables are set
3. Make sure MongoDB is running
4. Check that ports 5000 (backend) and 5173 (frontend) are available
5. Review the error logs in the terminal output

