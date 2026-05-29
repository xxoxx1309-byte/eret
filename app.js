const canvas = document.getElementById("profileCanvas");
const ctx = canvas.getContext("2d");

const CANVAS_SIZE = [1200, 1500];

const ETERNAL_RETURN_CHARACTERS = [
  "가넷", "나딘", "나타폰", "니아", "니키", "다니엘", "다르코", "데비&마를렌", "띠아", "라우라", "레녹스", "레니", "레온", "로지",
  "루크", "르노어", "리 다이린", "리오", "마르티나", "마이", "마커스", "매그너스", "미르카", "바냐", "바바라", "버니스", "블레어", "비앙카",
  "비형", "샬럿", "셀린", "쇼우", "쇼이치", "수아", "슈린", "시셀라", "실비아", "아델라", "아드리아나", "아디나", "아르다", "아비게일",
  "아야", "아이솔", "아이작", "알렉스", "알론소", "얀", "에스텔", "에이든", "에키온", "엘레나", "엠마", "요한", "윌리엄", "유민",
  "유스티나", "유키", "이렘", "이바", "이슈트반", "이안", "일레븐", "자히르", "재키", "제니", "츠바메", "카밀로", "카티야", "칼라",
  "캐시", "케네스", "코렐라인", "크레이버", "클로에", "키아라", "타지아", "테오도르", "펜리르", "펠릭스", "프리야", "피오라", "피올로", "하트",
  "헤이즈", "헨리", "현우", "혜진", "히스이",
];

const CANVAS_FONTS = [
  { value: "Paperozi", label: "페이퍼 로지" },
  { value: "Pretendard", label: "프리텐다드" },
  { value: "ChosunIlboMyungjo", label: "조선일보명조체" },
  { value: "Mona12", label: "Mona12" },
  { value: "MitmiFont", label: "밑미 폰트" },
];

const CHARACTER_ASSETS = Array.isArray(window.CHARACTER_ASSETS) ? window.CHARACTER_ASSETS : [];
const imageBoundsCache = new WeakMap();

const state = {
  template: "neon",
  backgroundMode: "default",
  accent: "#ff2d78",
  subAccent: "#00ffcc",
  bgStart: "#050508",
  bgEnd: "#1a1a2e",
  canvasFont: "Paperozi",
  fontScale: 1,
  imageDim: 0.28,
  background: null,
  profileImage: null,
  fields: {
    nickname: "",
    handle: "",
    catchphrase: "",
    bio: "",
    tier: "",
    memo: "",
    activityOther: "",
  },
  characters: {
    mainText: "",
    loveText: "",
    mainAsset: null,
    loveAsset: null,
  },
  chips: {
    modes: [],
    voice: [],
    traits: [],
    gender: [],
    age: [],
    genre: [],
    time: [],
    activity: [],
    bye: [],
  },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

async function init() {
  bindInputs();
  bindChips();
  resizeCanvas();
  await loadCanvasFont();
  draw();
  document.fonts?.ready?.then(draw);
  if (window.lucide) window.lucide.createIcons();
}

function bindInputs() {
  populateCanvasFontSelect();

  const textMap = {
    nicknameInput: ["fields", "nickname"],
    handleInput: ["fields", "handle"],
    catchphraseInput: ["fields", "catchphrase"],
    bioInput: ["fields", "bio"],
    memoInput: ["fields", "memo"],
    activityOtherInput: ["fields", "activityOther"],
    tierSelect: ["fields", "tier"],
  };

  Object.entries(textMap).forEach(([id, path]) => {
    const input = document.getElementById(id);
    input.value = state[path[0]][path[1]];
    input.addEventListener("input", () => {
      state[path[0]][path[1]] = input.value;
      draw();
    });
  });

  $("#accentInput").addEventListener("input", (event) => {
    state.accent = event.target.value;
    document.documentElement.style.setProperty("--accent", state.accent);
    draw();
  });

  $("#subAccentInput").addEventListener("input", (event) => {
    state.subAccent = event.target.value;
    document.documentElement.style.setProperty("--sub", state.subAccent);
    draw();
  });

  $("#bgStartInput").addEventListener("input", (event) => {
    state.bgStart = event.target.value;
    draw();
  });

  $("#bgEndInput").addEventListener("input", (event) => {
    state.bgEnd = event.target.value;
    draw();
  });

  $("#canvasFontSelect").addEventListener("change", async (event) => {
    state.canvasFont = event.target.value;
    await loadCanvasFont();
    draw();
  });

  $("#fontScaleInput").addEventListener("input", (event) => {
    state.fontScale = Number(event.target.value) / 100;
    draw();
  });

  $("#imageDimInput").addEventListener("input", (event) => {
    state.imageDim = Number(event.target.value) / 100;
    draw();
  });

  $("#backgroundInput").addEventListener("change", (event) => loadImage(event, "background"));
  $("#profileImageInput").addEventListener("change", (event) => loadImage(event, "profileImage"));
  $$("[data-file-target]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.fileTarget)?.click();
    });
  });
  $("#downloadBtn").addEventListener("click", downloadPng);
  $("#randomizeBtn").addEventListener("click", randomizeTone);
  $("#resetBtn").addEventListener("click", resetState);
  bindCharacterControls();

  $$("#backgroundModeSegment button").forEach((button) => {
    button.addEventListener("click", () => {
      state.backgroundMode = button.dataset.bgMode;
      $$("#backgroundModeSegment button").forEach((item) => item.classList.toggle("active", item === button));
      draw();
    });
  });
}

