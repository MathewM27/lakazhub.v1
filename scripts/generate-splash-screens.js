/**
 * This is a utility script to generate iOS splash screens from your app icon
 * 
 * To use:
 * 1. Make sure you have sharp installed: npm install --save-dev sharp
 * 2. Run this script: node scripts/generate-splash-screens.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ensure splash directory exists
const splashDir = path.join(__dirname, '../public/splash');
if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true });
}

// Source icon - use your apple-icon.png
const sourceIcon = path.join(__dirname, '../public/apple-icon.png');

// iOS splash screen sizes needed
const splashScreens = [
  { width: 1125, height: 2436, name: 'apple-launch-1125x2436.png' }, // iPhone X
  { width: 750, height: 1334, name: 'apple-launch-750x1334.png' },   // iPhone 8, 7, 6s, 6
  { width: 1242, height: 2208, name: 'apple-launch-1242x2208.png' }, // iPhone 8+, 7+, 6s+, 6+
  { width: 2048, height: 2732, name: 'apple-launch-2048x2732.png' }, // iPad Pro 12.9"
  { width: 1668, height: 2388, name: 'apple-launch-1668x2388.png' }, // iPad Pro 11"
  { width: 1668, height: 2224, name: 'apple-launch-1668x2224.png' }, // iPad Pro 10.5"
  { width: 1536, height: 2048, name: 'apple-launch-1536x2048.png' }, // iPad Mini, Air
];

// Function to create splash screen with centered icon
async function createSplashScreen(width, height, name) {
  // Create a black background
  const background = Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#000000"/>
    </svg>`
  );

  // Get the icon as a buffer
  const icon = await sharp(sourceIcon)
    .resize({ width: Math.floor(width * 0.3), height: Math.floor(width * 0.3), fit: 'contain' })
    .toBuffer();

  // Calculate center position for the icon
  const iconWidth = Math.floor(width * 0.3);
  const iconHeight = Math.floor(width * 0.3);
  const iconLeft = Math.floor((width - iconWidth) / 2);
  const iconTop = Math.floor((height - iconHeight) / 2);

  // Composite the icon onto the background
  await sharp(background)
    .composite([
      {
        input: icon,
        top: iconTop,
        left: iconLeft,
      },
    ])
    .toFile(path.join(splashDir, name));

  console.log(`Created ${name}`);
}

// Generate all splash screens
async function generateSplashScreens() {
  console.log('Generating splash screens...');
  
  for (const screen of splashScreens) {
    await createSplashScreen(screen.width, screen.height, screen.name);
  }
  
  console.log('Done! Generated all splash screens.');
}

generateSplashScreens().catch(err => {
  console.error('Error generating splash screens:', err);
});
