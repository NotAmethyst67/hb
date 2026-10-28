/* =========================================================
   app.js — Prapti's Birthday Website (Grand Celebration)
   ========================================================= */
(function () {
  'use strict';

  const C = window.BDAY_CONFIG;

  /* ── DOM Helper Shortcuts ────────────────────────────── */
  const $ = id => document.getElementById(id);
  const show = el => { if (el) el.style.display = ''; };
  const hide = el => { if (el) el.style.display = 'none'; };
  const delay = ms => new Promise(r => setTimeout(r, ms));

  /* ── Scene Controller ────────────────────────────────── */
  let currentScene = 'opening';

  function goToScene(name) {
    const prev = $(`scene-${currentScene}`);
    const next = $(`scene-${name}`);
    if (prev) prev.classList.remove('scene--active');
    if (next) next.classList.add('scene--active');
    currentScene = name;

    // Crossfade background music to match scene mood
    playSceneMusic(name);

    // Notify scene enter
    if (name === 'chat')    onEnterChat();
    if (name === 'cake')    onEnterCake();
    if (name === 'stage')   onEnterStage();
    if (name === 'heart')   onEnterHeart();
    if (name === 'gallery') onEnterGallery();
  }
  window.goToScene = goToScene;

  /* ══════════════════════════════════════════════════════════
     AUDIO & SFX ENGINE (Web Audio API Synthesizer + Voice Notes)
     ══════════════════════════════════════════════════════════ */
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Pure Silent SFX System (Zero harsh synthetic noise; keeps focus purely on the real voices)
  const sfx = {
    puff() {},
    slice() {},
    pop() {},
    curtain() {},
    heartbeat() {},
    sparkle() {},
    click() {},
    tick() {}
  };

  // Pre-load audio pool for instant voice note playback
  const voiceCache = {};
  function preloadVoices() {
    C.conversation.forEach(item => {
      if (item.audio && !voiceCache[item.audio]) {
        const a = new Audio();
        a.preload = 'auto';
        a.src = item.audio;
        a.volume = 1.0;
        voiceCache[item.audio] = a;
      }
    });
  }

  // Audio unlocker (Web Audio + HTML5 Audio) for all browsers
  function unlockAudioEngine() {
    getAudioContext();
    try {
      const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      silent.volume = 0.01;
      silent.play().catch(() => {});
    } catch (e) {}
    preloadVoices();
  }

  // Dedicated Active Voice Controller
  let activeVoiceAudio = null;
  let activeVoicePill  = null;

  function stopCurrentVoice() {
    if (activeVoiceAudio) {
      try {
        activeVoiceAudio.pause();
        activeVoiceAudio.currentTime = 0;
      } catch (e) {}
      activeVoiceAudio = null;
    }
    if (activeVoicePill) {
      activeVoicePill.classList.remove('playing');
      activeVoicePill = null;
    }
    const wave = $('taeVoiceWave');
    if (wave) wave.classList.remove('speaking');
  }

  // Play a voice note with promise (cannot be stopped midway to prevent conversation hang)
  function playVoice(src, pillElement) {
    return new Promise(resolve => {
      if (!src) { resolve(); return; }
      stopCurrentVoice();
      duckMusic(); // Softly duck background music so voice note is crystal clear

      const audio = voiceCache[src] || new Audio(src);
      audio.volume = 1.0;
      audio.currentTime = 0;
      activeVoiceAudio = audio;

      if (pillElement) {
        activeVoicePill = pillElement;
        pillElement.classList.add('playing');
      }

      const wave = $('taeVoiceWave');
      if (wave) wave.classList.add('speaking');

      let finished = false;
      const onDone = () => {
        if (!finished) {
          finished = true;
          if (activeVoiceAudio === audio) activeVoiceAudio = null;
          if (pillElement) {
            pillElement.classList.remove('playing');
          }
          if (wave) wave.classList.remove('speaking');
          unduckMusic(); // Smoothly restore background music volume
          resolve();
        }
      };

      audio.onended = onDone;
      audio.onerror = (err) => {
        console.warn('Voice playback error for ' + src, err);
        onDone();
      };

      // Safety timeout: ensure conversation never hangs
      audio.addEventListener('loadedmetadata', () => {
        const timeout = ((audio.duration && !isNaN(audio.duration)) ? audio.duration * 1000 : 4000) + 700;
        setTimeout(onDone, timeout);
      }, { once: true });
      setTimeout(onDone, 9000);

      const p = audio.play();
      if (p !== undefined) {
        p.catch(err => {
          console.warn('Voice play() rejected for ' + src, err);
          setTimeout(onDone, 1800);
        });
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     BACKGROUND MUSIC ENGINE (Multi-scene crossfade + audio ducking)
     ══════════════════════════════════════════════════════════ */
  const bgMusicAudio  = $('bgMusicAudio') || new Audio();
  const btnHudMusic   = $('btnHudMusic');
  const hudMusicBars  = $('hudMusicBars');
  const hudMusicTitle = $('hudMusicTitle');

  const SONG_TITLES = {
    'assets/audio/song1_tame_impala.m4a': 'tame impala ♡ the less i know the better',
    'assets/audio/song2_bts_chat.m4a': 'jung kook (bts) ♡ seven',
    'assets/audio/song3_bts_cake.m4a': 'bts ♡ dynamite',
    'assets/audio/song4_jennie.m4a': 'jennie ♡ mantra',
    'assets/audio/song5_gallery_love.m4a': 'the kid laroi & justin bieber ♡ stay',
  };

  let currentSongSrc = '';
  let isMusicMuted   = false;
  let musicFadeTimer = null;
  // Ambient, subtle low volume so it never overpowers voices or startles
  const NORMAL_VOL   = 0.09;
  const DUCKED_VOL   = 0.02;

  function playSceneMusic(sceneName) {
    if (isMusicMuted) return;
    let targetSrc = '';
    if (sceneName === 'opening') targetSrc = C.songs.opening;
    else if (sceneName === 'chat') targetSrc = C.songs.chat;
    else if (sceneName === 'cake') targetSrc = C.songs.cake;
    else if (sceneName === 'stage' || sceneName === 'heart') targetSrc = C.songs.curtain;
    else if (sceneName === 'gallery') targetSrc = C.songs.gallery;

    if (!targetSrc) return;
    if (targetSrc === currentSongSrc) {
      // If already set to this track but paused (e.g. browser autoplay block), start it!
      if (bgMusicAudio.paused) {
        bgMusicAudio.volume = 0;
        bgMusicAudio.play().then(() => {
          if (btnHudMusic) btnHudMusic.classList.remove('paused');
          let v = 0;
          if (musicFadeTimer) clearInterval(musicFadeTimer);
          musicFadeTimer = setInterval(() => {
            v = Math.min(NORMAL_VOL, v + 0.01);
            bgMusicAudio.volume = v;
            if (v >= NORMAL_VOL) clearInterval(musicFadeTimer);
          }, 40);
        }).catch(() => {});
      }
      return;
    }
    crossFadeTo(targetSrc);
  }

  function crossFadeTo(newSrc) {
    currentSongSrc = newSrc;
    if (hudMusicTitle) {
      hudMusicTitle.textContent = SONG_TITLES[newSrc] || 'music ♡';
    }

    if (musicFadeTimer) clearInterval(musicFadeTimer);

    if (!bgMusicAudio.paused && bgMusicAudio.src) {
      let v = bgMusicAudio.volume;
      musicFadeTimer = setInterval(() => {
        v = Math.max(0, v - 0.02);
        bgMusicAudio.volume = v;
        if (v <= 0.01) {
          clearInterval(musicFadeTimer);
          startSong(newSrc);
        }
      }, 40);
    } else {
      startSong(newSrc);
    }
  }

  function startSong(src) {
    bgMusicAudio.src = src;
    bgMusicAudio.volume = 0;
    const p = bgMusicAudio.play();
    if (p !== undefined) {
      p.then(() => {
        if (btnHudMusic) btnHudMusic.classList.remove('paused');
        let v = 0;
        musicFadeTimer = setInterval(() => {
          v = Math.min(NORMAL_VOL, v + 0.01);
          bgMusicAudio.volume = v;
          if (v >= NORMAL_VOL) clearInterval(musicFadeTimer);
        }, 50);
      }).catch(() => {
        // Autoplay may wait for user interaction
        if (btnHudMusic) btnHudMusic.classList.add('paused');
      });
    }
  }

  function duckMusic() {
    if (bgMusicAudio && !bgMusicAudio.paused) {
      bgMusicAudio.volume = DUCKED_VOL;
    }
  }

  function unduckMusic() {
    if (bgMusicAudio && !bgMusicAudio.paused && !isMusicMuted) {
      let v = bgMusicAudio.volume;
      const t = setInterval(() => {
        v = Math.min(NORMAL_VOL, v + 0.01);
        bgMusicAudio.volume = v;
        if (v >= NORMAL_VOL) clearInterval(t);
      }, 40);
    }
  }

  bgMusicAudio.addEventListener('play', () => {
    if (btnHudMusic) btnHudMusic.classList.remove('paused');
  });
  bgMusicAudio.addEventListener('pause', () => {
    if (btnHudMusic) btnHudMusic.classList.add('paused');
  });

  if (btnHudMusic) {
    btnHudMusic.addEventListener('click', () => {
      if (bgMusicAudio.paused) {
        isMusicMuted = false;
        btnHudMusic.classList.remove('paused');
        if (!bgMusicAudio.src && currentSongSrc) bgMusicAudio.src = currentSongSrc;
        bgMusicAudio.play().catch(() => {});
      } else {
        isMusicMuted = true;
        btnHudMusic.classList.add('paused');
        bgMusicAudio.pause();
      }
    });
  }

  // Play opening song right away on page load!
  playSceneMusic('opening');

  // Also bind one-touch listeners on all interaction events to unlock audio on first touch if browser blocked autoplay
  const unlockOpeningAudio = () => {
    if (isMusicMuted) return;
    if (bgMusicAudio.paused) {
      if (!bgMusicAudio.src) {
        bgMusicAudio.src = C.songs.opening;
        currentSongSrc = C.songs.opening;
      }
      bgMusicAudio.volume = 0;
      const p = bgMusicAudio.play();
      if (p !== undefined) {
        p.then(() => {
          if (btnHudMusic) btnHudMusic.classList.remove('paused');
          let v = 0;
          if (musicFadeTimer) clearInterval(musicFadeTimer);
          musicFadeTimer = setInterval(() => {
            v = Math.min(NORMAL_VOL, v + 0.01);
            bgMusicAudio.volume = v;
            if (v >= NORMAL_VOL) clearInterval(musicFadeTimer);
          }, 40);
        }).catch(() => {});
      }
    }
    ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
      window.removeEventListener(evt, unlockOpeningAudio);
    });
  };
  ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlockOpeningAudio, { passive: true });
  });

  /* ══════════════════════════════════════════════════════════
     AMBIENT STAR CANVAS (Dreamy twinkling atmosphere)
     ══════════════════════════════════════════════════════════ */
  (function initAmbientCanvas() {
    const canvas = $('ambientCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const stars = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.7 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      dy: Math.random() * 0.2 + 0.05,
      isLavender: Math.random() > 0.45,
    }));

    function loop() {
      ctx.clearRect(0, 0, width, height);
      stars.forEach(s => {
        s.alpha += s.pulseSpeed;
        if (s.alpha > 0.9 || s.alpha < 0.2) s.pulseSpeed = -s.pulseSpeed;
        s.y -= s.dy;
        if (s.y < 0) s.y = height;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.isLavender ? `rgba(201, 182, 228, ${s.alpha})` : `rgba(255, 255, 255, ${s.alpha})`;
        ctx.shadowBlur = s.r * 4;
        ctx.shadowColor = s.isLavender ? '#c9b6e4' : '#ffffff';
        ctx.fill();
      });
      requestAnimationFrame(loop);
    }
    loop();
  })();

  /* ══════════════════════════════════════════════════════════
     SCENE 1: OPENING
     ══════════════════════════════════════════════════════════ */
  const btnStart = $('btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      unlockAudioEngine();
      sfx.sparkle();
      goToScene('chat');
    });
  }

  /* ══════════════════════════════════════════════════════════
     SCENE 2: CHATS (Tae ↔ Prapti)
     ══════════════════════════════════════════════════════════ */
  const chatFeed        = $('chatFeed');
  const typingIndicator = $('typingIndicator');
  const typingLabel     = $('typingLabel');
  const chatReplyBar    = $('chatReplyBar');
  const taeVoiceWave    = $('taeVoiceWave');
  const chatStatus      = $('chatStatus');
  let convStep = 0;

  function onEnterChat() {
    convStep = 0;
    if (chatFeed) chatFeed.innerHTML = '';
    hide(chatReplyBar);
    runNextChatStep();
  }

  async function runNextChatStep() {
    const list = C.conversation;
    if (convStep >= list.length) {
      await delay(800);
      goToScene('cake');
      return;
    }

    const item = list[convStep];

    if (item.speaker === 'tae') {
      // Tae speaking
      if (chatStatus) chatStatus.textContent = 'recording voice note...';
      if (typingLabel) typingLabel.textContent = 'Tae is speaking...';
      show(typingIndicator);
      scrollChat();

      await delay(750);
      hide(typingIndicator);

      const pill = appendChatBubble('tae', item.text, item.audio);
      scrollChat();

      if (chatStatus) chatStatus.textContent = 'speaking... ♡';
      await playVoice(item.audio, pill);
      if (chatStatus) chatStatus.textContent = 'online ♡';

      convStep++;
      if (convStep >= list.length) {
        // AUTOMATIC TRANSITION TO CAKE SCENE!
        await delay(900);
        goToScene('cake');
      } else {
        await delay(500);
        runNextChatStep();
      }

    } else if (item.speaker === 'prapti') {
      // Prapti quick replies
      if (chatReplyBar) {
        chatReplyBar.innerHTML = '';
        show(chatReplyBar);

        item.reply.forEach(replyText => {
          const chip = document.createElement('button');
          chip.className = 'chat-reply-chip';
          chip.textContent = replyText;
          chip.addEventListener('click', async () => {
            sfx.click();
            hide(chatReplyBar);
            const pill = appendChatBubble('prapti', item.text, item.audio);
            scrollChat();

            if (item.audio) {
              await playVoice(item.audio, pill);
            } else {
              await delay(600);
            }

            convStep++;
            await delay(400);
            runNextChatStep();
          });
          chatReplyBar.appendChild(chip);
        });
        scrollChat();
      }
    }
  }

  function appendChatBubble(speaker, text, audioUrl) {
    if (!chatFeed) return null;
    const row = document.createElement('div');
    row.className = `chat-msg-row chat-msg-row--${speaker}`;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble chat-bubble--${speaker}`;

    const textP = document.createElement('div');
    textP.textContent = text;
    bubble.appendChild(textP);

    let pill = null;
    if (audioUrl) {
      pill = document.createElement('div');
      pill.className = 'voice-note-pill';
      pill.innerHTML = `
        <span class="play-circle"><svg viewBox="0 0 24 24" fill="currentColor" style="width:10px;height:10px;margin-left:1px;"><polygon points="6 4 19 12 6 20"></polygon></svg></span>
        <div class="voice-mini-bars">
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
        <span class="voice-dur">voice note ♡</span>
      `;
      bubble.appendChild(pill);
    }

    row.appendChild(bubble);
    chatFeed.appendChild(row);
    return pill;
  }

  function scrollChat() {
    if (chatFeed) chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  /* ══════════════════════════════════════════════════════════
     SCENE 3: CAKE CUTTING & POPPERS CELEBRATION
     ══════════════════════════════════════════════════════════ */
  const cakeInstruction   = $('cakeInstruction');
  const cakeHint          = $('cakeHint');
  const btnBlowCandles    = $('btnBlowCandles');
  const btnCutCake        = $('btnCutCake');
  const cakeKnife         = $('cakeKnife');
  const cakeCutGroup      = $('cakeCutGroup');
  const cakeCutLine       = $('cakeCutLine');
  const celebrationBanner = $('celebrationBanner');
  const cakeSmoke         = $('cakeSmoke');

  let candlesBlown = false;
  let cakeCutDone  = false;

  const candleWickCoords = [
    { x: 158, y: 56 },
    { x: 183, y: 48 },
    { x: 210, y: 42 },
    { x: 237, y: 48 },
    { x: 262, y: 56 }
  ];

  function onEnterCake() {
    candlesBlown = false;
    cakeCutDone  = false;
    if (cakeInstruction) cakeInstruction.textContent = C.cake.instruction;
    if (cakeHint) cakeHint.textContent = C.cake.blowHint;

    show(btnBlowCandles);
    hide(btnCutCake);
    hide(cakeCutGroup);
    if (cakeCutLine) cakeCutLine.style.display = 'none';
    hide(celebrationBanner);
    if (cakeSmoke) cakeSmoke.innerHTML = '';
    if (cakeKnife) cakeKnife.classList.remove('cutting');

    // Restore candles
    document.querySelectorAll('.candle-unit').forEach(c => {
      c.classList.remove('blown');
      const flame = c.querySelector('.candle-flame');
      const halo  = c.querySelector('.flame-halo');
      if (flame) flame.style.display = '';
      if (halo)  halo.style.display = '';
    });
  }

  // Blow Candles
  if (btnBlowCandles) btnBlowCandles.addEventListener('click', blowCandlesSequence);
  document.querySelectorAll('.candle-unit').forEach(c => {
    c.addEventListener('click', blowCandlesSequence);
  });

  function blowCandlesSequence() {
    if (candlesBlown) return;
    candlesBlown = true;
    hide(btnBlowCandles);

    // Play breath puff sound
    sfx.puff();

    const candles = document.querySelectorAll('.candle-unit');
    candles.forEach((c, i) => {
      setTimeout(() => {
        c.classList.add('blown');
        const pos = candleWickCoords[i] || { x: 210, y: 45 };
        spawnSmokePuffAt(pos.x, pos.y);
        spawnExtinguishSparkles(pos.x, pos.y);

        // Hide flame after blow animation completes
        setTimeout(() => {
          const flame = c.querySelector('.candle-flame');
          const halo  = c.querySelector('.flame-halo');
          if (flame) flame.style.display = 'none';
          if (halo)  halo.style.display = 'none';
        }, 400);
      }, i * 95);
    });

    setTimeout(() => {
      if (cakeInstruction) cakeInstruction.textContent = C.cake.blownMessage;
      if (cakeHint) cakeHint.textContent = C.cake.cutHint;
      show(btnCutCake);
    }, candles.length * 95 + 400);
  }

  function spawnSmokePuffAt(tx, ty) {
    if (!cakeSmoke) return;
    for (let i = 0; i < 4; i++) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', tx);
      circle.setAttribute('cy', ty);
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', 'rgba(235, 230, 245, 0.65)');
      cakeSmoke.appendChild(circle);

      let t = 0;
      const drift = (Math.random() - 0.5) * 2;
      const interval = setInterval(() => {
        t += 0.05;
        circle.setAttribute('cy', ty - t * 26);
        circle.setAttribute('cx', tx + t * drift * 12);
        circle.setAttribute('r', 3 + t * 7);
        circle.setAttribute('fill', `rgba(235, 230, 245, ${Math.max(0, 0.65 - t * 0.75)})`);
        if (t >= 0.9) {
          clearInterval(interval);
          circle.remove();
        }
      }, 35);
    }
  }

  function spawnExtinguishSparkles(tx, ty) {
    if (!cakeSmoke) return;
    for (let i = 0; i < 3; i++) {
      const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      star.setAttribute('cx', tx);
      star.setAttribute('cy', ty);
      star.setAttribute('r', '2');
      star.setAttribute('fill', i % 2 === 0 ? '#c9b6e4' : '#ffffff');
      cakeSmoke.appendChild(star);

      let step = 0;
      const angle = (Math.random() * Math.PI) + Math.PI;
      const spd = Math.random() * 1.5 + 1;
      const intv = setInterval(() => {
        step += 0.08;
        star.setAttribute('cx', tx + Math.cos(angle) * step * 16 * spd);
        star.setAttribute('cy', ty + Math.sin(angle) * step * 16 * spd);
        star.setAttribute('opacity', Math.max(0, 1 - step));
        if (step >= 1) {
          clearInterval(intv);
          star.remove();
        }
      }, 35);
    }
  }

  // Cut Cake
  if (btnCutCake) btnCutCake.addEventListener('click', cutCakeSequence);
  if (cakeKnife)  cakeKnife.addEventListener('click', cutCakeSequence);

  function cutCakeSequence() {
    if (cakeCutDone) return;
    cakeCutDone = true;
    hide(btnCutCake);

    // Knife slicing motion
    if (cakeKnife) cakeKnife.classList.add('cutting');

    // Play blade slice sound
    setTimeout(() => {
      sfx.slice();
    }, 280);

    // Mid-cut: reveal the clean golden cut incision line on the whole cake
    setTimeout(() => {
      show(cakeCutGroup);
      if (cakeCutLine) cakeCutLine.style.display = '';
      spawnCutLineSparkles();
    }, 600);

    // Slice complete: Trigger celebratory party poppers!
    setTimeout(() => {
      if (cakeInstruction) cakeInstruction.textContent = C.cake.cutMessage;
      if (cakeHint) cakeHint.textContent = '';
      hide(btnCutCake);

      sfx.pop();
      show(celebrationBanner);
      triggerConfettiPoppers();

      // After 3.5s celebration, smoothly zoom out & transition to Grand Stage!
      setTimeout(() => {
        goToScene('stage');
      }, 3500);

    }, 1100);
  }

  function spawnCutLineSparkles() {
    if (!cakeSmoke) return;
    for (let i = 0; i < 8; i++) {
      const cy = 110 + i * 26;
      const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      star.setAttribute('cx', 210);
      star.setAttribute('cy', cy);
      star.setAttribute('r', '2.5');
      star.setAttribute('fill', '#ffffff');
      cakeSmoke.appendChild(star);

      let t = 0;
      const side = (i % 2 === 0 ? 1 : -1) * (Math.random() * 12 + 6);
      const timer = setInterval(() => {
        t += 0.08;
        star.setAttribute('cx', 210 + t * side);
        star.setAttribute('opacity', Math.max(0, 1 - t));
        if (t >= 1) {
          clearInterval(timer);
          star.remove();
        }
      }, 35);
    }
  }

  /* ══════════════════════════════════════════════════════════
     PARTY POPPERS CONFETTI SYSTEM
     ══════════════════════════════════════════════════════════ */
  function triggerConfettiPoppers() {
    const canvas = $('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Strict 4-color theme: Wine, Lavender, White, Matte Black
    const colors = ['#6b1d2f', '#8a2840', '#a4324e', '#45101d', '#c9b6e4', '#d8c8ed', '#ede5f8', '#ffffff', '#1e1a24'];
    const particles = [];

    // Left cannon
    for (let i = 0; i < 95; i++) {
      particles.push(createPopperParticle(0, canvas.height, Math.PI * 0.25 + (Math.random() - 0.5) * 0.45, colors));
    }
    // Right cannon
    for (let i = 0; i < 95; i++) {
      particles.push(createPopperParticle(canvas.width, canvas.height, Math.PI * 0.75 + (Math.random() - 0.5) * 0.45, colors));
    }

    let raf;
    const start = Date.now();

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18; // gravity
        p.rot += p.rotSpeed;
        p.alpha -= 0.003;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.w/2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (Date.now() - start < 4500) {
        raf = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(raf);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    draw();
  }

  function createPopperParticle(originX, originY, baseAngle, colors) {
    const speed = Math.random() * 15 + 10;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(baseAngle) * speed,
      vy: -Math.sin(baseAngle) * speed,
      w: Math.random() * 9 + 4,
      h: Math.random() * 5 + 3,
      shape: Math.random() > 0.3 ? 'rect' : 'circle',
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.16,
      alpha: 1,
    };
  }

  /* ══════════════════════════════════════════════════════════
     SCENE 4: GRAND THEATRE STAGE & VELVET CURTAINS
     ══════════════════════════════════════════════════════════ */
  const curtainContainer = $('curtainContainer');
  const curtainCord      = $('curtainCord');
  const curtainCordWrap  = $('curtainCordWrap');
  const cordHint         = $('cordHint');
  let curtainsOpen       = false;

  function onEnterStage() {
    curtainsOpen = false;
    if (curtainContainer) curtainContainer.classList.remove('opened');
    show(curtainCordWrap);
    if (cordHint) cordHint.textContent = C.stage.prompt;
  }

  if (curtainCord) curtainCord.addEventListener('click', pullCurtainsOpen);

  function pullCurtainsOpen() {
    if (curtainsOpen) return;
    curtainsOpen = true;

    // Pull cord downwards with sound
    sfx.curtain();
    if (curtainCord) curtainCord.style.transform = 'translateY(55px)';
    setTimeout(() => {
      if (curtainCordWrap) {
        curtainCordWrap.style.transition = 'opacity 0.6s';
        curtainCordWrap.style.opacity = '0';
      }
    }, 300);

    // Part velvet curtains
    setTimeout(() => {
      if (curtainContainer) curtainContainer.classList.add('opened');
    }, 450);

    // Curtains open -> Transition to Photo Heart Mosaic!
    setTimeout(() => {
      goToScene('heart');
    }, 1800);
  }

  /* ══════════════════════════════════════════════════════════
     SCENE 4B: PHOTO HEART MOSAIC & NOTAMETHYST DEDICATION
     ══════════════════════════════════════════════════════════ */
  const photoHeartMosaic    = $('photoHeartMosaic');
  const heartDedicationCard = $('heartDedicationCard');
  const typewriterTitle     = $('typewriterTitle');
  const typewriterBody      = $('typewriterBody');
  const typewriterSign      = $('typewriterSign');
  const btnEnterShowcase    = $('btnEnterShowcase');
  let heartAutoAdvanceTimer  = null;

  function onEnterHeart() {
    if (photoHeartMosaic) {
      photoHeartMosaic.innerHTML = '';
      photoHeartMosaic.classList.remove('expanded');
    }
    if (heartDedicationCard) heartDedicationCard.classList.remove('visible');
    if (typewriterTitle) typewriterTitle.textContent = '';
    if (typewriterBody)  typewriterBody.textContent  = '';
    if (typewriterSign)  typewriterSign.textContent  = '';
    hide(btnEnterShowcase);

    // 1. Position all 43 real photos in mathematical heart curve
    renderHeartMosaic();

    // 2. Play heartbeat sound & trigger "Small to Big" Heart Animation
    setTimeout(() => {
      sfx.heartbeat();
      if (photoHeartMosaic) photoHeartMosaic.classList.add('expanded');
    }, 150);

    // 3. Reveal dedication card & start typewriter text
    setTimeout(() => {
      if (heartDedicationCard) heartDedicationCard.classList.add('visible');
      startTypewriterDedication();
    }, 1400);
  }

  function renderHeartMosaic() {
    if (!photoHeartMosaic) return;
    photoHeartMosaic.innerHTML = '';
    const photos = C.photos;
    const count = photos.length; // 43

    const radiusX = Math.min(window.innerWidth * 0.42, 195);
    const radiusY = Math.min(window.innerHeight * 0.38, 190);

    const outerCount = 25;
    for (let i = 0; i < count; i++) {
      let x, y, rot;
      if (i < outerCount) {
        const t = (i / outerCount) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
        x = (hx / 17) * radiusX;
        y = (hy / 17) * radiusY;
        rot = (Math.random() - 0.5) * 16;
      } else {
        const innerIdx = i - outerCount;
        const innerCount = count - outerCount;
        const t = (innerIdx / innerCount) * Math.PI * 2;
        const scale = 0.52 + (innerIdx % 3) * 0.12;
        const hx = 16 * Math.pow(Math.sin(t), 3) * scale;
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * scale;
        x = (hx / 17) * radiusX;
        y = (hy / 17) * radiusY;
        rot = (Math.random() - 0.5) * 22;
      }

      const tile = document.createElement('div');
      tile.className = 'heart-tile';
      tile.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
      tile.innerHTML = `<img src="${photos[i].src}" alt="Prapti">`;
      photoHeartMosaic.appendChild(tile);
    }
  }

  async function startTypewriterDedication() {
    const titleText = "Happy Birthday, Prapti ♡";
    const bodyText  = "May your day and this whole year be as radiant, joyful, and wonderful as your smile.";
    const signText  = "— With love, NotAmethyst ♡";

    sfx.sparkle();
    await typeText(typewriterTitle, titleText, 50);
    await delay(300);
    await typeText(typewriterBody, bodyText, 28);
    await delay(250);
    sfx.sparkle();
    await typeText(typewriterSign, signText, 40);

    show(btnEnterShowcase);

    // Auto-advance to memory showcase after 6.5s
    heartAutoAdvanceTimer = setTimeout(() => {
      goToScene('gallery');
    }, 6500);
  }

  function typeText(element, text, speed) {
    return new Promise(resolve => {
      if (!element) { resolve(); return; }
      element.textContent = '';
      let i = 0;
      const timer = setInterval(() => {
        element.textContent += text.charAt(i);
        i++;
        if (i >= text.length) {
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }

  if (btnEnterShowcase) {
    btnEnterShowcase.addEventListener('click', () => {
      sfx.click();
      if (heartAutoAdvanceTimer) clearTimeout(heartAutoAdvanceTimer);
      goToScene('gallery');
    });
  }

  /* ══════════════════════════════════════════════════════════
     SCENE 5: GRAND CINEMATIC MEMORY SHOWCASE (Crazy 3D Coverflow Deck & Galaxy)
     ══════════════════════════════════════════════════════════ */
  const showcasePhoto       = $('showcasePhoto');
  const showcaseBackdrop    = $('showcaseBackdrop');
  const showcaseCaption     = $('showcaseCaption');
  const showcaseLightLeak   = $('showcaseLightLeak');
  const showcaseGlare       = $('showcaseGlare');
  const galleryIdxEl        = $('galleryIdx');
  const galleryTotalEl      = $('galleryTotal');
  const showcaseProgressBar = $('showcaseProgressBar');
  const showcaseFrame       = $('showcaseFrame');
  const showcase3dStage     = $('showcase3dStage');
  const deckCardPrev        = $('deckCardPrev');
  const deckImgPrev         = $('deckImgPrev');
  const deckBackdropPrev    = $('deckBackdropPrev');
  const deckCardNext        = $('deckCardNext');
  const deckImgNext         = $('deckImgNext');
  const deckBackdropNext    = $('deckBackdropNext');
  const filmstripWrap       = $('filmstripWrap');
  const filmstripTrack      = $('filmstripTrack');
  const btnPrevPhoto        = $('btnPrevPhoto');
  const btnNextPhoto        = $('btnNextPhoto');

  const letterModal         = $('letterModal');
  const letterTitle         = $('letterTitle');
  const letterBody          = $('letterBody');
  const letterFrom          = $('letterFrom');
  const btnReplayAll        = $('btnReplayAll');

  let currentPhotoIdx       = 0;
  let showcaseTimer         = null;
  const SLIDE_DURATION      = 2200; // 2.2s per memory (brisk, cinematic)

  let filmstripBuilt        = false;

  function buildFilmstrip() {
    if (filmstripBuilt || !filmstripTrack) return;
    filmstripTrack.innerHTML = '';
    C.photos.forEach((photo, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'filmstrip-thumb' + (idx === 0 ? ' active' : '');
      thumb.dataset.idx = idx;
      const img = document.createElement('img');
      img.src = photo.src;
      img.loading = 'lazy';
      img.alt = 'Memory ' + (idx + 1);
      thumb.appendChild(img);
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        startShowcaseLoop();
        showShowcasePhoto(idx);
      });
      filmstripTrack.appendChild(thumb);
    });
    filmstripBuilt = true;
  }

  function onEnterGallery() {
    if (galleryTotalEl) galleryTotalEl.textContent = C.photos.length;
    buildFilmstrip();
    currentPhotoIdx = 0;
    showShowcasePhoto(0);
    startShowcaseLoop();
  }

  function showShowcasePhoto(idx) {
    if (idx < 0) idx = C.photos.length - 1;
    if (idx >= C.photos.length) {
      // Finished all 43 photos -> Reveal Heartfelt Letter!
      if (showcaseTimer) {
        clearInterval(showcaseTimer);
        showcaseTimer = null;
      }
      setTimeout(() => {
        show(letterModal);
      }, 700);
      return;
    }

    currentPhotoIdx = idx;
    const p = C.photos[idx];
    if (galleryIdxEl) galleryIdxEl.textContent = idx + 1;

    // Progress bar width
    if (showcaseProgressBar) {
      const pct = Math.min(100, Math.round(((idx + 1) / C.photos.length) * 100));
      showcaseProgressBar.style.width = `${pct}%`;
    }

    // Smooth center photo fade transition
    if (showcasePhoto) {
      showcasePhoto.classList.add('fading');
      setTimeout(() => {
        showcasePhoto.src = p.src;
        if (showcaseBackdrop) showcaseBackdrop.style.backgroundImage = `url("${p.src}")`;
        if (showcaseCaption)  showcaseCaption.textContent = p.caption || '♡';
        showcasePhoto.classList.remove('fading');
      }, 140);
    }

    // Cinematic anamorphic light leak sweep on every transition
    if (showcaseLightLeak) {
      showcaseLightLeak.classList.remove('sweep');
      void showcaseLightLeak.offsetWidth; // trigger reflow
      showcaseLightLeak.classList.add('sweep');
    }

    // Flanking 3D Deck Card (Left / Previous)
    const prevIdx = (idx > 0) ? idx - 1 : C.photos.length - 1;
    if (deckImgPrev) deckImgPrev.src = C.photos[prevIdx].src;
    if (deckBackdropPrev) deckBackdropPrev.style.backgroundImage = `url("${C.photos[prevIdx].src}")`;

    // Flanking 3D Deck Card (Right / Next)
    const nextIdx = (idx < C.photos.length - 1) ? idx + 1 : 0;
    if (deckImgNext) deckImgNext.src = C.photos[nextIdx].src;
    if (deckBackdropNext) deckBackdropNext.style.backgroundImage = `url("${C.photos[nextIdx].src}")`;

    // Update active thumb in mini filmstrip timeline
    if (filmstripTrack) {
      const thumbs = filmstripTrack.children;
      for (let i = 0; i < thumbs.length; i++) {
        if (i === idx) {
          thumbs[i].classList.add('active');
          thumbs[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          thumbs[i].classList.remove('active');
        }
      }
    }

    // Preload next 2 photos ahead for instant switching
    if (C.photos[(idx + 1) % C.photos.length]) new Image().src = C.photos[(idx + 1) % C.photos.length].src;
    if (C.photos[(idx + 2) % C.photos.length]) new Image().src = C.photos[(idx + 2) % C.photos.length].src;
  }

  function startShowcaseLoop() {
    if (showcaseTimer) clearInterval(showcaseTimer);
    showcaseTimer = setInterval(() => {
      showShowcasePhoto((currentPhotoIdx + 1) % C.photos.length);
    }, SLIDE_DURATION);
  }

  // Forward & Backward Arrow Navigation Buttons (Isolated, robust hit-testing)
  function handlePrevPhoto(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    sfx.tick();
    startShowcaseLoop();
    showShowcasePhoto(currentPhotoIdx > 0 ? currentPhotoIdx - 1 : C.photos.length - 1);
  }

  function handleNextPhoto(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    sfx.tick();
    startShowcaseLoop();
    showShowcasePhoto((currentPhotoIdx + 1) % C.photos.length);
  }

  if (btnPrevPhoto) {
    btnPrevPhoto.addEventListener('click', handlePrevPhoto);
    btnPrevPhoto.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
    btnPrevPhoto.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });
  }
  if (btnNextPhoto) {
    btnNextPhoto.addEventListener('click', handleNextPhoto);
    btnNextPhoto.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
    btnNextPhoto.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });
  }

  // Click on 3D Flanking Left / Right Cards to smoothly flip to them
  if (deckCardPrev) {
    deckCardPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.tick();
      startShowcaseLoop();
      showShowcasePhoto(currentPhotoIdx > 0 ? currentPhotoIdx - 1 : C.photos.length - 1);
    });
  }
  if (deckCardNext) {
    deckCardNext.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.tick();
      startShowcaseLoop();
      showShowcasePhoto((currentPhotoIdx + 1) % C.photos.length);
    });
  }

  // Flanking deck cards and center card remain stable without cursor tilt rotation

  // Optional keyboard arrow navigation
  window.addEventListener('keydown', e => {
    if (currentScene !== 'gallery') return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      startShowcaseLoop();
      showShowcasePhoto((currentPhotoIdx + 1) % C.photos.length);
    } else if (e.key === 'ArrowLeft') {
      startShowcaseLoop();
      showShowcasePhoto(currentPhotoIdx > 0 ? currentPhotoIdx - 1 : C.photos.length - 1);
    }
  });

  // Optional swipe navigation
  let touchStartX = 0;
  if (showcase3dStage) {
    showcase3dStage.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    showcase3dStage.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (diff < -35) {
        startShowcaseLoop();
        showShowcasePhoto((currentPhotoIdx + 1) % C.photos.length);
      } else if (diff > 35) {
        startShowcaseLoop();
        showShowcasePhoto(currentPhotoIdx > 0 ? currentPhotoIdx - 1 : C.photos.length - 1);
      }
    });
  }

  /* ── 3D Photo Cosmos / Galaxy Mode ────────────────────────── */
  let galaxyBuilt       = false;
  let galaxyAngle       = 0;
  let galaxySpinTimer   = null;
  let isDraggingGalaxy  = false;
  let galaxyStartX      = 0;
  let galaxyBaseAngle   = 0;

  function initGalaxyCylinder() {
    if (galaxyBuilt) return;
    const cylinder = $('galaxyCylinder');
    if (!cylinder) return;
    cylinder.innerHTML = '';
    const total = C.photos.length;
    const R = window.innerWidth < 480 ? 320 : 500;
    C.photos.forEach((photo, i) => {
      const card = document.createElement('div');
      card.className = 'galaxy-card';
      const angle = (i / total) * 360;
      const y = (i % 2 === 0) ? -68 : 68;
      card.style.transform = `rotateY(${angle.toFixed(2)}deg) translateZ(${R}px) translateY(${y}px)`;
      const img = document.createElement('img');
      img.src = photo.src;
      img.loading = 'lazy';
      img.alt = 'Memory ' + (i + 1);
      card.appendChild(img);

      card.addEventListener('click', (e) => {
        e.stopPropagation();
        closeGalaxy();
        showShowcasePhoto(i);
      });

      cylinder.appendChild(card);
    });
    galaxyBuilt = true;
  }

  function updateGalaxyTransform() {
    const pivot = $('galaxyPivot');
    if (pivot) pivot.style.transform = `rotateX(-6deg) rotateY(${galaxyAngle.toFixed(2)}deg)`;
  }

  function startGalaxySpin() {
    stopGalaxySpin();
    galaxySpinTimer = setInterval(() => {
      if (!isDraggingGalaxy) {
        galaxyAngle += 0.24;
        updateGalaxyTransform();
      }
    }, 30);
  }

  function stopGalaxySpin() {
    if (galaxySpinTimer) {
      clearInterval(galaxySpinTimer);
      galaxySpinTimer = null;
    }
  }

  function openGalaxy() {
    initGalaxyCylinder();
    if (showcaseTimer) clearInterval(showcaseTimer);
    show($('galaxyViewport'));
    startGalaxySpin();
  }

  function closeGalaxy() {
    hide($('galaxyViewport'));
    stopGalaxySpin();
    startShowcaseLoop();
  }

  const btnToggleGalaxy = $('btnToggleGalaxy');
  const btnCloseGalaxy  = $('btnCloseGalaxy');
  if (btnToggleGalaxy) {
    btnToggleGalaxy.addEventListener('click', () => {
      openGalaxy();
    });
  }
  if (btnCloseGalaxy) {
    btnCloseGalaxy.addEventListener('click', () => {
      closeGalaxy();
    });
  }

  const galaxyViewport = $('galaxyViewport');
  if (galaxyViewport) {
    galaxyViewport.addEventListener('pointerdown', (e) => {
      isDraggingGalaxy = true;
      galaxyStartX = e.clientX;
      galaxyBaseAngle = galaxyAngle;
    });
    window.addEventListener('pointermove', (e) => {
      if (!isDraggingGalaxy) return;
      const dx = e.clientX - galaxyStartX;
      galaxyAngle = galaxyBaseAngle + dx * 0.35;
      updateGalaxyTransform();
    });
    window.addEventListener('pointerup', () => {
      isDraggingGalaxy = false;
    });
    window.addEventListener('pointercancel', () => {
      isDraggingGalaxy = false;
    });
  }

  // Floating Hearts Animation
  function triggerFloatingHearts(originX, originY) {
    const canvas = $('heartsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const hearts = Array.from({ length: 18 }, () => ({
      x: originX + (Math.random() - 0.5) * 50,
      y: originY + (Math.random() - 0.5) * 20,
      size: Math.random() * 20 + 14,
      vx: (Math.random() - 0.5) * 3,
      vy: -(Math.random() * 4 + 2.5),
      alpha: 1,
      symbol: ['🤍', '💜', '♡'][Math.floor(Math.random() * 3)],
    }));

    let start = Date.now();
    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hearts.forEach(h => {
        h.x += h.vx;
        h.y += h.vy;
        h.alpha -= 0.018;
        ctx.save();
        ctx.globalAlpha = Math.max(0, h.alpha);
        ctx.font = `${h.size}px serif`;
        ctx.fillText(h.symbol, h.x, h.y);
        ctx.restore();
      });

      if (Date.now() - start < 1800) {
        requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    step();
  }

  // Grand Finale Letter
  if (letterTitle) letterTitle.textContent = C.letter.title;
  if (letterBody)  letterBody.textContent  = C.letter.body;
  if (letterFrom)  letterFrom.textContent  = C.letter.from;

  // Open Final Card from gallery area
  const btnOpenFinalCard = $('btnOpenFinalCard');
  if (btnOpenFinalCard) {
    btnOpenFinalCard.addEventListener('click', () => {
      show(letterModal);
    });
  }

  // Close Final Card & return to gallery
  const btnCloseLetter   = $('btnCloseLetter');
  const btnBackToGallery = $('btnBackToGallery');
  if (btnCloseLetter) {
    btnCloseLetter.addEventListener('click', () => {
      hide(letterModal);
    });
  }
  if (btnBackToGallery) {
    btnBackToGallery.addEventListener('click', () => {
      hide(letterModal);
    });
  }

  // Replay from start
  if (btnReplayAll) {
    btnReplayAll.addEventListener('click', () => {
      sfx.click();
      hide(letterModal);
      if (showcaseTimer) clearInterval(showcaseTimer);
      goToScene('opening');
    });
  }

})();
