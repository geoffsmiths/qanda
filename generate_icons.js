const fs = require('fs');
const sharp = require('sharp');

async function generateIcons() {
  try {
    // Create icons directory if it doesn't exist
    if (!fs.existsSync('icons')) {
      fs.mkdirSync('icons');
    }

    // Create a simple canvas with the QA text
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="60" fill="#4CAF50"/>
  <text x="64" y="80" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">QA</text>
  <circle cx="64" cy="64" r="56" fill="none" stroke="white" stroke-width="2" stroke-opacity="0.3"/>
</svg>`;

    // Write the SVG file
    fs.writeFileSync('icon.svg', svgContent);

    // Generate different sizes
    const sizes = [16, 48, 128];
    
    for (const size of sizes) {
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(`icons/icon${size}.png`);
      
      console.log(`Generated icon${size}.png`);
    }

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 