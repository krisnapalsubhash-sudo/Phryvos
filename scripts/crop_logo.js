const fs = require('fs');
const path = require('path');
const jpeg = require('/root/scratch_img/node_modules/jpeg-js');
const { PNG } = require('/root/scratch_img/node_modules/pngjs');

const sourcePath = '/storage/emulated/0/phryvos/Phryvos_brand_logo_design_brief_2K_20261003014629.jpg';
console.log('Loading source image:', sourcePath);
const jpegBuffer = fs.readFileSync(sourcePath);
const src = jpeg.decode(jpegBuffer, { useTArray: true });
console.log(`Source dimensions: ${src.width}x${src.height}`);

// Helper: Bilinear sample from src
function sampleBilinear(x, y) {
  x = Math.max(0, Math.min(src.width - 1, x));
  y = Math.max(0, Math.min(src.height - 1, y));
  
  const x0 = Math.floor(x);
  const x1 = Math.min(src.width - 1, x0 + 1);
  const y0 = Math.floor(y);
  const y1 = Math.min(src.height - 1, y0 + 1);
  
  const wx = x - x0;
  const wy = y - y0;
  
  const idx00 = (y0 * src.width + x0) * 4;
  const idx10 = (y0 * src.width + x1) * 4;
  const idx01 = (y1 * src.width + x0) * 4;
  const idx11 = (y1 * src.width + x1) * 4;
  
  const r = (src.data[idx00] * (1 - wx) + src.data[idx10] * wx) * (1 - wy) +
            (src.data[idx01] * (1 - wx) + src.data[idx11] * wx) * wy;
  const g = (src.data[idx00 + 1] * (1 - wx) + src.data[idx10 + 1] * wx) * (1 - wy) +
            (src.data[idx01 + 1] * (1 - wx) + src.data[idx11 + 1] * wx) * wy;
  const b = (src.data[idx00 + 2] * (1 - wx) + src.data[idx10 + 2] * wx) * (1 - wy) +
            (src.data[idx01 + 2] * (1 - wx) + src.data[idx11 + 2] * wx) * wy;
  const a = (src.data[idx00 + 3] * (1 - wx) + src.data[idx10 + 3] * wx) * (1 - wy) +
            (src.data[idx01 + 3] * (1 - wx) + src.data[idx11 + 3] * wx) * wy;
            
  return [Math.round(r), Math.round(g), Math.round(b), Math.round(a)];
}

// Function to crop and resize a region into a new PNG
function cropAndResize(cropBox, targetWidth, targetHeight, outPath, padColor = [0, 0, 0, 255]) {
  const png = new PNG({ width: targetWidth, height: targetHeight });
  
  const { x: cropX, y: cropY, width: cropW, height: cropH } = cropBox;
  
  for (let dy = 0; dy < targetHeight; dy++) {
    for (let dx = 0; dx < targetWidth; dx++) {
      const srcX = cropX + (dx / targetWidth) * cropW;
      const srcY = cropY + (dy / targetHeight) * cropH;
      
      let [r, g, b, a] = sampleBilinear(srcX, srcY);
      
      const outIdx = (dy * targetWidth + dx) * 4;
      png.data[outIdx] = r;
      png.data[outIdx + 1] = g;
      png.data[outIdx + 2] = b;
      png.data[outIdx + 3] = a;
    }
  }
  
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outPath, buffer);
  console.log(`Saved: ${outPath} (${targetWidth}x${targetHeight}, ${buffer.length} bytes)`);
}

// 1. App Icon Squircle (the bottom-right icon mockup with dark rounded container)
// Center at 1787, 1352, size ~380x380
const appTileBox = {
  x: 1787 - 195,
  y: 1352 - 195,
  width: 390,
  height: 390
};

// 2. Pure Glowing Orbital Icon (the main icon on dark space)
// Center at 475, 677, size ~440x440
const glowingIconBox = {
  x: 475 - 220,
  y: 677 - 220,
  width: 440,
  height: 440
};

// 3. Full Brand Banner (Glowing Icon + PHRYVOS logotype)
// x: 260 to 1800, y: 470 to 890 (width: 1540, height: 420)
const fullLogoBox = {
  x: 250,
  y: 470,
  width: 1550,
  height: 430
};

// Ensure directories exist
fs.mkdirSync('/root/projects/phryvos/public/brand', { recursive: true });

// Export variations to public
cropAndResize(appTileBox, 512, 512, '/root/projects/phryvos/public/brand/app-icon-512.png');
cropAndResize(appTileBox, 192, 192, '/root/projects/phryvos/public/brand/app-icon-192.png');
cropAndResize(glowingIconBox, 512, 512, '/root/projects/phryvos/public/brand/logo-icon-512.png');
cropAndResize(glowingIconBox, 192, 192, '/root/projects/phryvos/public/brand/logo-icon-192.png');
cropAndResize(fullLogoBox, 1200, 333, '/root/projects/phryvos/public/brand/logo-full.png');

// Copy primary icon to public/icon-512.png, icon-192.png, and logo.png
fs.copyFileSync('/root/projects/phryvos/public/brand/logo-icon-512.png', '/root/projects/phryvos/public/icon-512.png');
fs.copyFileSync('/root/projects/phryvos/public/brand/logo-icon-192.png', '/root/projects/phryvos/public/icon-192.png');
fs.copyFileSync('/root/projects/phryvos/public/brand/logo-icon-512.png', '/root/projects/phryvos/public/logo.png');
fs.copyFileSync('/root/projects/phryvos/public/brand/logo-icon-192.png', '/root/projects/phryvos/public/favicon.ico');

console.log('✅ All logo assets generated and copied to public/!');
