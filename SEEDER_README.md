# Database Seeder

This seeder populates the database with sample data for development and testing purposes.

## What Gets Seeded

The seeder creates sample data for all database tables:

### Users (7 users)
- 1 Admin user
- 2 Therapist users
- 1 Content Manager user
- 3 Parent users (2 approved, 1 pending approval)

### Children (4 children)
- Linked to parent users
- Assigned to therapists
- Includes diagnosis and notes

### Services (6 services)
- Speech Therapy
- Occupational Therapy
- Applied Behavior Analysis (ABA)
- Social Skills Group
- Physical Therapy
- Parent Training Session

### Appointments (6 appointments)
- Mix of pending, approved, and completed appointments
- Various dates (past, present, future)
- Linked to children, parents, therapists, and services

### Reports (4 reports)
- Progress reports
- Session summaries
- Assessment reports
- Linked to children and therapists

### Messages (5 messages)
- Direct messages between users
- Announcements
- Newsletters

### Events (5 events)
- Workshops
- Activities
- Announcements
- Meetings
- Mix of published and featured events

### Audit Logs (5 logs)
- Sample admin actions
- Login logs
- Create/Update actions

## Default Login Credentials

After seeding, you can login with these credentials:

### Admin
- **Email:** `admin@crystalladder.com`
- **Password:** `Admin@123`

### Therapist 1
- **Email:** `therapist1@crystalladder.com`
- **Password:** `Therapist@123`

### Therapist 2
- **Email:** `therapist2@crystalladder.com`
- **Password:** `Therapist@123`

### Content Manager
- **Email:** `content@crystalladder.com`
- **Password:** `Content@123`

### Parent 1
- **Email:** `parent1@example.com`
- **Password:** `Parent@123`

### Parent 2
- **Email:** `parent2@example.com`
- **Password:** `Parent@123`

### Parent 3 (Pending Approval)
- **Email:** `parent3@example.com`
- **Password:** `Parent@123`

## Running the Seeder

### Option 1: Using npm script (Recommended)
```bash
npm run seed
```

### Option 2: Direct TypeScript execution
```bash
npx ts-node -r tsconfig-paths/register src/database/seed.ts
```

## Prerequisites

1. **Database must be set up and migrations run:**
   ```bash
   npm run migration:run
   ```

2. **Environment variables must be configured:**
   - Ensure your `.env` file has correct database credentials
   - See `ENV_SETUP.md` for details

## Important Notes

⚠️ **Warning:** The seeder will **clear all existing data** before seeding new data. This includes:
- All users (except you can modify the clear logic)
- All children
- All appointments
- All reports
- All messages
- All events
- All audit logs

To keep existing data, comment out the `clearDatabase()` call in `seeder.service.ts`.

## Customization

You can customize the seeded data by modifying:
- `src/database/seeder.service.ts` - Main seeder logic
- Add more users, children, services, etc. in the respective seed methods

## Troubleshooting

### Error: "Cannot find module"
Make sure you've installed all dependencies:
```bash
npm install
```

### Error: "Database connection failed"
Check your `.env` file and ensure:
- Database is running
- Credentials are correct
- Database exists

### Error: "Table doesn't exist"
Run migrations first:
```bash
npm run migration:run
```

## Development Workflow

1. **First time setup:**
   ```bash
   # 1. Install dependencies
   npm install
   
   # 2. Set up .env file
   cp .env.example .env
   # Edit .env with your database credentials
   
   # 3. Run migrations
   npm run migration:run
   
   # 4. Seed database
   npm run seed
   ```

2. **Reset database:**
   ```bash
   # Run migrations (drops and recreates tables)
   npm run migration:revert
   npm run migration:run
   
   # Seed fresh data
   npm run seed
   ```

