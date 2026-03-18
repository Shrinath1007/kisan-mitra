# Test Script for Dashboard and Availability Fixes

## Pre-Test Setup

### 1. Ensure Backend is Running
```bash
cd Kisan-mitra/backend
npm start
# Should show: Server running on port 5000
```

### 2. Ensure Frontend is Running
```bash
cd Kisan-mitra/frontend
npm run dev
# Should show: Local: http://localhost:5173
```

## Test 1: Machine Owner Dashboard

### Step 1: Login as Machine Owner
1. Go to `http://localhost:5173/login`
2. Login with a user that has `role: "owner"`
3. Navigate to `http://localhost:5173/owner/dashboard`

### Step 2: Verify Stats Display
**Expected Results:**
- ✅ Total Machinery: Shows count of machines owned by user
- ✅ Pending Bookings: Shows count of pending bookings for user's machines  
- ✅ Wallet Balance: Shows ₹X,XXX (not ₹0 if user has earnings)

**If Stats Show 0 or Error:**
1. Check browser console for API errors
2. Check network tab for failed requests:
   - `/api/machines/my-machines` should return 200
   - `/api/booking/owner` should return 200
   - `/api/wallet` should return 200

### Step 3: Test Filters
**Status Filter Test:**
1. Change status filter from "All" to "Pending"
2. Bookings table should update to show only pending bookings
3. Try other statuses: "Approved", "Completed", "Rejected"

**Time Filter Test:**
1. Change time filter from "Last 24 Hours" to "Last 7 Days"
2. More bookings should appear (if they exist)
3. Try "Last 30 Days" and "All Time"

**Expected Results:**
- ✅ Filters work without console errors
- ✅ Table updates when filters change
- ✅ No debugging console.log messages appear

## Test 2: Dynamic Availability System

### Step 1: Login as Labour User
1. Go to `http://localhost:5173/login`
2. Login with a user that has `role: "labour"`
3. Navigate to `http://localhost:5173/labour/profile`

### Step 2: Check Availability Display
**Expected Results:**
- ✅ Availability Status shows "Available for Work" or "Not Available"
- ✅ Shows reason: "No work scheduled" or "Has scheduled work"
- ✅ If unavailable, shows "Next available: [date]"
- ✅ If has work, shows "Current Work:" with job details

### Step 3: Test Manual Override
1. Click "Edit Profile"
2. Check "Manually control my availability status"
3. Check "Set myself as available for work"
4. Click "Save Changes"

**Expected Results:**
- ✅ Profile shows manual override is active
- ✅ Shows both manual status and calculated status
- ✅ Manual status overrides calculated status in display

### Step 4: Test with Actual Work Schedule
**To create test scenario:**
1. Login as farmer, create a job vacancy with today's date
2. Login as labour, apply to the job
3. Login as farmer, accept the labour application
4. Login as labour, check profile

**Expected Results:**
- ✅ Availability shows "Not Available"
- ✅ Reason shows "Has scheduled work"
- ✅ Current Work section shows the accepted job
- ✅ Next available date shows day after job ends

## Test 3: API Endpoint Verification

### Using Browser Developer Tools:
1. Open Network tab
2. Navigate to dashboard/profile pages
3. Check API responses:

**Machine Owner Dashboard APIs:**
```
GET /api/machines/my-machines
Response: { success: true, machines: [...] }

GET /api/booking/owner
Response: { success: true, bookings: [...] }

GET /api/wallet  
Response: { success: true, data: { balance: X, ... } }
```

**Labour Profile APIs:**
```
GET /api/labour/profile
Response: {
  name: "...",
  availability: true/false,
  calculatedAvailability: {
    isAvailable: true/false,
    reason: "...",
    workSchedule: [...],
    nextAvailableDate: "...",
    lastCalculated: "..."
  }
}
```

## Troubleshooting Common Issues

### Issue: 403 Forbidden Errors
**Cause**: Role mismatch or authentication issues
**Solution**: 
1. Check user role in database matches expected role
2. Verify JWT token is valid
3. Check role middleware configuration

### Issue: Stats Show 0 When Data Exists
**Cause**: API endpoints returning empty data
**Solution**:
1. Check database for actual data
2. Verify user ownership of machines/bookings
3. Check API query filters

### Issue: Availability Always Shows "Not Available"
**Cause**: Calculation logic or data issues
**Solution**:
1. Check if user has accepted job applications
2. Verify date calculations in availability calculator
3. Check database for proper vacancy data structure

### Issue: Filters Don't Work
**Cause**: Frontend state management or API issues
**Solution**:
1. Check browser console for JavaScript errors
2. Verify filter state updates correctly
3. Check if API supports filter parameters

## Success Criteria

### ✅ Machine Owner Dashboard:
- [ ] All three stats display correct numbers
- [ ] Status filter works for all options
- [ ] Time filter works for all options  
- [ ] No console errors or debug messages
- [ ] Bookings table updates when filters change

### ✅ Dynamic Availability System:
- [ ] Shows calculated availability based on work schedule
- [ ] Manual override functionality works
- [ ] Displays work schedule details when unavailable
- [ ] Shows next available date when appropriate
- [ ] Profile updates save correctly

### ✅ General System:
- [ ] No 403/401 authentication errors
- [ ] All API endpoints return proper data
- [ ] Role-based access control works correctly
- [ ] No JavaScript console errors

## If Tests Fail:
1. Check the debug guides: `DASHBOARD_FILTERS_FIX.md` and `AVAILABILITY_SYSTEM_DEBUG.md`
2. Verify database has proper test data
3. Check backend logs for errors
4. Ensure all role names match between frontend/backend
5. Verify JWT tokens are valid and contain correct user data