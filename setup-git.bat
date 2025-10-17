@echo off
echo Setting up Git repository for Personal Portfolio
echo ================================================

echo.
echo Step 1: Initializing Git repository...
git init

echo.
echo Step 2: Adding all files to staging...
git add .

echo.
echo Step 3: Creating initial commit...
git commit -m "Initial commit: Personal Portfolio with modern design and animations"

echo.
echo Step 4: Creating feature commits for better history...
git add index.html
git commit -m "Add responsive HTML structure with About, Projects, Skills, and Contact sections"

git add styles.css
git commit -m "Add modern CSS with gradients, animations, and glass morphism effects"

git add script.js
git commit -m "Add interactive JavaScript with typing animation and smooth scrolling"

git add netlify.toml vercel.json .github/
git commit -m "Add deployment configurations for Netlify, Vercel, and GitHub Pages"

git add README.md DEPLOYMENT.md
git commit -m "Add comprehensive documentation and deployment guide"

echo.
echo Step 5: Creating main branch...
git branch -M main

echo.
echo ================================================
echo Git repository setup complete!
echo.
echo Next steps:
echo 1. Create a GitHub repository
echo 2. Add remote origin: git remote add origin <repository-url>
echo 3. Push to GitHub: git push -u origin main
echo 4. Follow DEPLOYMENT.md for hosting instructions
echo.
echo Available platforms:
echo - Netlify: Drag and drop or Git integration
echo - Vercel: Import from GitHub or CLI
echo - GitHub Pages: Automatic via GitHub Actions
echo.
echo To test locally:
echo - Open index.html in browser
echo - Or use: python -m http.server 8000
echo ================================================
pause