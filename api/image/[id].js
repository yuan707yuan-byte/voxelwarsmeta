// api/image/[id].js
// Returns the warrior SVG image directly as image/svg+xml
// Called by: https://meta.voxelwars.io/image/{tokenId}
// Metadata JSON points image field here so Fantase can display it.

const { ethers } = require('ethers');

const NFT_ADDRESS = '0x278B7d52f3484F56AD0B6B3c12C67359295A4333';
const RPC_URL     = 'https://interrpc.abeychain.com';
const RPC_BACKUP  = 'https://rpc.abeychain.com';

const NFT_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getPlayerStats(address player) view returns (tuple(uint8 strength, uint8 dexterity, uint8 intelligence, uint8 level, uint256 xp, uint256 xpToNextLevel, uint256 kills, uint256 mintBlock, bytes32 seed))',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

const AVATARS = ['\u2694', '\uD83D\uDDE1', '\uD83D\uDD31', '\u26A1', '\uD83D\uDD25', '\uD83D\uDC80', '\uD83D\uDEE1', '\uD83C\uDFF9'];

function generateWarriorSVG(tokenId, seedHex, str, dex, intel, level, kills) {
  const seed       = parseInt(seedHex, 16) || tokenId;
  const avatar     = AVATARS[seed % AVATARS.length];
  const hue        = (seed * 137) % 360;        // unique color per warrior
  const saturation = 60 + (seed % 20);
  const baseColor  = `hsl(${hue},${saturation}%,45%)`;
  const darkColor  = `hsl(${hue},${saturation}%,20%)`;
  const lightColor = `hsl(${hue},${saturation}%,75%)`;

  const strBar  = Math.min(100, Math.round((str  / 25) * 100));
  const dexBar  = Math.min(100, Math.round((dex  / 25) * 100));
  const intBar  = Math.min(100, Math.round((intel/ 25) * 100));

  return `<svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d0d15"/>
      <stop offset="100%" style="stop-color:${darkColor}"/>
    </linearGradient>
    <linearGradient id="cardg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1c1c28"/>
      <stop offset="100%" style="stop-color:#0f0f1a"/>
    </linearGradient>
    <linearGradient id="strg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#c0392b"/>
      <stop offset="100%" style="stop-color:#e74c3c"/>
    </linearGradient>
    <linearGradient id="dexg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#d4ac0d"/>
      <stop offset="100%" style="stop-color:#f1c40f"/>
    </linearGradient>
    <linearGradient id="intg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00b894"/>
      <stop offset="100%" style="stop-color:#00d4aa"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="500" height="500" fill="url(#bg)"/>

  <!-- Grid pattern -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M40 0L0 0 0 40" fill="none" stroke="${baseColor}" stroke-width="0.3" opacity="0.2"/>
  </pattern>
  <rect width="500" height="500" fill="url(#grid)"/>

  <!-- Border glow -->
  <rect x="4" y="4" width="492" height="492" rx="12" fill="none"
    stroke="${baseColor}" stroke-width="1.5" opacity="0.6" filter="url(#glow)"/>
  <rect x="8" y="8" width="484" height="484" rx="10" fill="none"
    stroke="${baseColor}" stroke-width="0.5" opacity="0.3"/>

  <!-- Corner decorations -->
  <polyline points="16,40 16,16 40,16" fill="none" stroke="${lightColor}" stroke-width="2"/>
  <polyline points="460,16 484,16 484,40" fill="none" stroke="${lightColor}" stroke-width="2"/>
  <polyline points="16,460 16,484 40,484" fill="none" stroke="${lightColor}" stroke-width="2"/>
  <polyline points="484,460 484,484 460,484" fill="none" stroke="${lightColor}" stroke-width="2"/>

  <!-- Top label -->
  <text x="250" y="44" text-anchor="middle" font-family="monospace"
    font-size="11" fill="${lightColor}" opacity="0.7" letter-spacing="4">VOXEL WARS</text>

  <!-- Avatar circle -->
  <circle cx="250" cy="155" r="80" fill="${darkColor}" stroke="${baseColor}"
    stroke-width="2.5" filter="url(#glow)"/>
  <circle cx="250" cy="155" r="74" fill="${darkColor}" stroke="${lightColor}"
    stroke-width="0.5" opacity="0.3"/>
  <text x="250" y="180" text-anchor="middle" font-size="72">${avatar}</text>

  <!-- Level badge -->
  <rect x="195" y="218" width="110" height="28" rx="14"
    fill="${baseColor}" stroke="${lightColor}" stroke-width="0.8"/>
  <text x="250" y="237" text-anchor="middle" font-family="monospace"
    font-size="13" fill="white" letter-spacing="2">LEVEL ${level}</text>

  <!-- Warrior name -->
  <text x="250" y="285" text-anchor="middle" font-family="monospace"
    font-size="22" fill="white" font-weight="bold" letter-spacing="2"
    filter="url(#glow)">WARRIOR</text>
  <text x="250" y="312" text-anchor="middle" font-family="monospace"
    font-size="16" fill="${lightColor}" letter-spacing="3">#${seedHex}</text>

  <!-- Divider -->
  <line x1="40" y1="330" x2="460" y2="330" stroke="${baseColor}"
    stroke-width="1" opacity="0.6"/>

  <!-- STAT BARS -->
  <!-- STR -->
  <text x="48" y="358" font-family="monospace" font-size="11"
    fill="#e74c3c" letter-spacing="1">STR</text>
  <text x="96" y="358" font-family="monospace" font-size="11"
    fill="white">${str}</text>
  <rect x="128" y="347" width="280" height="8" rx="4" fill="#1c1c28"/>
  <rect x="128" y="347" width="${strBar * 2.8}" height="8" rx="4" fill="url(#strg)"/>
  <text x="454" y="358" text-anchor="end" font-family="monospace"
    font-size="10" fill="#e74c3c" opacity="0.6">/ 25</text>

  <!-- DEX -->
  <text x="48" y="383" font-family="monospace" font-size="11"
    fill="#f1c40f" letter-spacing="1">DEX</text>
  <text x="96" y="383" font-family="monospace" font-size="11"
    fill="white">${dex}</text>
  <rect x="128" y="372" width="280" height="8" rx="4" fill="#1c1c28"/>
  <rect x="128" y="372" width="${dexBar * 2.8}" height="8" rx="4" fill="url(#dexg)"/>
  <text x="454" y="383" text-anchor="end" font-family="monospace"
    font-size="10" fill="#f1c40f" opacity="0.6">/ 25</text>

  <!-- INT -->
  <text x="48" y="408" font-family="monospace" font-size="11"
    fill="#00d4aa" letter-spacing="1">INT</text>
  <text x="96" y="408" font-family="monospace" font-size="11"
    fill="white">${intel}</text>
  <rect x="128" y="397" width="280" height="8" rx="4" fill="#1c1c28"/>
  <rect x="128" y="397" width="${intBar * 2.8}" height="8" rx="4" fill="url(#intg)"/>
  <text x="454" y="408" text-anchor="end" font-family="monospace"
    font-size="10" fill="#00d4aa" opacity="0.6">/ 25</text>

  <!-- Divider -->
  <line x1="40" y1="424" x2="460" y2="424" stroke="${baseColor}"
    stroke-width="1" opacity="0.4"/>

  <!-- Kills stat -->
  <text x="250" y="453" text-anchor="middle" font-family="monospace"
    font-size="13" fill="#e74c3c">${kills} KILLS ON-CHAIN</text>

  <!-- Chain badge -->
  <text x="250" y="480" text-anchor="middle" font-family="monospace"
    font-size="10" fill="${baseColor}" letter-spacing="3" opacity="0.8">ABEY BLOCKCHAIN</text>
</svg>`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { id } = req.query;
  const tokenId = parseInt(id);
  if (isNaN(tokenId) || tokenId < 1) {
    return res.status(400).send('Invalid token ID');
  }

  // Fallback stats derived from tokenId
  const t = tokenId;
  let strength     = 8  + (t * 7  % 17);
  let dexterity    = 5  + (t * 11 % 14);
  let intelligence = 3  + (t * 13 % 12);
  let level = 1, kills = 0;
  let seedHex = (t * 0xA3F2C1 % 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');

  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const nft      = new ethers.Contract(NFT_ADDRESS, NFT_ABI, provider);

    await nft.ownerOf(tokenId);

    // Find original minter via mint Transfer event
    let minterAddress = null;
    try {
      const evts = await nft.queryFilter(
        nft.filters.Transfer('0x0000000000000000000000000000000000000000', null, tokenId)
      );
      if (evts.length > 0) minterAddress = evts[0].args.to;
    } catch(_) {}

    if (minterAddress) {
      try {
        const stats  = await nft.getPlayerStats(minterAddress);
        strength     = Number(stats.strength      ?? stats[0] ?? strength);
        dexterity    = Number(stats.dexterity     ?? stats[1] ?? dexterity);
        intelligence = Number(stats.intelligence  ?? stats[2] ?? intelligence);
        level        = Number(stats.level         ?? stats[3] ?? 1);
        kills        = Number(stats.kills         ?? stats[6] ?? 0);
        const seedRaw = stats.seed ?? stats[8] ?? '0x';
        if (seedRaw && seedRaw.length > 2) seedHex = seedRaw.slice(2, 8).toUpperCase();
      } catch(_) {}
    }
  } catch(_) {
    // RPC failed — serve image with fallback stats so Fantase still shows something
  }

  const svg = generateWarriorSVG(tokenId, seedHex, strength, dexterity, intelligence, level, kills);

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).send(svg);
};
