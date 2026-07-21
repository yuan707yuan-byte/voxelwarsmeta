// api/warrior/[id].js
// VOXEL WARS — Warrior NFT Metadata API
// Deployed to meta.voxelwars.io
// Called by Fantase and any NFT marketplace reading tokenURI(id)
//
// Returns ERC-721 standard JSON for each warrior, reading live
// stats directly from the WarriorNFT contract on Abey Blockchain.

const { ethers } = require('ethers');

// ── CONTRACT CONFIG ──────────────────────────────────────────────
const NFT_ADDRESS = '0x278B7d52f3484F56AD0B6B3c12C67359295A4333';
const RPC_URL     = 'https://interrpc.abeychain.com';
const RPC_BACKUP  = 'https://rpc.abeychain.com';

const NFT_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function totalSupply() view returns (uint256)',
  'function getPlayerStats(address player) view returns (tuple(uint8 strength, uint8 dexterity, uint8 intelligence, uint8 level, uint256 xp, uint256 xpToNextLevel, uint256 kills, uint256 mintBlock, bytes32 seed))',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

// ── AVATAR SYMBOLS (same as frontend) ───────────────────────────
const AVATARS = ['⚔', '🗡', '🔱', '⚡', '🔥', '💀', '🛡', '🏹'];

// ── WARRIOR SVG GENERATOR ────────────────────────────────────────
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

