# Vercel Deployment Guide for ZDH Express.js Project

## Files Created for Vercel Deployment

1. **vercel.json** - Vercel configuration file
2. **api/index.js** - Vercel serverless function entry point  
3. **.vercelignore** - Files to exclude from deployment

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account/team
- Link to existing project? **N** (for first deployment)
- What's your project's name? **zdh** (or your preferred name)
- In which directory is your code located? **./** (current directory)

### 4. Production Deployment
```bash
vercel --prod
```

## Important Notes

### Environment Variables
Make sure to set your environment variables in the Vercel dashboard:
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add all necessary variables from your `.env` files

### Key Changes Made

1. **Created `api/index.js`**: This is the entry point for Vercel's serverless functions
2. **Modified project structure**: Vercel uses the `/api` directory for serverless functions
3. **Added `vercel.json`**: Configuration file that tells Vercel how to build and route your app
4. **Added `.vercelignore`**: Excludes unnecessary files from deployment

### How It Works

- Your original `bin/www` startup file is no longer used in production
- Instead, `api/index.js` imports your `app.js` and exports the Express app
- Vercel automatically handles the server creation and port binding
- All routes are redirected to the single serverless function

### Testing Locally with Vercel

You can test the Vercel deployment locally:
```bash
vercel dev
```

This will start a local development server that mimics Vercel's environment.

## Troubleshooting

1. **Build Errors**: Check that all dependencies are in `package.json`
2. **Environment Variables**: Ensure all required env vars are set in Vercel dashboard
3. **File Paths**: Make sure all file paths in your code work with the new structure
4. **Database Connections**: Ensure your database allows connections from Vercel's IP ranges

## Alternative Deployment Method

If you prefer to deploy via GitHub:
1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Vercel will automatically deploy on every push to main branch