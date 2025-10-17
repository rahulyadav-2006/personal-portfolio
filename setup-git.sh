#!/bin/bash

echo "Setting up Git repository for Live Data Scraper"
echo "================================================"

echo ""
echo "Step 1: Initializing Git repository..."
git init

echo ""
echo "Step 2: Adding all files to staging..."
git add .

echo ""
echo "Step 3: Creating initial commit..."
git commit -m "Initial commit: Live Data Scraper with web scraping and real-time dashboard"

echo ""
echo "Step 4: Creating feature commits for better history..."
git add package.json server.js
git commit -m "Add core server setup with Express and MongoDB integration"

git add models/
git commit -m "Add database models for scraped data and logging"

git add services/
git commit -m "Add scraping services for news, crypto, and weather data"

git add routes/
git commit -m "Add REST API routes for data management and scraping controls"

git add public/
git commit -m "Add modern frontend dashboard with real-time updates"

git add scripts/
git commit -m "Add utility scripts for database setup and manual scraping"

git add *.json *.yml *.md Dockerfile
git commit -m "Add deployment configurations and documentation"

echo ""
echo "Step 5: Creating main branch..."
git branch -M main

echo ""
echo "================================================"
echo "Git repository setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a GitHub repository"
echo "2. Add remote origin: git remote add origin <repository-url>"
echo "3. Push to GitHub: git push -u origin main"
echo "4. Follow DEPLOYMENT.md for hosting instructions"
echo ""
echo "Available commands:"
echo "- npm install          : Install dependencies"
echo "- npm run setup-db     : Setup database"
echo "- npm start            : Start production server"
echo "- npm run dev          : Start development server"
echo "- npm run scrape all   : Run manual scraping"
echo "================================================"