function populateCanvasFontSelect() {
  const select = $("#canvasFontSelect");
  select.innerHTML = "";
  CANVAS_FONTS.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.style.fontFamily = `"${value}", "Paperozi", sans-serif`;
    select.append(option);
  });
  select.value = state.canvasFont;
}

function bindCharacterControls() {
  populateCharacterAssetSelects();

  $("#mainCharactersInput").addEventListener("input", (event) => {
    state.characters.mainText = event.target.value;
    draw();
  });

  $("#loveCharactersInput").addEventListener("input", (event) => {
    state.characters.loveText = event.target.value;
    draw();
  });

  $("#mainCharacterAssetSelect").addEventListener("change", (event) => {
    loadCharacterAsset("main", event.target.value);
  });

  $("#loveCharacterAssetSelect").addEventListener("change", (event) => {
    loadCharacterAsset("love", event.target.value);
  });
}

function populateCharacterAssetSelects() {
  const selects = [$("#mainCharacterAssetSelect"), $("#loveCharacterAssetSelect")].filter(Boolean);
  if (!selects.length) return;

  const halfAssets = CHARACTER_ASSETS
    .filter((asset) => asset.variant === "Half")
    .sort((a, b) => assetLabel(a).localeCompare(assetLabel(b), "ko") || a.skin - b.skin);
  const grouped = halfAssets.reduce((groups, asset) => {
    const label = assetLabel(asset);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(asset);
    return groups;
  }, new Map());

  selects.forEach((select) => {
    select.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "선택 안 함";
    select.append(empty);

    grouped.forEach((assets, label) => {
      const group = document.createElement("optgroup");
      group.label = label;
      assets.forEach((asset) => {
        const option = document.createElement("option");
        option.value = asset.url;
        option.textContent = skinLabel(asset);
        group.append(option);
      });
      select.append(group);
    });
  });
}

function assetLabel(asset) {
  return asset?.label || asset?.character || "";
}

function skinLabel(asset) {
  return asset?.skinName || (asset?.skin ? `스킨 ${asset.skin}` : "기본");
}

function loadCharacterAsset(type, url) {
  const key = `${type}Asset`;
  if (!url) {
    state.characters[key] = null;
    draw();
    return;
  }

  const asset = CHARACTER_ASSETS.find((item) => item.url === url);
  if (!asset) return;

  const image = new Image();
  state.characters[key] = { ...asset, image, loaded: false };
  image.onload = () => {
    const current = state.characters[key];
    if (current?.url === url) {
      current.loaded = true;
      draw();
    }
  };
  image.onerror = () => {
    if (state.characters[key]?.url === url) state.characters[key] = null;
    draw();
  };
  image.src = asset.url;
  draw();
}

function canvasFontStack() {
  return `"${state.canvasFont}", "Paperozi", system-ui, sans-serif`;
}

function setCanvasFont(size, weight = 400) {
  ctx.font = `${weight} ${Math.round(size)}px ${canvasFontStack()}`;
}

async function loadCanvasFont() {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load(`400 24px ${canvasFontStack()}`),
    document.fonts.load(`700 24px ${canvasFontStack()}`),
  ]);
}

function bindChips() {
  $$(".chips").forEach((group) => {
    const key = group.dataset.key;
    group.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        if (group.classList.contains("single")) {
          state.chips[key] = [button.textContent];
          group.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
          button.classList.add("active");
        } else {
          button.classList.toggle("active");
          state.chips[key] = [...group.querySelectorAll(".active")].map((item) => item.textContent);
        }
        draw();
      });
    });
  });
}

function resizeCanvas() {
  const [width, height] = CANVAS_SIZE;
  canvas.width = width;
  canvas.height = height;
}

function loadImage(event, key) {
  const file = event.target.files?.[0];
  if (!file) return;
  setUploadName(key, "읽는 중...");
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      state[key] = { src: reader.result, image };
      if (key === "background") {
        state.backgroundMode = "image";
        syncBackgroundMode();
        applyImageTone(image);
      }
      setUploadName(key, file.name);
      draw();
    };
    image.onerror = () => {
      setUploadName(key, "불러오기 실패");
    };
    image.src = reader.result;
  };
  reader.onerror = () => {
    setUploadName(key, "파일 읽기 실패");
  };
  reader.readAsDataURL(file);
  event.target.value = "";
}

