# Environment Variables Setup

This document lists all required environment variables for the Crystal Ladder Backend application.

## Required Environment Variables

### Application Configuration
- **NODE_ENV** - Environment mode (development, production, test)
  - Default: `development`
  - Example: `NODE_ENV=development`

- **PORT** - Port number for the server
  - Default: `3001`
  - Example: `PORT=3001`

- **APP_NAME** - Application name (used in Swagger and logs)
  - Default: `app`
  - Example: `APP_NAME=Crystal Ladder Learning Centre`

- **GLOBAL_PREFIX** - API route prefix
  - Default: `api`
  - Example: `GLOBAL_PREFIX=api`

### Database Configuration (PostgreSQL)
- **DATABASE_HOST** - PostgreSQL host address
  - Example: `DATABASE_HOST=localhost` or `DATABASE_HOST=db.example.com`

- **DATABASE_PORT** - PostgreSQL port number
  - Default: `5432`
  - Example: `DATABASE_PORT=5432`

- **DATABASE_USER_NAME** - PostgreSQL username
  - Example: `DATABASE_USER_NAME=postgres`

- **DATABASE_PASSWORD** - PostgreSQL password
  - Example: `DATABASE_PASSWORD=your_secure_password`

- **DATABASE_NAME** - PostgreSQL database name
  - Example: `DATABASE_NAME=crystal_ladder_db`

### JWT Authentication
- **JWT_SECRET** - Secret key for signing JWT tokens (IMPORTANT: Use a strong, random string in production)
  - Example: `JWT_SECRET=your-super-secret-jwt-key-change-this-in-production`
  - **Security Note**: Generate a strong random string for production. You can use:
    ```bash
    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    ```

- **JWT_EXPIRES_IN** - JWT token expiration time
  - Example: `JWT_EXPIRES_IN=7d` (7 days)
  - Other options: `1h`, `24h`, `7d`, `30d`, etc.

### Swagger Documentation
- **SWAGGER_ENABLE** - Enable/disable Swagger documentation
  - Example: `SWAGGER_ENABLE=true` (usually enabled in development)
  - Note: Swagger is automatically enabled in development mode

- **SWAGGER_PATH** - Swagger UI path
  - Default: `docs`
  - Example: `SWAGGER_PATH=docs`
  - Access at: `http://localhost:3001/api/docs`

### Email Configuration (SMTP - Gmail)
- **SMTP_HOST** - SMTP server host
  - Default: `smtp.gmail.com`
  - Example: `SMTP_HOST=smtp.gmail.com`

- **SMTP_PORT** - SMTP server port
  - Default: `587`
  - Example: `SMTP_PORT=587` (for TLS) or `SMTP_PORT=465` (for SSL)

- **SMTP_USER** - SMTP username (your Gmail address)
  - Example: `SMTP_USER=your-email@gmail.com`

- **SMTP_PASSWORD** - SMTP password (Gmail App Password)
  - Example: `SMTP_PASSWORD=your-16-character-app-password`
  - **Note**: For Gmail, you need to generate an App Password:
    1. Go to your Google Account settings
    2. Enable 2-Step Verification
    3. Go to App Passwords and generate a new app password
    4. Use the 16-character password (without spaces) as SMTP_PASSWORD

- **SMTP_FROM_EMAIL** - Email address to use as sender (optional)
  - Default: Uses SMTP_USER if not provided
  - Example: `SMTP_FROM_EMAIL=noreply@crystalladder.com`

## Optional Environment Variables

- **TEST** - Test mode flag (used for testing)
  - Example: `TEST=false`

## Environment File Structure

The application supports multiple environment files:
- `.env` - Base environment file
- `.env.development` - Development-specific overrides
- `.env.production` - Production-specific overrides
- `.env.test` - Test-specific overrides

## Setup Instructions

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Update all values with your actual configuration:
   - Replace all `your_*` placeholders with actual values
   - Generate a strong JWT_SECRET for production
   - Configure your PostgreSQL database credentials

3. For production, create a `.env.production` file with production-specific values:
   ```bash
   cp .env.example .env.production
   ```

## Security Best Practices

1. **Never commit `.env` files to version control**
   - Ensure `.env` is in your `.gitignore` file

2. **Use strong secrets**
   - Generate JWT_SECRET using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

3. **Use different credentials for different environments**
   - Development, staging, and production should have separate credentials

4. **Rotate secrets regularly**
   - Change JWT_SECRET periodically in production

5. **Limit database access**
   - Use database users with minimal required permissions
   - Use strong database passwords

## Example .env File

```env
# Application Configuration
NODE_ENV=development
PORT=3001
APP_NAME=Crystal Ladder Learning Centre
GLOBAL_PREFIX=api

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER_NAME=postgres
DATABASE_PASSWORD=secure_password_123
DATABASE_NAME=crystal_ladder_db

# JWT Configuration
JWT_SECRET=your-generated-secret-key-here
JWT_EXPIRES_IN=7d

# Swagger Configuration
SWAGGER_ENABLE=true
SWAGGER_PATH=docs

# Email Configuration (SMTP - Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