// ── MAIN HANDLER ─────────────────────────────────────────────────
module.exports = async (req, res) => {
  // CORS — allow Fantase and any marketplace to read metadata
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  const tokenId = parseInt(id);

  if (isNaN(tokenId) || tokenId < 1) {
    return res.status(400).json({ error: 'Invalid token ID' });
  }

  let provider;
  try {
    provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  } catch (_) {
    provider = new ethers.providers.JsonRpcProvider(RPC_BACKUP);
  }

  try {
    const nft   = new ethers.Contract(NFT_ADDRESS, NFT_ABI, provider);

    // Step 1: Verify the token exists
    await nft.ownerOf(tokenId);

    // Step 2: Find the ORIGINAL MINTER via the mint Transfer event
    // Transfer from 0x0 → minter is the first event for every NFT.
    // The warrior stats are permanently tied to the original minting wallet
    // regardless of how many times the NFT has been transferred since.
    let strength = 8, dexterity = 5, intelligence = 3;
    let level = 1, xp = 0, xpToNext = 100, kills = 0, mintBlock = 0;
    let seedHex = tokenId.toString(16).toUpperCase().padStart(6, '0');

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const mintFilter   = nft.filters.Transfer(ZERO_ADDRESS, null, tokenId);

    let minterAddress = null;
    try {
      const mintEvents = await nft.queryFilter(mintFilter);
      if (mintEvents.length > 0) {
        minterAddress = mintEvents[0].args.to;
      }
    } catch (_) {}

    // Step 3: Get stats from original minter wallet
    // This works whether the NFT has been transferred or not — the stats
    // belong to the minter's game record, not the current holder's wallet.
    if (minterAddress) {
      try {
        const stats  = await nft.getPlayerStats(minterAddress);
        strength     = Number(stats.strength      ?? stats[0] ?? 8);
        dexterity    = Number(stats.dexterity     ?? stats[1] ?? 5);
        intelligence = Number(stats.intelligence  ?? stats[2] ?? 3);
        level        = Number(stats.level         ?? stats[3] ?? 1);
        xp           = Number(stats.xp            ?? stats[4] ?? 0);
        xpToNext     = Number(stats.xpToNextLevel ?? stats[5] ?? 100);
        kills        = Number(stats.kills         ?? stats[6] ?? 0);
        mintBlock    = Number(stats.mintBlock      ?? stats[7] ?? 0);
        const seedRaw = stats.seed ?? stats[8] ?? '0x';
        if (seedRaw && seedRaw.length > 2) {
          seedHex = seedRaw.slice(2, 8).toUpperCase();
        }
      } catch (statsErr) {
        // Minter registered but stats call failed — use token-derived seed
        console.log('[warrior/' + tokenId + '] stats error: ' + (statsErr.message || '').slice(0, 60));
      }
    }

    // Build SVG image inline — no IPFS hosting needed
    // Image served from dedicated public URL so marketplaces can display it
    const imageUri = `https://meta.voxelwars.io/image/${tokenId}`;

    const metadata = {
      name:         `Warrior #${seedHex}`,
      description:  `VOXEL WARS on-chain warrior on Abey Blockchain. Stats seeded permanently from block hash #${mintBlock}. Level ${level} warrior with ${kills} confirmed on-chain kills. Play at voxelwars.xyz.`,
      image:        imageUri,
      external_url: `https://voxelwars.xyz`,
      attributes: [
        { trait_type: 'Strength',      value: strength     },
        { trait_type: 'Dexterity',     value: dexterity    },
        { trait_type: 'Intelligence',  value: intelligence },
        { trait_type: 'Level',         value: level        },
        { trait_type: 'XP',            value: xp           },
        { trait_type: 'XP To Next',    value: xpToNext     },
        { trait_type: 'Kills',         value: kills        },
        { trait_type: 'Mint Block',    value: mintBlock,   display_type: 'number' },
        { trait_type: 'Seed',          value: seedHex      },
      ]
    };

    // Cache 5 minutes — stats change as players level up
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    return res.status(200).json(metadata);

  } catch (err) {
    console.error(`[warrior/${tokenId}]`, err.message);

    // Token does not exist
    if (
      err.message?.includes('nonexistent token') ||
      err.message?.includes('invalid token ID') ||
      err.message?.includes('ERC721: owner query')
    ) {
      return res.status(404).json({ error: `Warrior #${tokenId} does not exist` });
    }

    // RPC failure — retry with backup
    try {
      const backup  = new ethers.providers.JsonRpcProvider(RPC_BACKUP);
      const nft2    = new ethers.Contract(NFT_ADDRESS, NFT_ABI, backup);
      await nft2.ownerOf(tokenId);
      let minter2 = null;
      try {
        const evts2 = await nft2.queryFilter(
          nft2.filters.Transfer('0x0000000000000000000000000000000000000000', null, tokenId)
        );
        if (evts2.length > 0) minter2 = evts2[0].args.to;
      } catch(_) {}
      let stats2 = null;
      if (minter2) { try { stats2 = await nft2.getPlayerStats(minter2); } catch(_) {} }
      const level2  = stats2 ? Number(stats2.level ?? stats2[3] ?? 1) : 1;
      const kills2  = stats2 ? Number(stats2.kills ?? stats2[6] ?? 0) : 0;
      const seedR2  = stats2 ? (stats2.seed ?? stats2[8] ?? '0x') : '0x';
      const seedH2  = seedR2 && seedR2.length > 2 ? seedR2.slice(2,8).toUpperCase() : tokenId.toString(16).toUpperCase().padStart(6,'0');

      const svg2    = generateWarriorSVG(tokenId, seedH2,
        Number(stats2[0]??8), Number(stats2[1]??5), Number(stats2[2]??3), level2, kills2);

      return res.status(200).json({
        name:        `Warrior #${seedH2}`,
        description: `VOXEL WARS warrior on Abey Blockchain. Level ${level2}, ${kills2} kills.`,
        image:       `https://meta.voxelwars.io/image/${tokenId}`,
        external_url:'https://voxelwars.xyz',
        attributes: [
          { trait_type: 'Level', value: level2 },
          { trait_type: 'Kills', value: kills2 },
        ]
      });
    } catch (_) {
      return res.status(503).json({
        error:   'Abey RPC temporarily unavailable',
        details: err.message
      });
    }
  }
};