function setUploadName(key, name) {
  const idMap = {
    background: "backgroundFileName",
    profileImage: "profileImageFileName",
  };
  const target = document.getElementById(idMap[key]);
  if (target) target.textContent = name || "선택 안 함";
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  const layout = getCanvasLayout(w, h);
  ctx.clearRect(0, 0, w, h);

  if (state.backgroundMode === "image" && state.background?.image) {
    drawCoverImage(state.background.image, 0, 0, w, h);
    drawReadableOverlay(w, h);
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.18, state.imageDim)})`;
    ctx.fillRect(0, 0, w, h);
  } else if (state.backgroundMode === "solid") {
    ctx.fillStyle = state.bgStart;
    ctx.fillRect(0, 0, w, h);
    drawBackgroundTone(w, h, 0.05);
  } else {
    drawTemplate(w, h);
  }

  drawFrame(w, h, layout);
  drawProfileImage(layout.profileImage);
  drawContent(w, h, layout);
}

function getCanvasLayout(w, h) {
  const pad = Math.round(Math.min(w, h) * 0.064);
  const inner = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };
  return {
    pad,
    inner,
    content: { x: pad + inner.w * 0.12, title: pad + inner.h * 0.125, w: inner.w * 0.58, h: inner.h * 0.13 },
    profileImage: { x: pad + inner.w * 0.18, y: pad + inner.h * 0.31, w: inner.w * 0.64, h: inner.h * 0.27 },
    stat: { x: pad + inner.w * 0.12, y: pad + inner.h * 0.595, w: inner.w * 0.76, columns: 2 },
    memo: { x: pad + inner.w * 0.18, y: pad + inner.h * 0.935, w: inner.w * 0.64, h: inner.h * 0.052 },
    slots: { x: pad + inner.w * 0.16, y: pad + inner.h * 0.785, w: inner.w * 0.68, h: inner.h * 0.142 },
  };
}

function drawReadableOverlay(w, h) {
  const left = ctx.createLinearGradient(0, 0, w, 0);
  left.addColorStop(0, "rgba(0,0,0,0.48)");
  left.addColorStop(0.48, "rgba(0,0,0,0.18)");
  left.addColorStop(1, "rgba(0,0,0,0.1)");
  ctx.fillStyle = left;
  ctx.fillRect(0, 0, w, h);

  const bottom = ctx.createLinearGradient(0, h * 0.42, 0, h);
  bottom.addColorStop(0, "rgba(0,0,0,0)");
  bottom.addColorStop(1, "rgba(0,0,0,0.48)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 0, w, h);
}

function drawTemplate(w, h) {
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  if (state.template === "clean") {
    gradient.addColorStop(0, mixHex(state.bgStart, "#ffffff", 0.82));
    gradient.addColorStop(0.5, mixHex(state.accent, "#ffffff", 0.76));
    gradient.addColorStop(1, mixHex(state.bgEnd, "#111516", 0.28));
  } else if (state.template === "signal") {
    gradient.addColorStop(0, mixHex(state.bgStart, "#151719", 0.72));
    gradient.addColorStop(0.45, mixHex(state.accent, "#32171e", 0.5));
    gradient.addColorStop(1, mixHex(state.subAccent, state.bgEnd, 0.48));
  } else {
    gradient.addColorStop(0, state.bgStart);
    gradient.addColorStop(0.54, mixHex(state.accent, state.bgEnd, 0.38));
    gradient.addColorStop(1, state.bgEnd);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  drawBackgroundTone(w, h, 0.06);
  drawGraphicDecor(w, h);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = state.accent;
  ctx.lineWidth = 2;
  const gap = Math.max(52, w / 18);
  for (let x = -w; x < w * 2; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h, h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGraphicDecor(w, h) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = state.subAccent;
  ctx.lineWidth = Math.max(2, w * 0.002);
  roundedStroke(w * 0.1, h * 0.08, w * 0.48, h * 0.25, h * 0.13);
  roundedStroke(w * 0.56, h * 0.78, w * 0.3, h * 0.13, h * 0.065);

  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#ffffff";
  roundedRect(w * 0.12, h * 0.71, w * 0.24, h * 0.11, 0);
  ctx.fill();

  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#ffffff";
  const grid = Math.max(26, w * 0.025);
  const gx = w * 0.77;
  const gy = h * 0.07;
  const gw = grid * 4;
  const gh = grid * 4;
  for (let x = gx; x <= gx + gw; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x, gy + gh);
    ctx.stroke();
  }
  for (let y = gy; y <= gy + gh; y += grid) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx + gw, y);
    ctx.stroke();
  }

  drawSpark(w * 0.12, h * 0.18, Math.min(w, h) * 0.04);
  drawSpark(w * 0.87, h * 0.64, Math.min(w, h) * 0.028);
  ctx.restore();
}

function drawSpark(x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = state.subAccent;
  ctx.lineWidth = Math.max(2, radius * 0.08);
  for (let i = 0; i < 12; i += 1) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(radius * 0.25, 0);
    ctx.lineTo(radius, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackgroundTone(w, h, alpha) {
  const tone = ctx.createRadialGradient(w * 0.78, h * 0.18, 0, w * 0.78, h * 0.18, Math.max(w, h) * 0.72);
  tone.addColorStop(0, colorWithAlpha(state.subAccent, alpha));
  tone.addColorStop(0.48, colorWithAlpha(state.accent, alpha * 0.7));
  tone.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = tone;
  ctx.fillRect(0, 0, w, h);
}

function drawFrame(w, h, layout) {
  const pad = Math.round(layout.pad * 0.78);
  ctx.save();
  ctx.strokeStyle = state.accent;
  ctx.lineWidth = Math.max(4, w * 0.005);
  ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(pad + 14, pad + 14, w - (pad + 14) * 2, h - (pad + 14) * 2);
  ctx.restore();
}

function drawProfileImage(box) {
  const x = Math.round(box.x);
  const y = Math.round(box.y);
  const boxW = Math.round(box.w);
  const boxH = Math.round(box.h);
  ctx.save();
  roundedRect(x, y, boxW, boxH, 28);
  ctx.clip();
  if (state.profileImage?.image) {
    drawCoverImage(state.profileImage.image, x, y, boxW, boxH);
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(x, y, boxW, boxH);
  } else {
    ctx.fillStyle = "rgba(12, 17, 18, 0.34)";
    ctx.fillRect(x, y, boxW, boxH);
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    setCanvasFont(Math.min(28, boxH * 0.12) * state.fontScale, 700);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MAIN PROFILE", x + boxW / 2, y + boxH / 2);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = state.subAccent;
  ctx.lineWidth = Math.max(4, boxW * 0.006);
  roundedStroke(x, y, boxW, boxH, 28);
  ctx.strokeStyle = colorWithAlpha(state.accent, 0.7);
  ctx.lineWidth = 2;
  roundedStroke(x + 10, y + 10, boxW - 20, boxH - 20, 22);
  ctx.restore();
}

function drawContent(w, h, layout) {
  const pad = layout.content.x;
  const leftW = layout.content.w;
  const titleY = layout.content.title;
  const scale = state.fontScale;
  const hasName = Boolean(state.fields.nickname.trim());
  const hasHandle = Boolean(state.fields.handle.trim());
  const hasBio = Boolean(state.fields.bio.trim());
  const panelTop = titleY - 46 * scale;
  const panelH = Math.max(
    86 * scale,
    (hasName ? 160 : hasHandle ? 118 : 82) * scale + (hasBio ? 56 * scale : 0)
  );

  drawGlassPanel(pad - 22, panelTop, leftW + 44, panelH, 16, 0.38);
  ctx.strokeStyle = colorWithAlpha(state.accent, 0.16);
  ctx.lineWidth = 1;
  roundedStroke(pad - 22, panelTop, leftW + 44, panelH, 16);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = state.subAccent;
  setCanvasFont(32 * scale, 700);
  fitText(catchphraseText(), pad, titleY, leftW, 32 * scale, 14);

  ctx.fillStyle = "#ffffff";
  setCanvasFont(68 * scale, 800);
  if (state.fields.nickname) fitText(state.fields.nickname, pad, titleY + 76 * scale, leftW, 68 * scale);

  ctx.fillStyle = state.accent;
  setCanvasFont(36 * scale, 600);
  if (state.fields.handle) ctx.fillText(state.fields.handle, pad, titleY + (hasName ? 128 : 58) * scale);

  const bioY = titleY + (state.fields.nickname ? 162 : 106) * scale;
  drawWrappedText(state.fields.bio, pad, bioY, leftW, 34 * scale, 2, "#eef5f4");

  drawStatRows(layout.stat.x, layout.stat.y, layout.stat.w);
  drawCharacterSlots(w, h, layout);
  drawMemo(layout.memo);
}

function catchphraseText() {
  return String(state.fields.catchphrase || "").trim() || "오늘도 루미아섬에서 만나요";
}

function drawStatRows(x, y, width) {
  const rows = [
    ["TIER", [state.fields.tier]],
    ["MODE", state.chips.modes],
    ["DISCORD", state.chips.voice],
    ["PLAY", state.chips.traits],
    ["TIME", state.chips.time],
    ["INFO", [...state.chips.gender, ...state.chips.age, ...state.chips.genre]],
    ["ACTIVITY", activityValues()],
    ["BYE", state.chips.bye],
  ];
  const layout = getCanvasLayout(canvas.width, canvas.height);
  const columns = layout.stat.columns || 1;
  const gap = 8;
  const columnGap = 10;
  const columnW = (width - columnGap * (columns - 1)) / columns;
  const minRowH = Math.max(42, canvas.height * 0.028);
  const labelW = columnW * (columns > 1 ? 0.3 : 0.24);
  const pillAreaW = columnW - labelW - 24;
  const prepared = rows.map(([label, values]) => {
    const pillLayout = getPillLayout(values, pillAreaW, minRowH - 18);
    return {
      label,
      pillLayout,
      height: Math.max(minRowH, pillLayout.height + 18),
    };
  });
  const rowHeights = [];
  prepared.forEach((item, index) => {
    const row = Math.floor(index / columns);
    rowHeights[row] = Math.max(rowHeights[row] || minRowH, item.height);
  });
  const rowTops = rowHeights.reduce((acc, height, index) => {
    acc.push(index ? acc[index - 1] + rowHeights[index - 1] + gap : y);
    return acc;
  }, []);

  prepared.forEach(({ label, pillLayout }, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const xx = x + col * (columnW + columnGap);
    const yy = rowTops[row];
    const rowH = rowHeights[row];
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    roundedRect(xx, yy, columnW, rowH, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    roundedStroke(xx, yy, columnW, rowH, 12);
    ctx.fillStyle = state.subAccent;
    setCanvasFont((columns > 1 ? 18 : 22) * state.fontScale, 700);
    ctx.fillText(label, xx + 16, yy + Math.min(rowH * 0.62, 28));
    drawPills(pillLayout, xx + labelW, yy + 9, pillAreaW);
  });
}

function getPillLayout(values, width, singleHeight) {
  const rawItems = values.filter(Boolean);
  const gap = 8;
  const pillH = Math.max(22, singleHeight);
  const fontSize = Math.max(14, Math.round(20 * state.fontScale));
  setCanvasFont(fontSize);
  const natural = rawItems.map((value) => {
    const measured = ctx.measureText(value).width + 24;
    return {
      value,
      width: Math.min(measured, Math.max(42, width)),
    };
  });
  const rows = [];

  natural.forEach((item) => {
    let current = rows[rows.length - 1];
    if (!current || rowWidth([...current, item], gap) > width) {
      current = [];
      rows.push(current);
    }
    current.push(item);
  });

  return {
    rows,
    height: rows.length ? rows.length * pillH + Math.max(0, rows.length - 1) * gap : pillH,
    pillH,
    gap,
    fontSize,
  };
}

function drawPills(layout, x, y, width) {
  layout.rows.forEach((row, rowIndex) => {
    const available = width - Math.max(0, row.length - 1) * layout.gap;
    const naturalWidth = row.reduce((sum, item) => sum + item.width, 0);
    const scale = naturalWidth > available ? available / naturalWidth : 1;
    const visibleWidth = naturalWidth * scale + Math.max(0, row.length - 1) * layout.gap;
    let cursor = x + Math.max(0, (width - visibleWidth) / 2);
    row.forEach((item) => {
      const pillW = item.width * scale;
      const yy = y + rowIndex * (layout.pillH + layout.gap);
      ctx.fillStyle = colorWithAlpha(state.accent, 0.36);
      roundedRect(cursor, yy, pillW, layout.pillH, 8);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      const fontSize = Math.max(13, Math.round(layout.fontSize * Math.min(1, scale + 0.08)));
      setCanvasFont(fontSize);
      fitText(item.value, cursor + 16 * scale, yy + layout.pillH * 0.68, Math.max(20, pillW - 32 * scale), fontSize);
      cursor += pillW + layout.gap;
    });
  });
}

function rowWidth(row, gap) {
  return row.reduce((sum, item) => sum + item.width, 0) + Math.max(0, row.length - 1) * gap;
}

function drawCharacterSlots(w, h, layout) {
  const { x, y, w: boxW, h: boxH } = layout.slots;
  drawGlassPanel(x, y, boxW, boxH, 18, 0.5);
  ctx.strokeStyle = colorWithAlpha(state.accent, 0.72);
  ctx.lineWidth = 2;
  roundedStroke(x, y, boxW, boxH, 18);

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = state.subAccent;
  setCanvasFont(18 * state.fontScale, 800);
  ctx.fillText("CHARACTERS", x + 18, y + 15);

  const mainValues = characterDisplayValues("main");
  const loveValues = characterDisplayValues("love");
  const cardGap = 14;
  const cardY = y + Math.max(42, boxH * 0.22);
  const cardH = boxH - (cardY - y) - 16;
  const cardW = (boxW - 36 - cardGap) / 2;
  drawCharacterLine("주캐", mainValues, x + 18, cardY, cardW, cardH, state.accent);
  drawCharacterLine("애정캐", loveValues, x + 18 + cardW + cardGap, cardY, cardW, cardH, state.subAccent);
  ctx.textBaseline = "alphabetic";
}

function characterDisplayValues(type) {
  const typed = splitCommaValues(state.characters[`${type}Text`]).slice(0, 3);
  const selected = state.characters[`${type}Asset`];
  if (typed.length || !selected) return typed;
  return [assetLabel(selected)];
}

function drawCharacterLine(label, values, x, y, width, height, accent) {
  const asset = label === "주캐" ? state.characters.mainAsset : state.characters.loveAsset;
  ctx.fillStyle = colorWithAlpha(accent, 0.18);
  roundedRect(x, y, width, height, 12);
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(accent, 0.38);
  ctx.lineWidth = 2;
  roundedStroke(x, y, width, height, 12);

  const pad = Math.max(12, height * 0.08);
  const imageW = Math.min(width * 0.42, height * 0.86);
  const imageH = height - pad * 2;
  const imageX = x + pad;
  const imageY = y + pad;
  const textX = imageX + imageW + 14;
  const textW = x + width - textX - pad;

  ctx.fillStyle = "rgba(0,0,0,0.32)";
  roundedRect(imageX, imageY, imageW, imageH, 10);
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(accent, 0.16);
  ctx.lineWidth = 1;
  roundedStroke(imageX, imageY, imageW, imageH, 10);

  if (asset?.loaded && asset.image) {
    ctx.save();
    roundedRect(imageX, imageY, imageW, imageH, 10);
    ctx.clip();
    drawNormalizedCharacterImage(asset.image, imageX + 4, imageY + 4, imageW - 8, imageH - 8);
    ctx.restore();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    setCanvasFont(13 * state.fontScale, 800);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NO IMAGE", imageX + imageW / 2, imageY + imageH / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  ctx.fillStyle = accent;
  setCanvasFont(Math.min(18, height * 0.15) * state.fontScale, 800);
  ctx.fillText(label, textX, y + pad + 2);

  const characterText = values.length ? values.join(", ") : asset ? assetLabel(asset) : "선택 안 함";
  const skinText = asset ? skinLabel(asset) : "";
  ctx.fillStyle = "#ffffff";
  setCanvasFont(Math.min(26, height * 0.2) * state.fontScale, 800);
  fitText(characterText, textX, y + height * 0.47, textW, Math.min(26, height * 0.2) * state.fontScale, 14);

  if (skinText) {
    ctx.fillStyle = colorWithAlpha("#ffffff", 0.72);
    setCanvasFont(Math.min(17, height * 0.13) * state.fontScale, 600);
    fitText(skinText, textX, y + height * 0.68, textW, Math.min(17, height * 0.13) * state.fontScale, 10);
  }
}

function drawMemo(box) {
  if (!state.fields.memo) return;
  const { x, y, w: boxW, h: boxH } = box;
  ctx.fillStyle = "rgba(0,0,0,0.46)";
  roundedRect(x, y, boxW, boxH, 14);
  ctx.fill();

  const labelX = x + 22;
  const centerY = y + boxH / 2;
  const labelSize = Math.min(22, boxH * 0.32) * state.fontScale;
  const textSize = Math.min(24, boxH * 0.36) * state.fontScale;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = state.subAccent;
  setCanvasFont(labelSize, 700);
  ctx.fillText("MEMO", labelX, centerY);

  const textX = x + Math.min(130, boxW * 0.18);
  ctx.fillStyle = "#ffffff";
  setCanvasFont(textSize, 600);
  fitText(state.fields.memo, textX, centerY, boxW - (textX - x) - 24, textSize, 14);
  ctx.textBaseline = "alphabetic";
}

function drawGlassPanel(x, y, w, h, r, alpha) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  roundedRect(x, y, w, h, r);
  ctx.fill();
}

function drawWrappedText(text, x, y, width, lineHeight, maxLines, color) {
  ctx.fillStyle = color;
  setCanvasFont(lineHeight * 0.72);
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((item, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? "..." : "";
    ctx.fillText(item + suffix, x, y + index * lineHeight);
  });
}

function fitText(text, x, y, maxWidth, baseSize, minSize = 18) {
  let size = baseSize;
  ctx.font = ctx.font.replace(/\d+px/, `${Math.round(size)}px`);
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = ctx.font.replace(/\d+px/, `${Math.round(size)}px`);
  }
  ctx.fillText(text, x, y);
}

function drawCoverImage(image, x, y, w, h) {
  const scale = Math.max(w / image.width, h / image.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

function drawContainImage(image, x, y, w, h) {
  const scale = Math.min(w / image.width, h / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + h - dh;
  ctx.drawImage(image, dx, dy, dw, dh);
}

function drawNormalizedCharacterImage(image, x, y, w, h) {
  const bounds = getImageContentBounds(image);
  const sourceW = bounds.sw;
  const sourceH = bounds.sh;
  const scale = Math.min(w / sourceW, h / sourceH) * 1.02;
  const dw = sourceW * scale;
  const dh = sourceH * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + h - dh;
  ctx.drawImage(image, bounds.sx, bounds.sy, bounds.sw, bounds.sh, dx, dy, dw, dh);
}

function getImageContentBounds(image) {
  const cached = imageBoundsCache.get(image);
  if (cached) return cached;

  const sampleW = 120;
  const sampleH = Math.max(1, Math.round((image.height / image.width) * sampleW));
  const sampler = document.createElement("canvas");
  sampler.width = sampleW;
  sampler.height = sampleH;
  const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
  if (!samplerCtx) {
    return { sx: 0, sy: 0, sw: image.width, sh: image.height };
  }

  samplerCtx.drawImage(image, 0, 0, sampleW, sampleH);
  const data = samplerCtx.getImageData(0, 0, sampleW, sampleH).data;
  let minX = sampleW;
  let minY = sampleH;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < sampleH; y += 1) {
    for (let x = 0; x < sampleW; x += 1) {
      const index = (y * sampleW + x) * 4;
      if (data[index + 3] > 20) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    const fallback = { sx: 0, sy: 0, sw: image.width, sh: image.height };
    imageBoundsCache.set(image, fallback);
    return fallback;
  }

  const marginX = Math.round((maxX - minX + 1) * 0.04);
  const marginY = Math.round((maxY - minY + 1) * 0.035);
  minX = Math.max(0, minX - marginX);
  minY = Math.max(0, minY - marginY);
  maxX = Math.min(sampleW - 1, maxX + marginX);
  maxY = Math.min(sampleH - 1, maxY + marginY);

  const bounds = {
    sx: (minX / sampleW) * image.width,
    sy: (minY / sampleH) * image.height,
    sw: ((maxX - minX + 1) / sampleW) * image.width,
    sh: ((maxY - minY + 1) / sampleH) * image.height,
  };
  imageBoundsCache.set(image, bounds);
  return bounds;
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function roundedStroke(x, y, w, h, r) {
  roundedRect(x, y, w, h, r);
  ctx.stroke();
}

function colorWithAlpha(hex, alpha) {
  const value = hex.replace("#", "");
  const bigint = parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function downloadPng() {
  await loadCanvasFont();
  draw();
  const fileName = `eret-profile-${Date.now()}.png`;
  const link = document.createElement("a");
  link.download = fileName;

  if (canvas.toBlob) {
    canvas.toBlob((blob) => {
      if (!blob) {
        downloadFromDataUrl(link);
        return;
      }
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
    return;
  }

  downloadFromDataUrl(link);
}

function downloadFromDataUrl(link) {
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function syncControls() {
  $("#nicknameInput").value = state.fields.nickname;
  $("#handleInput").value = state.fields.handle;
  $("#catchphraseInput").value = state.fields.catchphrase;
  $("#bioInput").value = state.fields.bio;
  $("#memoInput").value = state.fields.memo;
  $("#activityOtherInput").value = state.fields.activityOther;
  $("#tierSelect").value = state.fields.tier;
  $("#mainCharactersInput").value = state.characters.mainText;
  $("#loveCharactersInput").value = state.characters.loveText;
  $("#mainCharacterAssetSelect").value = state.characters.mainAsset?.url || "";
  $("#loveCharacterAssetSelect").value = state.characters.loveAsset?.url || "";
  $("#accentInput").value = state.accent;
  $("#subAccentInput").value = state.subAccent;
  $("#bgStartInput").value = state.bgStart;
  $("#bgEndInput").value = state.bgEnd;
  $("#canvasFontSelect").value = state.canvasFont;
  $("#fontScaleInput").value = Math.round(state.fontScale * 100);
  $("#imageDimInput").value = Math.round(state.imageDim * 100);
  document.documentElement.style.setProperty("--accent", state.accent);
  document.documentElement.style.setProperty("--sub", state.subAccent);
  syncBackgroundMode();
  $$(".chips").forEach((group) => {
    const key = group.dataset.key;
    group.querySelectorAll("button").forEach((button) => button.classList.toggle("active", state.chips[key]?.includes(button.textContent)));
  });
}

function syncBackgroundMode() {
  $$("#backgroundModeSegment button").forEach((button) => {
    button.classList.toggle("active", button.dataset.bgMode === state.backgroundMode);
  });
}

function randomizeTone() {
  if (state.background?.image) {
    if (applyImageTone(state.background.image)) return;
  }

  const pairs = [
    ["#ff2d78", "#00ffcc", "#050508", "#1a1a2e"],
    ["#5bd7ff", "#f46b83", "#080914", "#242033"],
    ["#8ee56f", "#ffe04a", "#081008", "#1d2b16"],
    ["#ff7c55", "#8de0d1", "#120808", "#2c2520"],
    ["#d0f16f", "#62a8ff", "#0a0d0a", "#182a34"],
  ];
  const [accent, sub, bgStart, bgEnd] = pairs[Math.floor(Math.random() * pairs.length)];
  state.accent = accent;
  state.subAccent = sub;
  state.bgStart = bgStart;
  state.bgEnd = bgEnd;
  syncControls();
  draw();
}

function applyImageTone(image) {
  const palette = extractImagePalette(image);
  if (!palette) return false;
  state.accent = palette.accent;
  state.subAccent = palette.subAccent;
  state.bgStart = palette.bgStart;
  state.bgEnd = palette.bgEnd;
  syncControls();
  draw();
  return true;
}

function extractImagePalette(image) {
  const sampler = document.createElement("canvas");
  const size = 64;
  sampler.width = size;
  sampler.height = size;
  const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
  if (!samplerCtx) return null;

  samplerCtx.drawImage(image, 0, 0, size, size);
  const data = samplerCtx.getImageData(0, 0, size, size).data;
  const buckets = new Map();

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 180) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const lightness = (max + min) / 510;
    if (lightness < 0.06 || lightness > 0.94 || saturation < 0.08) continue;

    const key = `${Math.round(r / 24) * 24},${Math.round(g / 24) * 24},${Math.round(b / 24) * 24}`;
    const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0, saturation: 0, lightness: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.count += 1;
    bucket.saturation += saturation;
    bucket.lightness += lightness;
    buckets.set(key, bucket);
  }

  const colors = [...buckets.values()].map((bucket) => {
    const color = {
      r: Math.round(bucket.r / bucket.count),
      g: Math.round(bucket.g / bucket.count),
      b: Math.round(bucket.b / bucket.count),
      count: bucket.count,
      saturation: bucket.saturation / bucket.count,
      lightness: bucket.lightness / bucket.count,
    };
    color.score = color.count * (0.5 + color.saturation) * (1 - Math.abs(color.lightness - 0.55));
    return color;
  });

  if (!colors.length) return null;

  const accent = [...colors].sort((a, b) => b.score - a.score)[0];
  const subAccent = [...colors].sort((a, b) => contrastScore(b, accent) - contrastScore(a, accent))[0] || accent;
  const darkBase = [...colors].sort((a, b) => a.lightness - b.lightness)[0] || accent;
  const bgStart = adjustColor(darkBase, -0.5, 0.75);
  const bgEnd = adjustColor(accent, -0.58, 0.65);

  return {
    accent: rgbToHex(...Object.values(adjustColor(accent, 0.12, 1.1))),
    subAccent: rgbToHex(...Object.values(adjustColor(subAccent, 0.18, 1.16))),
    bgStart: rgbToHex(bgStart.r, bgStart.g, bgStart.b),
    bgEnd: rgbToHex(bgEnd.r, bgEnd.g, bgEnd.b),
  };
}

function contrastScore(color, base) {
  const distance = Math.hypot(color.r - base.r, color.g - base.g, color.b - base.b);
  return distance * (0.7 + color.saturation) * (1 - Math.abs(color.lightness - 0.62));
}

function adjustColor(color, lightnessShift, saturationBoost) {
  const hsl = rgbToHsl(color.r, color.g, color.b);
  hsl.s = clamp(hsl.s * saturationBoost, 0, 1);
  hsl.l = clamp(hsl.l + lightnessShift, 0.05, 0.92);
  return hslToRgb(hsl.h, hsl.s, hsl.l);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    if (max === g) h = (b - r) / d + 2;
    if (max === b) h = (r - g) / d + 4;
    h /= 6;
  }

  return { h, s, l };
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    const value = Math.round(l * 255);
    return { r: value, g: value, b: value };
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

function resetState() {
  state.background = null;
  state.backgroundMode = "default";
  state.profileImage = null;
  setUploadName("background", "선택 안 함");
  setUploadName("profileImage", "선택 안 함");
  state.accent = "#ff2d78";
  state.subAccent = "#00ffcc";
  state.bgStart = "#050508";
  state.bgEnd = "#1a1a2e";
  state.canvasFont = "Paperozi";
  state.fontScale = 1;
  state.imageDim = 0.28;
  state.fields.nickname = "";
  state.fields.handle = "";
  state.fields.catchphrase = "";
  state.fields.bio = "";
  state.fields.tier = "";
  state.fields.memo = "";
  state.fields.activityOther = "";
  state.characters = {
    mainText: "",
    loveText: "",
    mainAsset: null,
    loveAsset: null,
  };
  state.chips = {
    modes: [],
    voice: [],
    traits: [],
    gender: [],
    age: [],
    genre: [],
    time: [],
    activity: [],
    bye: [],
  };
  syncControls();
  draw();
}

function activityValues() {
  const base = state.chips.activity.filter((value) => value !== "기타");
  const other = splitCommaValues(state.fields.activityOther);
  if (state.chips.activity.includes("기타") && other.length) {
    return [...base, ...other];
  }
  return state.chips.activity;
}

function splitCommaValues(text) {
  return String(text || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mixHex(hexA, hexB, amount) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const mix = (from, to) => Math.round(from + (to - from) * amount);
  return rgbToHex(mix(a.r, b.r), mix(a.g, b.g), mix(a.b, b.b));
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const bigint = parseInt(value.length === 3 ? value.split("").map((char) => char + char).join("") : value, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

init();
