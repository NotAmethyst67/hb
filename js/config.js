/* =========================================================
   config.js — Prapti's Birthday Website
   ========================================================= */

window.BDAY_CONFIG = {

  /* ── 5 Songs across different screens ───────────────────
     1. Opening: Tame Impala - The Less I Know The Better
     2. Chat:    Jung Kook (BTS) - Seven
     3. Cake:    BTS - Dynamite
     4. Curtain: Jennie - Mantra
     5. Gallery: The Kid LAROI & Justin Bieber - STAY
  ──────────────────────────────────────────────────────── */
  songs: {
    opening: 'assets/audio/song1_tame_impala.m4a',
    chat:    'assets/audio/song2_bts_chat.m4a',
    cake:    'assets/audio/song3_bts_cake.m4a',
    curtain: 'assets/audio/song4_jennie.m4a',
    gallery: 'assets/audio/song5_gallery_love.m4a',
  },

  /* ── Tae Portrait ────────────────────────────────────── */
  taePortrait: 'assets/v.jpg',

  /* ── Chat Conversation ─────────────────────────────────
     speaker: 'tae' | 'prapti'
     text: message displayed in chat bubble
     audio: voice clip to play
     reply: quick-reply button text for Prapti
  ──────────────────────────────────────────────────────── */
  conversation: [
    {
      speaker: 'tae',
      text: "Hey Prapti! It's your birthday today! ♡",
      audio: 'assets/audio/tae1.mp3',
    },
    {
      speaker: 'prapti',
      text: "Yup! But… how do you even know that? 🤍",
      audio: 'assets/audio/p1.mp3',
      reply: ["Yup! But… how do you even know that? 🤍"],
    },
    {
      speaker: 'tae',
      text: "NotAmethyst told me~ And I'm so glad they did. ♡",
      audio: 'assets/audio/tae2.mp3',
    },
    {
      speaker: 'tae',
      text: "Wishing you the happiest birthday ever, Prapti! You deserve every bit of it. ♡",
      audio: 'assets/audio/tae3.mp3',
    },
    {
      speaker: 'prapti',
      text: "Thank you Tae 🤍",
      audio: 'assets/audio/p2.mp3',
      reply: ["Thank you Tae 🤍"],
    },
    {
      speaker: 'tae',
      text: "Oh, and… I have a little surprise for you. ♡",
      audio: 'assets/audio/tae4.mp3',
    },
    {
      speaker: 'prapti',
      text: "That's so sweet 🤍",
      audio: 'assets/audio/p3.mp3',
      reply: ["That's so sweet 🤍"],
    },
    {
      speaker: 'tae',
      text: "Wait… ♡",
      audio: 'assets/audio/tae5.mp3',
    },
  ],

  /* ── Cake Scene ──────────────────────────────────────── */
  cake: {
    instruction: "make a wish, prapti ♡",
    blowHint: "tap the candles to blow them out ♡",
    cutHint: "now take the knife and slice your cake ♡",
    blownMessage: "your wish is floating into the stars... ♡",
    cutMessage: "the cake is sliced! celebration time! ♡",
  },

  /* ── Stage & Curtains ────────────────────────────────── */
  stage: {
    prompt: "The stage is set for you, Prapti. Pull the golden cord ♡",
  },

  /* ── Prapti's Memories (Verified Real Photos on Disk) ── */
  photos: [
    { src: 'assets/special.jpg',                   caption: 'our most special memory of all ♡' },
    { src: 'assets/IMG_20261028_062338_804.jpg',   caption: 'a smile that lights up everything ♡' },
    { src: 'assets/IMG_20261028_062338_804_1.jpg', caption: 'pure sunshine ♡' },
    { src: 'assets/IMG_20261028_062338_804_2.jpg', caption: 'that soft aesthetic vibe ♡' },
    { src: 'assets/IMG_20261028_062338_912_7.jpg', caption: 'effortlessly pretty ♡' },
    { src: 'assets/IMG_20261028_062338_922_8.jpg', caption: 'making memories unforgettable ♡' },
    { src: 'assets/IMG_20261028_062339_523_9.jpg', caption: 'cherished snapshots ♡' },
    { src: 'assets/IMG_20261028_062349_054.jpg',   caption: 'the warmth in your eyes ♡' },
    { src: 'assets/IMG_20261028_062349_055_1.jpg', caption: 'radiating pure joy ♡' },
    { src: 'assets/IMG_20261028_062349_056_2.jpg', caption: 'golden hour glow ♡' },
    { src: 'assets/IMG_20261028_062349_117_3.jpg', caption: 'soft and sweet ♡' },
    { src: 'assets/IMG_20261028_062349_126_4.jpg', caption: 'always adorable ♡' },
    { src: 'assets/IMG_20261028_062349_172_6.jpg', caption: 'little glimpses of beauty ♡' },
    { src: 'assets/IMG_20261028_062349_193_7.jpg', caption: 'a heart of gold 🤍' },
    { src: 'assets/IMG_20261028_062349_196_8.jpg', caption: 'candid perfection ♡' },
    { src: 'assets/IMG_20261028_062349_460_9.jpg', caption: 'every frame tells a story ♡' },
    { src: 'assets/IMG_20261028_062353_083.jpg',   caption: 'so genuinely you ♡' },
    { src: 'assets/IMG_20261028_062353_083_1.jpg', caption: 'delightful and charming ♡' },
    { src: 'assets/IMG_20261028_062353_084_2.jpg', caption: 'bringing smiles everywhere ♡' },
    { src: 'assets/IMG_20261028_062353_123_3.jpg', caption: 'the prettiest laughter ♡' },
    { src: 'assets/IMG_20261028_062353_140_4.jpg', caption: 'dreamy and timeless ♡' },
    { src: 'assets/IMG_20261028_062353_141_5.jpg', caption: 'sparkle in every look ♡' },
    { src: 'assets/IMG_20261028_062353_158_6.jpg', caption: 'precious everyday moments ♡' },
    { src: 'assets/IMG_20261028_062353_183_7.jpg', caption: 'calm and lovely 🤍' },
    { src: 'assets/IMG_20261028_062353_203_8.jpg', caption: 'a vibe everyone loves ♡' },
    { src: 'assets/IMG_20261028_062353_249_9.jpg', caption: 'shining bright as ever ♡' },
    { src: 'assets/IMG_20261028_062413_709_1.jpg', caption: 'vintage aesthetic feel ♡' },
    { src: 'assets/IMG_20261028_062413_709_2.jpg', caption: 'one in a million ♡' },
    { src: 'assets/IMG_20261028_062413_765_3.jpg', caption: 'sweetest soul ♡' },
    { src: 'assets/IMG_20261028_062413_782_4.jpg', caption: 'memories we treasure forever 🤍' },
    { src: 'assets/IMG_20261028_062413_798_5.jpg', caption: 'brightening every day ♡' },
    { src: 'assets/IMG_20261028_062413_818_6.jpg', caption: 'never lose this magic ♡' },
    { src: 'assets/IMG_20261028_062413_838_7.jpg', caption: 'so full of wonder ♡' },
    { src: 'assets/IMG_20261028_062413_849_8.jpg', caption: 'gentle grace ♡' },
    { src: 'assets/IMG_20261028_062413_870_9.jpg', caption: 'a true masterpiece ♡' },
    { src: 'assets/IMG_20261028_062446_994.jpg',   caption: 'the sweetest memories ♡' },
    { src: 'assets/IMG_20261028_062446_995_1.jpg', caption: 'today is all about you ♡' },
    { src: 'assets/IMG_20261028_062446_996_2.jpg', caption: 'happy birthday Prapti! ♡' },
    { src: 'assets/IMG_20261028_062447_052_3.jpg', caption: 'wishing you the universe ♡' },
    { src: 'assets/IMG_20261028_062447_068_5.jpg', caption: 'always be this happy ♡' },
    { src: 'assets/IMG_20261028_062447_143_6.jpg', caption: 'cherishing every second ♡' },
    { src: 'assets/IMG_20261028_062447_145_7.jpg', caption: 'forever special ♡' },
    { src: 'assets/IMG_20261028_062447_154_8.jpg', caption: 'the happiest birthday to you 🤍' },
    { src: 'assets/IMG_20261028_062447_171_9.jpg', caption: 'here is to a beautiful year ahead! ♡' },
  ],

  /* ── Grand Finale Letter ─────────────────────────────── */
  letter: {
    title: "To Prapti ♡",
    body: "You bring so much warmth, kindness, and light into this world. On your birthday, may every dream of yours turn into reality. You are loved, celebrated, and deeply appreciated. Have the happiest birthday ever! ♡",
    from: "With love, NotAmethyst ♡",
  }
};
