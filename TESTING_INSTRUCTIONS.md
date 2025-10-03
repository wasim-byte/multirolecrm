# Testing Night Owl CRM - Client Portal Flow

## Quick Test Flow:

### 1. Login as Founder
- Username: `founder`
- Password: `founder123`

### 2. Create a Manager
1. Go to "Managers" tab
2. Click "Add Manager"
3. Fill out the form (example: John Manager, username: `manager1`, password: `manager123`)

### 3. Activate a Project (Founder Dashboard)
1. Go to "Projects" tab
2. Click "Activate" on any pending project
3. Select the manager you created
4. Add earnings (e.g., `5000`)
5. **Fill out client credentials:**
   - Client Name: `John Client`
   - Client Email: `john@client.com`
   - Client Username: `johnclient`
   - Client Password: `client123`
6. Click "Activate Project"

### 4. Test Client Portal
1. Logout (or open new tab)
2. Login with the client credentials:
   - Username: `johnclient`
   - Password: `client123`
3. You should see the Client Dashboard with project details!

## Alternative: Manager Can Create Client Credentials Too
1. Login as the manager (e.g., `manager1` / `manager123`)
2. Go to projects and activate from Manager Dashboard
3. Create client credentials there as well

Both Founder and Manager can create client access!