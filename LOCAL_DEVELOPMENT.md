# Local Development Setup

This guide explains how to set up and run Rei-Warden-Manager on your local machine (e.g., Windows 11) for development and testing without needing a full rclone installation.

## Overview

The development mode provides:
- ✅ **Mock Rclone**: Simulates rclone responses without needing rclone installed
- ✅ **Local Paths**: Uses relative directories (./mock-config, ./mock-vw-data, etc.)
- ✅ **Environment Toggle**: Switch between development and production via NODE_ENV
- ✅ **UI Indicators**: Shows "Development Mode" banner when in dev mode
- ✅ **Full UI Testing**: Test all features including backup flows, cloud config, settings, etc.

## Prerequisites

- Docker and Docker Compose installed
- Git for cloning the repository
- Text editor (VS Code recommended)

## Quick Start

### 1. Clone and Enter Directory
```bash
git clone https://github.com/yourusername/rei-warden-manager.git
cd rei-warden-manager
```

### 2. Build Frontend (if not already built)
```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Run Development Container
```bash
docker-compose -f docker-compose.local.yml up --build
```

This will:
- Build the Docker image with NODE_ENV=development
- Create local mock directories (./mock-config, ./mock-backups, etc.)
- Start the server on http://localhost:3001
- Enable mocked rclone responses

### 4. Access the Application
- **Frontend**: http://localhost:3001
- **Default Password**: `admin`
- Watch for **🚀 Development Mode** banner confirming mock mode is active

## What Gets Mocked?

In development mode, the following rclone operations are mocked:

| Operation | Behavior |
|-----------|----------|
| `rclone version` | Returns mock version string |
| `rclone lsd` | Returns hardcoded mock folders |
| `rclone lsjson` | Returns sample backup files |
| `rclone copy` | Logs simulated copy, returns success |
| `rclone deletefile` | Logs simulated delete, returns success |

**Real operations that still work:**
- Settings persistence to ./mock-config/settings.json
- Backup archive creation (creates mock tar.gz files in ./mock-backups)
- Logs written to ./mock-logs/backup.log
- All API endpoints and authentication

## Development Mode Environment Variables

When using `docker-compose.local.yml`, these are automatically set:

```env
NODE_ENV=development
PORT=3001
DATA_DIR=./mock-vw-data
BACKUP_DIR=./mock-backups
LOG_FILE=./mock-logs/backup.log
CONFIG_DIR=./mock-config
RCLONE_CONFIG_FILE=./mock-config/rclone.conf
```

To use different paths or settings, create a `.env.local` file and pass it to docker:
```bash
docker-compose -f docker-compose.local.yml --env-file .env.local up
```

## Testing Workflows

### 1. Test Backup UI Flow
1. Go to Dashboard
2. Click **▶ Run Manual Backup Now**
3. Watch progress bar update
4. See "Backup completed" message (simulated)
5. Backup file appears in ./mock-backups/

### 2. Test Cloud Configuration
1. Go to Cloud Config
2. Try testing a remote (uses mocked rclone response)
3. Add remotes - they save to ./mock-config/settings.json (no actual rclone config written in dev mode)

### 3. Test Settings
1. Change retention policy - persisted to ./mock-config/settings.json
2. Change password - sends hash to settings.json
3. Test Telegram (will fail but safely in dev mode)

### 4. Test Authentication
1. Login with password `admin`
2. Session uses JWT token (will persist for 24h)
3. Logout and re-login to test

## Directory Structure After Running

```
rei-warden-manager/
├── mock-vw-data/           # Local data directory (mock DATA_DIR)
├── mock-backups/           # Backup archives are created here
├── mock-config/            
│   ├── settings.json       # Persistent settings/remotes
│   └── rclone.conf         # Not written in dev mode
├── mock-logs/
│   └── backup.log          # Application logs
└── docker-compose.local.yml
```

## Logs

To view logs in real-time:
```bash
# Docker logs
docker logs -f rei-warden-manager-dev

# Or read the log file
cat mock-logs/backup.log
```

Look for `[MOCK]` prefix in logs to identify mocked operations:
```
[2025-02-23T...] [MOCK] Skipping rclone version check (development mode)
[2025-02-23T...] [MOCK] Mock archive created successfully.
[2025-02-23T...] [MOCK] Simulated rclone copy: copy mock-backups/backup-*.tar.gz dropbox:/backups
```

## Stopping and Cleaning Up

```bash
# Stop the container
docker-compose -f docker-compose.local.yml down

# Remove containers and volumes
docker-compose -f docker-compose.local.yml down -v

# Clean up mock directories
rm -rf mock-vw-data mock-backups mock-config mock-logs
```

## Frontend Hot Reload (Advanced)

To enable hot-reload of frontend files without rebuilding, uncomment the volumes in `docker-compose.local.yml`:

```yaml
volumes:
  # Uncomment these for hot-reload:
  - ./frontend/dist:/app/dist
  - ./backend:/app/backend  # Only if running backend with nodemon
```

Then modify your Dockerfile or use nodemon for backend changes.

## Switching to Production Mode

When deploying to production:

1. Use the regular `docker-compose.yml` (not `.local.yml`)
2. Set `NODE_ENV=production` (or omit - defaults to production)
3. Ensure rclone is installed in the Docker image
4. Use absolute paths for volumes
5. The app will automatically use real rclone commands

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in docker-compose.local.yml
# Or kill existing process on 3001
lsof -ti:3001 | xargs kill -9
```

### Mock Directories Not Created
```bash
# Manually create them
mkdir -p mock-vw-data mock-backups mock-config mock-logs
```

### Settings Not Persisting
- Check ./mock-config/settings.json exists and is writable
- View logs to see if there are permission errors

### "Development Mode" Banner Not Showing
- Restart the container
- Check browser cache (Ctrl+Shift+Delete)
- Verify NODE_ENV=development in container: `docker exec rei-warden-manager-dev env | grep NODE_ENV`

## Next Steps

- [ ] Test all UI flows mentioned above
- [ ] Verify backup mockup appears in Dashboard
- [ ] Test adding/deleting cloud remotes
- [ ] Test retention policy settings
- [ ] Verify password change works
- [ ] Test pagination in backup history

Once everything works locally, you're ready to:
1. Commit changes to your branch
2. Create a PR with the new development setup
3. Deploy to production with real rclone

---

**Happy local development! 🚀**
