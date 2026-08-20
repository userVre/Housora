const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve('audit-output/full-ux');
const groups = {
  'core-desktop': ['home','design','app-home','pricing','sign-in','sign-up','examples','projects','reference-style'],
  'tools-desktop': ['interior-design','layout-boost','exterior-design','garden-design','floor-restyle','wall-texture','video-walkthrough','floorplan-to-3d','photo-to-render','ai-stairs-design','ai-doors-design','ai-windows-design','ai-kitchen-design','ai-bathroom-design'],
  'core-mobile': ['home','design','app-home','pricing','sign-in','sign-up','examples','projects','reference-style'],
  'tools-mobile': ['interior-design','layout-boost','exterior-design','garden-design','floor-restyle','wall-texture','video-walkthrough','floorplan-to-3d','photo-to-render','ai-stairs-design','ai-doors-design','ai-windows-design','ai-kitchen-design','ai-bathroom-design'],
};

async function makeSheet(name, files) {
  const mobile = name.endsWith('mobile');
  const tileW = mobile ? 260 : 420;
  const tileH = 520;
  const labelH = 34;
  const cols = mobile ? 4 : 3;
  const rows = Math.ceil(files.length / cols);
  const composites = [];
  for (let index = 0; index < files.length; index++) {
    const file = path.join(root, mobile ? 'mobile' : 'desktop', `${files[index]}.png`);
    if (!fs.existsSync(file)) continue;
    const thumb = await sharp(file)
      .resize({ width: tileW, height: tileH - labelH, fit: 'cover', position: 'top' })
      .png()
      .toBuffer();
    const label = await sharp({
      text: { text: `<span foreground=\"white\"><b>${files[index]}</b></span>`, width: tileW, height: labelH, rgba: true },
    }).png().toBuffer();
    const x = (index % cols) * tileW;
    const y = Math.floor(index / cols) * tileH;
    composites.push({ input: thumb, left: x, top: y + labelH });
    composites.push({ input: label, left: x, top: y });
  }
  await sharp({ create: { width: cols * tileW, height: rows * tileH, channels: 4, background: '#111111' } })
    .composite(composites)
    .png()
    .toFile(path.join(root, `${name}.png`));
}

async function makeExternalToolsSheet() {
  const externalRoot = 'C:/Users/LENOVO/Desktop/ismail';
  const files = fs.readdirSync(externalRoot).filter(name => /^tools-ai-.*\.jpg$/i.test(name)).sort();
  const tileW = 420;
  const tileH = 300;
  const labelH = 34;
  const cols = 3;
  const composites = [];
  for (let index = 0; index < files.length; index++) {
    const thumb = await sharp(path.join(externalRoot, files[index]))
      .resize({ width: tileW, height: tileH - labelH, fit: 'cover', position: 'centre' })
      .png().toBuffer();
    const label = await sharp({ text: { text: `<span foreground=\"white\"><b>${files[index].replace('tools-ai-', '').replace('.jpg', '')}</b></span>`, width: tileW, height: labelH, rgba: true } }).png().toBuffer();
    const x = (index % cols) * tileW;
    const y = Math.floor(index / cols) * tileH;
    composites.push({ input: label, left: x, top: y });
    composites.push({ input: thumb, left: x, top: y + labelH });
  }
  await sharp({ create: { width: cols * tileW, height: Math.ceil(files.length / cols) * tileH, channels: 4, background: '#111111' } })
    .composite(composites).png().toFile(path.join(root, 'external-tools.png'));
}

async function makeStaticToolsSheet() {
  const toolsRoot = path.resolve('static/images/tools');
  const files = fs.readdirSync(toolsRoot).filter(name => /-hero\.jpg$/i.test(name)).sort();
  const tileW = 420, tileH = 300, labelH = 34, cols = 3;
  const composites = [];
  for (let index = 0; index < files.length; index++) {
    const thumb = await sharp(path.join(toolsRoot, files[index])).resize({ width: tileW, height: tileH - labelH, fit: 'cover' }).png().toBuffer();
    const label = await sharp({ text: { text: `<span foreground=\"white\"><b>${files[index].replace('-hero.jpg', '')}</b></span>`, width: tileW, height: labelH, rgba: true } }).png().toBuffer();
    const x = (index % cols) * tileW, y = Math.floor(index / cols) * tileH;
    composites.push({ input: label, left: x, top: y }, { input: thumb, left: x, top: y + labelH });
  }
  await sharp({ create: { width: cols * tileW, height: Math.ceil(files.length / cols) * tileH, channels: 4, background: '#111' } })
    .composite(composites).png().toFile(path.join(root, 'static-tools.png'));
}

(async () => {
  for (const [name, files] of Object.entries(groups)) await makeSheet(name, files);
  await makeExternalToolsSheet();
  await makeStaticToolsSheet();
})().catch(error => { console.error(error); process.exit(1); });
