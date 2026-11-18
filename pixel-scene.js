/**
 * 8-Bit Pixel RPG Cafe Canvas Renderer & Chiptune SFX Engine
 * - 외부 이미지/오디오 에셋 없이 순수 픽셀 도트 그래픽과 Web Audio 8비트 사운드를 합성합니다.
 * - 입력한 이름(해시)에 따라 용사 캐릭터의 망토/머리 색상이 고유하게 바뀌며,
 *   선택한 음료(HOT/ICE) 및 디저트 종류가 실시간으로 캐릭터 머리 위 인벤토리 도트로 렌더링됩니다.
 */

class PixelAudioEngine {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.init();
      this.playEquip();
    }
    return this.enabled;
  }

  tone(freq, duration = 0.07, type = "square", delay = 0, vol = 0.06) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch (_) {
      // 오디오 정책 차단 시 무시
    }
  }

  playClick() {
    this.tone(660, 0.045, "square", 0, 0.045);
  }

  playTab() {
    this.tone(523.25, 0.04, "square", 0, 0.04);
    this.tone(659.25, 0.05, "square", 0.04, 0.04);
  }

  playEquip() {
    this.tone(587.33, 0.06, "square", 0, 0.055);
    this.tone(880.0, 0.11, "square", 0.06, 0.06);
  }

  playGachaTick(step = 0) {
    const scale = [440, 493.88, 523.25, 587.33, 659.25, 783.99];
    this.tone(scale[step % scale.length], 0.04, "triangle", 0, 0.06);
  }

  playGachaWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => this.tone(n, 0.09, "square", idx * 0.07, 0.065));
  }

  playFanfare() {
    const seq = [
      { f: 523.25, d: 0.09, t: 0.0 },
      { f: 659.25, d: 0.09, t: 0.09 },
      { f: 783.99, d: 0.09, t: 0.18 },
      { f: 1046.5, d: 0.22, t: 0.27 },
      { f: 783.99, d: 0.09, t: 0.50 },
      { f: 1046.5, d: 0.32, t: 0.60 }
    ];
    seq.forEach((s) => this.tone(s.f, s.d, "square", s.t, 0.07));
  }

  playError() {
    this.tone(220, 0.09, "sawtooth", 0, 0.05);
    this.tone(174.61, 0.14, "sawtooth", 0.09, 0.05);
  }
}

class PixelCafeScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.vw = 192;
    this.vh = 76;
    if (this.canvas) {
      this.canvas.width = this.vw;
      this.canvas.height = this.vh;
    }
    this.frame = 0;
    this.state = {
      stage: 1,
      heroName: "",
      drink: null,    // { name, temp }
      dessert: null,  // { categoryId, name }
      celebrating: false
    };
    this.particles = [];
    this.heroX = 28;
    this.targetHeroX = 28;

    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }
  }

  setState(partial) {
    Object.assign(this.state, partial);
    if (!this.state.heroName) {
      this.targetHeroX = 28;
    } else if (this.state.stage === 1) {
      // STEP 1: 음료 카운터
      this.targetHeroX = 80;
    } else if (this.state.stage === 2) {
      // STEP 2: 디저트 1순위 쇼케이스 좌측
      this.targetHeroX = 122;
    } else if (this.state.stage === 3) {
      // STEP 3: 디저트 2순위 쇼케이스 우측
      this.targetHeroX = 148;
    } else {
      // STEP 4: 주문서 확인 중앙
      this.targetHeroX = 102;
    }
    if (partial.celebrating) {
      this.spawnConfetti();
    }
  }

  spawnConfetti() {
    const colors = ["#ff5c8a", "#ffd166", "#7ae582", "#5ce1e6", "#ff9f1c", "#ffffff"];
    for (let i = 0; i < 28; i++) {
      this.particles.push({
        x: 50 + Math.random() * 100,
        y: 18 + Math.random() * 24,
        vx: (Math.random() - 0.5) * 1.4,
        vy: -0.6 - Math.random() * 1.2,
        life: 55 + Math.floor(Math.random() * 35),
        color: colors[i % colors.length]
      });
    }
  }

  hashName(name) {
    if (!name) return 0;
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h * 31 + name.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  px(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  drawBackground() {
    // 카페 벽면 (따뜻한 파스텔 크림/코코아 스트라이프)
    this.px(0, 0, this.vw, 52, "#2b213a");
    for (let x = 0; x < this.vw; x += 12) {
      this.px(x, 0, 6, 52, "#332745");
    }

    // 상단 어닝 (딸기/크림 스트라이프 차양)
    for (let x = 0; x < this.vw; x += 16) {
      this.px(x, 0, 8, 7, "#ff5c8a");
      this.px(x + 8, 0, 8, 7, "#fff1e6");
      this.px(x, 7, 8, 2, "#d63b69");
      this.px(x + 8, 7, 8, 2, "#e2cfc2");
    }

    // 창문 (마곡 야경/하늘 뷰)
    this.px(12, 14, 34, 24, "#191528");
    this.px(14, 16, 30, 20, "#243b67");
    // 반짝이는 도트 별
    const twinkle = Math.floor(this.frame / 20) % 2 === 0;
    this.px(19, 20, 2, 2, twinkle ? "#ffd166" : "#ffffff");
    this.px(35, 22, 1, 1, twinkle ? "#ffffff" : "#ffd166");
    this.px(27, 29, 2, 1, "#8ecae6");
    // 창문 십자 프레임
    this.px(28, 16, 2, 20, "#5c4738");
    this.px(14, 25, 30, 2, "#5c4738");
    this.px(11, 37, 36, 2, "#8c6b52");

    // 네온 픽셀 간판 [NYAM & FRUIT]
    this.px(62, 13, 68, 13, "#1a1325");
    this.px(63, 14, 66, 11, "#3b234a");
    const signGlow = Math.floor(this.frame / 15) % 2 === 0 ? "#ffd166" : "#ff8fab";
    // 미니 도트 딸기 아이콘 (좌측)
    this.px(67, 17, 4, 4, "#ff4d6d");
    this.px(68, 21, 2, 1, "#ff4d6d");
    this.px(68, 16, 2, 1, "#52b788");
    // 도트 글자 느낌 바
    this.px(75, 17, 38, 2, signGlow);
    this.px(75, 21, 30, 2, "#fff1e6");
    // 미니 샤인머스켓 도트 아이콘 (우측)
    this.px(119, 17, 4, 4, "#80ed99");
    this.px(120, 21, 2, 1, "#80ed99");
    this.px(120, 16, 2, 1, "#52b788");

    // 우측 벽 선반 (컵과일 & 휘낭시에 병)
    this.px(144, 16, 36, 2, "#8c6b52");
    this.px(148, 11, 5, 5, "#ff758f");
    this.px(156, 12, 5, 4, "#ffd166");
    this.px(164, 11, 5, 5, "#7ae582");
    this.px(172, 12, 5, 4, "#c77dff");

    // 바닥 체커보드 타일
    this.px(0, 52, this.vw, 24, "#433556");
    for (let y = 52; y < this.vh; y += 6) {
      for (let x = 0; x < this.vw; x += 12) {
        const offset = ((y - 52) / 6) % 2 === 0 ? 0 : 6;
        this.px(x + offset, y, 6, 6, "#514166");
      }
    }
  }

  drawCounterAndShopkeeper() {
    const bob = Math.floor(this.frame / 18) % 2;
    const blink = this.frame % 90 > 84;

    // 점원 NPC (음료 카운터 뒤, x=88)
    const nx = 86;
    const ny = 27 + bob;
    // 딸기 베레모
    this.px(nx + 1, ny - 3, 10, 3, "#ff5c8a");
    this.px(nx + 5, ny - 5, 2, 2, "#7ae582");
    // 머리카락 & 얼굴
    this.px(nx, ny, 12, 8, "#593a2e");
    this.px(nx + 2, ny + 2, 8, 6, "#ffd6ba");
    // 눈 & 볼터치
    if (!blink) {
      this.px(nx + 3, ny + 4, 1, 2, "#22181c");
      this.px(nx + 8, ny + 4, 1, 2, "#22181c");
    } else {
      this.px(nx + 3, ny + 5, 2, 1, "#22181c");
      this.px(nx + 7, ny + 5, 2, 1, "#22181c");
    }
    this.px(nx + 2, ny + 6, 2, 1, "#ff8fab");
    this.px(nx + 8, ny + 6, 2, 1, "#ff8fab");
    // 앞치마 유니폼
    this.px(nx + 1, ny + 8, 10, 7, "#fff1e6");
    this.px(nx + 3, ny + 9, 6, 6, "#ff5c8a");

    // 점원 머리 위 음표/느낌표
    const floatY = Math.floor(this.frame / 14) % 2;
    this.px(nx + 13, ny - 2 - floatY, 2, 4, "#ffd166");
    this.px(nx + 15, ny - 3 - floatY, 2, 2, "#ffd166");

    // 좌측 에스프레소 머신 (음료 존)
    this.px(64, 30, 14, 11, "#adb5bd");
    this.px(65, 31, 12, 3, "#ff5c8a");
    this.px(68, 35, 6, 4, "#343a40");
    // 커피 스팀
    if (Math.floor(this.frame / 10) % 2 === 0) {
      this.px(70, 27, 1, 2, "#ffffff");
      this.px(72, 26, 1, 2, "#dee2e6");
    }

    // 메인 원목 카운터 (음료대 x=60~110)
    this.px(58, 40, 52, 15, "#7f5539");
    this.px(57, 39, 54, 3, "#ddb892");
    this.px(61, 44, 46, 9, "#654028");

    // 우측 유리 디저트 쇼케이스 (모찌 · 컵과일 · 휘낭시에 진열대 x=112~174)
    this.px(112, 33, 62, 22, "#7f5539");
    this.px(114, 35, 58, 12, "#a8dadc");
    this.px(115, 36, 56, 10, "#dff6f7");
    // 쇼케이스 내부 1단: 과일모찌 & 그릭모찌 도트
    this.px(118, 38, 5, 3, "#fff1e6");
    this.px(120, 38, 2, 2, "#ff4d6d"); // 딸기모찌
    this.px(126, 38, 5, 3, "#fff1e6");
    this.px(128, 38, 2, 2, "#7ae582"); // 샤인모찌
    this.px(134, 38, 5, 3, "#fff1e6");
    this.px(136, 38, 2, 2, "#ff9f1c"); // 귤모찌
    // 쇼케이스 내부 2단: 휘낭시에 & 컵과일
    this.px(146, 38, 6, 3, "#d08c45"); // 버터휘낭시에
    this.px(154, 38, 6, 3, "#4a2c2a"); // 초코휘낭시에
    this.px(163, 37, 5, 4, "#ffd166"); // 컵과일
    this.px(164, 36, 3, 2, "#ff4d6d");
    // 쇼케이스 선반줄
    this.px(115, 41, 56, 1, "#8ecae6");
    // 아랫단 추가 디저트
    this.px(119, 43, 6, 2, "#d08c45");
    this.px(128, 43, 6, 2, "#5e3023");
    this.px(138, 43, 5, 2, "#fff1e6");
    this.px(148, 43, 5, 2, "#9d4edd");
    this.px(158, 43, 8, 2, "#ff8fab");

    // 스테이지 하이라이트 화살표 (현재 단계 위치 표시)
    const arrowBounce = Math.floor(this.frame / 10) % 3;
    if (this.state.heroName && this.state.stage === 1) {
      // 음료 카운터 가리킴
      this.drawDownArrow(82, 21 + arrowBounce, "#5ce1e6");
    } else if (this.state.stage === 2) {
      // 디저트 1순위 쇼케이스 가리킴
      this.drawDownArrow(130, 22 + arrowBounce, "#ffd166");
    } else if (this.state.stage === 3) {
      // 디저트 2순위 쇼케이스 가리킴
      this.drawDownArrow(154, 22 + arrowBounce, "#7ae582");
    }
  }

  drawDownArrow(cx, y, color) {
    this.px(cx - 1, y, 3, 3, color);
    this.px(cx - 3, y + 3, 7, 2, color);
    this.px(cx - 2, y + 5, 5, 1, color);
    this.px(cx - 1, y + 6, 3, 1, color);
    this.px(cx, y + 7, 1, 1, color);
  }

  drawHero() {
    // 부드러운 이동 보간
    const diff = this.targetHeroX - this.heroX;
    const isMoving = Math.abs(diff) > 0.6;
    if (isMoving) {
      this.heroX += Math.sign(diff) * Math.min(Math.abs(diff), 1.4);
    } else {
      this.heroX = this.targetHeroX;
    }

    const h = this.hashName(this.state.heroName);
    const capeColors = ["#4cc9f0", "#ff5c8a", "#7ae582", "#ffd166", "#c77dff", "#ff9f1c"];
    const hairColors = ["#2b2d42", "#6f4518", "#d90429", "#3a0ca3", "#bc6c25", "#1d3557"];
    const cape = capeColors[h % capeColors.length];
    const hair = hairColors[(h >> 3) % hairColors.length];

    const walkCycle = isMoving ? Math.floor(this.frame / 4) % 2 : Math.floor(this.frame / 20) % 2;
    const jumpOffset = this.state.celebrating ? Math.abs(Math.sin(this.frame * 0.25)) * 6 : 0;

    const hx = Math.round(this.heroX);
    const hy = Math.round(45 - jumpOffset);

    // 그림자
    this.px(hx + 1, 62, 10, 2, "rgba(0,0,0,0.35)");

    // 다리
    if (isMoving) {
      this.px(hx + 3, hy + 14, 2, walkCycle === 0 ? 3 : 2, "#1d3557");
      this.px(hx + 7, hy + 14, 2, walkCycle === 0 ? 2 : 3, "#1d3557");
    } else {
      this.px(hx + 3, hy + 14, 2, 3, "#1d3557");
      this.px(hx + 7, hy + 14, 2, 3, "#1d3557");
    }

    // 망토 & 갑옷/튜닉
    this.px(hx + 1, hy + 8, 10, 6, cape);
    this.px(hx + 3, hy + 8, 6, 6, "#f8f9fa");
    this.px(hx + 4, hy + 10, 4, 2, cape);

    // 얼굴 & 머리
    this.px(hx + 1, hy, 10, 8, hair);
    this.px(hx + 2, hy + 2, 8, 6, "#ffe5d9");
    this.px(hx + 3, hy + 4, 1, 2, "#1b1b1e");
    this.px(hx + 8, hy + 4, 1, 2, "#1b1b1e");
    // 용사 머리띠
    this.px(hx + 1, hy + 1, 10, 1, cape);

    // 장착한 아이템(음료 & 디저트) 캐릭터 위 미니 도트 아이콘 표시
    this.drawEquippedBubbles(hx, hy);
  }

  drawEquippedBubbles(hx, hy) {
    const hasDrink = this.state.drink && this.state.drink.id !== "none";
    const hasDessert = this.state.dessert && this.state.dessert.categoryId !== "none";

    if (!this.state.heroName && this.state.stage === 1) {
      // 이름 미입력 상태: 머리 위 '?' 말풍선
      this.px(hx + 2, hy - 11, 8, 8, "#ffffff");
      this.px(hx + 4, hy - 9, 4, 1, "#2b213a");
      this.px(hx + 7, hy - 8, 1, 2, "#2b213a");
      this.px(hx + 5, hy - 6, 2, 1, "#2b213a");
      this.px(hx + 5, hy - 4, 2, 1, "#ff5c8a");
      return;
    }

    if (hasDrink) {
      const bx = hasDessert ? hx - 5 : hx + 1;
      const by = hy - 11;
      const isHot = this.state.drink.temp === "HOT";
      this.px(bx, by, 9, 9, "#191528");
      this.px(bx + 1, by + 1, 7, 7, isHot ? "#3d1e28" : "#16324f");
      // 컵 도트
      this.px(bx + 2, by + 3, 5, 4, isHot ? "#ff758f" : "#5ce1e6");
      this.px(bx + 4, by + 1, 1, 2, isHot ? "#ffd166" : "#ffffff"); // 빨대 또는 김
    }

    if (hasDessert) {
      const bx = hasDrink ? hx + 6 : hx + 1;
      const by = hy - 11;
      this.px(bx, by, 9, 9, "#191528");
      this.px(bx + 1, by + 1, 7, 7, "#2d2342");
      const cat = this.state.dessert.categoryId;
      if (cat === "fruit_mochi" || cat === "greek_mochi") {
        this.px(bx + 2, by + 3, 5, 4, "#fff1e6");
        this.px(bx + 3, by + 3, 3, 2, cat === "greek_mochi" ? "#7ae582" : "#ff4d6d");
      } else if (cat === "financier") {
        this.px(bx + 2, by + 3, 5, 3, "#d08c45");
        this.px(bx + 3, by + 2, 3, 1, "#ffd166");
      } else if (cat === "cup_fruit") {
        this.px(bx + 2, by + 4, 5, 3, "#ffd166");
        this.px(bx + 2, by + 2, 2, 2, "#ff4d6d");
        this.px(bx + 5, by + 2, 2, 2, "#7ae582");
      } else {
        this.px(bx + 2, by + 2, 5, 5, "#ffd166");
      }
    }
  }

  drawParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= 1;
      this.px(p.x, p.y, 2, 2, p.color);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  loop() {
    this.frame++;
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.vw, this.vh);
      this.drawBackground();
      this.drawCounterAndShopkeeper();
      this.drawHero();
      this.drawParticles();
    }
    requestAnimationFrame(this.loop);
  }
}

window.PixelAudioEngine = PixelAudioEngine;
window.PixelCafeScene = PixelCafeScene;
