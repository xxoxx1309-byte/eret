const canvas = document.getElementById("profileCanvas");
const ctx = canvas.getContext("2d");

const ratios = {
  square: [1400, 1400],
  wide: [1600, 900],
  post: [1200, 1500],
};

const templates = [
  { id: "neon", name: "네온", swatch: "swatch-neon" },
  { id: "clean", name: "클린", swatch: "swatch-clean" },
  { id: "signal", name: "시그널", swatch: "swatch-signal" },
];

const state = {
  template: "neon",
  ratio: "square",
  accent: "#13c8b5",
  subAccent: "#ffcf5a",
  bgStart: "#071011",
  bgEnd: "#173735",
  fontScale: 1,
  imageDim: 0.12,
  guide: true,
  background: null,
  mainImage: null,
  profileImage: null,
  fields: {
    nickname: "",
    handle: "",
    mainCharacter: "",
    bio: "",
    tier: "",
    memo: "",
    activityOther: "",
    fav1: "",
    fav2: "",
    love1: "",
    love2: "",
  },
  chips: {
    modes: [],
    voice: [],
    traits: [],
    gender: [],
    age: [],
    activity: [],
    bye: [],
  },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function init() {
  renderTemplates();
  bindInputs();
  bindChips();
  resizeCanvas();
  draw();
  if (window.lucide) window.lucide.createIcons();
}

function renderTemplates() {
  const grid = $("#templateGrid");
  grid.innerHTML = "";
  templates.forEach((template) => {
    const button = document.createElement("button");
    button.className = `template-card ${template.swatch}`;
    button.dataset.template = template.id;
    button.innerHTML = `<span>${template.name}</span>`;
    button.addEventListener("click", () => {
      state.template = template.id;
      renderTemplates();
      draw();
    });
    if (state.template === template.id) button.classList.add("active");
    grid.appendChild(button);
  });
}

function bindInputs() {
  const textMap = {
    nicknameInput: ["fields", "nickname"],
    handleInput: ["fields", "handle"],
    mainCharacterInput: ["fields", "mainCharacter"],
    bioInput: ["fields", "bio"],
    memoInput: ["fields", "memo"],
    activityOtherInput: ["fields", "activityOther"],
    fav1Input: ["fields", "fav1"],
    fav2Input: ["fields", "fav2"],
    love1Input: ["fields", "love1"],
    love2Input: ["fields", "love2"],
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

  $("#fontScaleInput").addEventListener("input", (event) => {
    state.fontScale = Number(event.target.value) / 100;
    draw();
  });

  $("#imageDimInput").addEventListener("input", (event) => {
    state.imageDim = Number(event.target.value) / 100;
    draw();
  });

  $("#guideToggle").addEventListener("change", (event) => {
    state.guide = event.target.checked;
    draw();
  });

  $("#backgroundInput").addEventListener("change", (event) => loadImage(event, "background"));
  $("#mainImageInput").addEventListener("change", (event) => loadImage(event, "mainImage"));
  $("#profileImageInput").addEventListener("change", (event) => loadImage(event, "profileImage"));
  $("#downloadBtn").addEventListener("click", downloadPng);
  $("#saveJsonBtn").addEventListener("click", saveJson);
  $("#loadJsonInput").addEventListener("change", loadJson);
  $("#randomizeBtn").addEventListener("click", randomizeTone);
  $("#resetBtn").addEventListener("click", resetState);

  $$("#ratioSegment button").forEach((button) => {
    button.addEventListener("click", () => {
      state.ratio = button.dataset.ratio;
      $$("#ratioSegment button").forEach((item) => item.classList.toggle("active", item === button));
      resizeCanvas();
      draw();
    });
  });
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
  const [width, height] = ratios[state.ratio];
  canvas.width = width;
  canvas.height = height;
}

function loadImage(event, key) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      state[key] = { src: reader.result, image };
      draw();
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  const layout = getCanvasLayout(w, h);
  ctx.clearRect(0, 0, w, h);

  if (state.background?.image) {
    drawCoverImage(state.background.image, 0, 0, w, h);
    drawBackgroundTone(w, h, 0.08);
    ctx.fillStyle = `rgba(0, 0, 0, ${state.imageDim})`;
    ctx.fillRect(0, 0, w, h);
  } else {
    drawTemplate(w, h);
  }

  drawFrame(w, h, layout);
  drawMainImage(layout.mainImage);
  drawProfileImage(layout.profileImage);
  drawContent(w, h, layout);
  if (state.guide) drawGuide(w, h);
}

function getCanvasLayout(w, h) {
  const pad = Math.round(Math.min(w, h) * 0.058);
  const inner = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };
  const isWide = state.ratio === "wide";
  const isPost = state.ratio === "post";
  const content = isPost
    ? { x: pad, y: pad + h * 0.07, w: inner.w, title: pad + h * 0.08 }
    : { x: pad + inner.w * 0.03, y: pad + h * 0.12, w: isWide ? inner.w * 0.42 : inner.w * 0.46, title: pad + h * 0.13 };
  const mainImage = isWide
    ? { x: pad + inner.w * 0.64, y: pad + inner.h * 0.16, w: inner.w * 0.31, h: inner.h * 0.5 }
    : isPost
      ? { x: pad + inner.w * 0.08, y: pad + inner.h * 0.35, w: inner.w * 0.84, h: inner.h * 0.24 }
      : { x: pad + inner.w * 0.6, y: pad + inner.h * 0.14, w: inner.w * 0.34, h: inner.h * 0.38 };
  const profileSize = Math.round(Math.min(w, h) * (isWide ? 0.15 : isPost ? 0.17 : 0.16));
  const profileImage = isWide
    ? { x: pad + inner.w * 0.49, y: pad + inner.h * 0.34, size: profileSize }
    : isPost
      ? { x: w / 2 - profileSize / 2, y: pad + inner.h * 0.6, size: profileSize }
      : { x: pad + inner.w * 0.5 - profileSize / 2, y: pad + inner.h * 0.39, size: profileSize };
  const stat = isPost
    ? { x: pad + inner.w * 0.08, y: pad + inner.h * 0.7, w: inner.w * 0.84 }
    : { x: content.x, y: pad + inner.h * (isWide ? 0.54 : 0.56), w: content.w };
  const memo = isPost
    ? { x: pad + inner.w * 0.08, y: pad + inner.h * 0.83, w: inner.w * 0.84, h: inner.h * 0.1 }
    : { x: mainImage.x, y: pad + inner.h * (isWide ? 0.7 : 0.58), w: mainImage.w, h: inner.h * (isWide ? 0.18 : 0.2) };
  return { pad, inner, content, mainImage, profileImage, stat, memo };
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

function drawMainImage(box) {
  const { x, y, w: boxW, h: boxH } = box;
  ctx.save();
  roundedRect(x, y, boxW, boxH, 22);
  ctx.clip();
  if (state.mainImage?.image) {
    drawCoverImage(state.mainImage.image, x, y, boxW, boxH);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(x, y, boxW, boxH);
  } else {
    ctx.fillStyle = "rgba(12, 17, 18, 0.34)";
    ctx.fillRect(x, y, boxW, boxH);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = `${Math.round(24 * state.fontScale)}px Paperlogy, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MAIN IMAGE", x + boxW / 2, y + boxH / 2);
  }
  ctx.restore();

  ctx.strokeStyle = state.subAccent;
  ctx.lineWidth = 4;
  roundedStroke(x, y, boxW, boxH, 22);
}

function drawProfileImage(box) {
  const size = box.size;
  const x = Math.round(box.x);
  const y = Math.round(box.y);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  if (state.profileImage?.image) {
    drawCoverImage(state.profileImage.image, x, y, size, size);
  } else {
    ctx.fillStyle = "rgba(12, 17, 18, 0.7)";
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = `700 ${Math.round(size * 0.1)}px Paperlogy, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PROFILE", x + size / 2, y + size / 2);
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 8, 0, Math.PI * 2);
  ctx.strokeStyle = state.accent;
  ctx.lineWidth = Math.max(5, size * 0.04);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 18, 0, Math.PI * 2);
  ctx.strokeStyle = colorWithAlpha(state.subAccent, 0.45);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawContent(w, h, layout) {
  const pad = layout.content.x;
  const leftW = layout.content.w;
  const titleY = layout.content.title;
  const scale = state.fontScale;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = state.subAccent;
  ctx.font = `${Math.round(34 * scale)}px Rajdhani, sans-serif`;
  ctx.fillText("FIND YOUR LUMIA FRIEND", pad, titleY);

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.round(72 * scale)}px Paperlogy, sans-serif`;
  if (state.fields.nickname) fitText(state.fields.nickname, pad, titleY + 78 * scale, leftW, 72 * scale);

  ctx.fillStyle = state.accent;
  ctx.font = `${Math.round(36 * scale)}px Rajdhani, sans-serif`;
  if (state.fields.handle) ctx.fillText(state.fields.handle, pad, titleY + 130 * scale);

  const infoY = titleY + (state.fields.nickname ? 190 : 116) * scale;
  drawInfoBlock("MAIN", state.fields.mainCharacter, pad, infoY, leftW);
  drawWrappedText(state.fields.bio, pad, infoY + 102 * scale, leftW, 34 * scale, 2, "#eef5f4");

  drawStatRows(layout.stat.x, layout.stat.y, layout.stat.w);
  drawCharacterSlots(w, h, layout);
  drawMemo(layout.memo);
}

function drawInfoBlock(label, value, x, y, width) {
  const scale = state.fontScale;
  ctx.fillStyle = colorWithAlpha(state.accent, 0.18);
  roundedRect(x, y, width, 70 * scale, 12);
  ctx.fill();
  ctx.fillStyle = state.accent;
  ctx.font = `700 ${Math.round(22 * scale)}px Rajdhani, sans-serif`;
  ctx.fillText(label, x + 20, y + 29 * scale);
  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.round(34 * scale)}px Paperlogy, sans-serif`;
  if (value) fitText(value, x + 20, y + 58 * scale, width - 40, 34 * scale);
}

function drawStatRows(x, y, width) {
  const rows = [
    ["TIER", [state.fields.tier]],
    ["MODE", state.chips.modes],
    ["DISCORD", state.chips.voice],
    ["PLAY", state.chips.traits],
    ["INFO", [...state.chips.gender, ...state.chips.age, ...activityValues()]],
    ["BYE", state.chips.bye],
  ];
  const baseRowH = Math.max(54, canvas.height * 0.039);
  let cursorY = y;
  rows.forEach(([label, values]) => {
    const pillAreaW = width * 0.74;
    const layout = getPillLayout(values, pillAreaW, baseRowH - 18);
    const rowH = Math.max(baseRowH, layout.height + 18);
    const yy = cursorY;
    ctx.fillStyle = "rgba(0,0,0,0.26)";
    roundedRect(x, yy, width, rowH, 10);
    ctx.fill();
    ctx.fillStyle = state.subAccent;
    ctx.font = `700 ${Math.round(22 * state.fontScale)}px Rajdhani, sans-serif`;
    ctx.fillText(label, x + 18, yy + rowH * 0.62);
    drawPills(layout, x + width * 0.24, yy + 9, pillAreaW);
    cursorY += rowH + 10;
  });
}

function getPillLayout(values, width, singleHeight) {
  const items = values.filter(Boolean).slice(0, 8);
  ctx.font = `${Math.round(22 * state.fontScale)}px Paperlogy, sans-serif`;
  const gap = 8;
  const natural = items.map((value) => ({
    value,
    width: Math.min(ctx.measureText(value).width + 32, width),
  }));
  const total = natural.reduce((sum, item) => sum + item.width, 0) + Math.max(0, natural.length - 1) * gap;
  const pillH = singleHeight;

  if (total <= width || natural.length <= 1) {
    return { rows: [natural], height: pillH, pillH, gap };
  }

  let bestSplit = 1;
  let bestScore = Infinity;
  for (let split = 1; split < natural.length; split += 1) {
    const first = rowWidth(natural.slice(0, split), gap);
    const second = rowWidth(natural.slice(split), gap);
    const overflow = Math.max(0, first - width) + Math.max(0, second - width);
    const balance = Math.abs(first - second);
    const score = overflow * 1000 + balance;
    if (score < bestScore) {
      bestScore = score;
      bestSplit = split;
    }
  }

  return { rows: [natural.slice(0, bestSplit), natural.slice(bestSplit)], height: pillH * 2 + gap, pillH, gap };
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
      ctx.fillStyle = colorWithAlpha(state.accent, 0.22);
      roundedRect(cursor, yy, pillW, layout.pillH, 8);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      const fontSize = Math.max(16, Math.round(22 * state.fontScale * Math.min(1, scale + 0.08)));
      ctx.font = `${fontSize}px Paperlogy, sans-serif`;
      fitText(item.value, cursor + 16 * scale, yy + layout.pillH * 0.68, Math.max(20, pillW - 32 * scale), fontSize);
      cursor += pillW + layout.gap;
    });
  });
}

function rowWidth(row, gap) {
  return row.reduce((sum, item) => sum + item.width, 0) + Math.max(0, row.length - 1) * gap;
}

function drawCharacterSlots(w, h, layout) {
  const labels = [
    ["주캐릭터 1", state.fields.fav1],
    ["주캐릭터 2", state.fields.fav2],
    ["애정캐릭터 1", state.fields.love1],
    ["애정캐릭터 2", state.fields.love2],
  ];
  const pad = layout.pad;
  const areaW = w - pad * 2;
  const gap = Math.max(10, Math.min(w, h) * 0.01);
  const columns = state.ratio === "post" || areaW / 4 < 255 ? 2 : 4;
  const rows = Math.ceil(labels.length / columns);
  const slotW = (areaW - gap * (columns - 1)) / columns;
  const slotH = Math.max(82, Math.min(128, h * (rows > 1 ? 0.066 : 0.084)));
  const totalH = rows * slotH + (rows - 1) * gap;
  const y = h - pad - totalH;

  labels.forEach(([label, value], index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = pad + col * (slotW + gap);
    const yy = y + row * (slotH + gap);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    roundedRect(x, yy, slotW, slotH, 12);
    ctx.fill();
    ctx.strokeStyle = index < 2 ? state.accent : state.subAccent;
    ctx.lineWidth = 2;
    roundedStroke(x, yy, slotW, slotH, 12);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = `700 ${Math.round(Math.min(18, slotH * 0.2) * state.fontScale)}px Rajdhani, sans-serif`;
    ctx.fillText(label.toUpperCase(), x + 16, yy + Math.max(25, slotH * 0.3));
    if (value) {
      ctx.fillStyle = "#ffffff";
      ctx.font = `${Math.round(Math.min(32, slotH * 0.32) * state.fontScale)}px Paperlogy, sans-serif`;
      fitText(value, x + 16, yy + slotH - Math.max(20, slotH * 0.22), slotW - 32, Math.min(32, slotH * 0.32) * state.fontScale);
    }
  });
}

function drawMemo(box) {
  const { x, y, w: boxW, h: boxH } = box;
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  roundedRect(x, y, boxW, boxH, 14);
  ctx.fill();
  ctx.fillStyle = state.subAccent;
  ctx.font = `700 ${Math.round(22 * state.fontScale)}px Rajdhani, sans-serif`;
  ctx.fillText("MEMO", x + 22, y + 36);
  drawWrappedText(state.fields.memo, x + 22, y + 78, boxW - 44, 30 * state.fontScale, 4, "#ffffff");
}

function drawGuide(w, h) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.lineWidth = 1;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
  ctx.restore();
}

function drawWrappedText(text, x, y, width, lineHeight, maxLines, color) {
  ctx.fillStyle = color;
  ctx.font = `${Math.round(lineHeight * 0.72)}px Paperlogy, sans-serif`;
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

function fitText(text, x, y, maxWidth, baseSize) {
  let size = baseSize;
  ctx.font = ctx.font.replace(/\d+px/, `${Math.round(size)}px`);
  while (ctx.measureText(text).width > maxWidth && size > 18) {
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

function downloadPng() {
  const previousGuide = state.guide;
  state.guide = false;
  draw();
  const link = document.createElement("a");
  link.download = `eret-profile-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  state.guide = previousGuide;
  draw();
}

function saveJson() {
  const data = serializeState();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.download = "eret-profile-work.json";
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

function loadJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const data = JSON.parse(reader.result);
    await applySerializedState(data);
  };
  reader.readAsText(file);
}

function makeImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve({ src, image });
    image.src = src;
  });
}

function serializeState() {
  return {
    ...state,
    background: state.background?.src || null,
    mainImage: state.mainImage?.src || null,
    profileImage: state.profileImage?.src || null,
  };
}

async function applySerializedState(data) {
  const nextFields = { ...state.fields, ...(data.fields || {}) };
  const nextChips = { ...state.chips, ...(data.chips || {}) };
  Object.assign(state, data, { fields: nextFields, chips: nextChips });
  state.background = data.background ? await makeImage(data.background) : null;
  state.mainImage = data.mainImage ? await makeImage(data.mainImage) : null;
  state.profileImage = data.profileImage ? await makeImage(data.profileImage) : null;
  syncControls();
  resizeCanvas();
  renderTemplates();
  draw();
}

function syncControls() {
  $("#nicknameInput").value = state.fields.nickname;
  $("#handleInput").value = state.fields.handle;
  $("#mainCharacterInput").value = state.fields.mainCharacter;
  $("#bioInput").value = state.fields.bio;
  $("#memoInput").value = state.fields.memo;
  $("#activityOtherInput").value = state.fields.activityOther;
  $("#fav1Input").value = state.fields.fav1;
  $("#fav2Input").value = state.fields.fav2;
  $("#love1Input").value = state.fields.love1;
  $("#love2Input").value = state.fields.love2;
  $("#tierSelect").value = state.fields.tier;
  $("#accentInput").value = state.accent;
  $("#subAccentInput").value = state.subAccent;
  $("#bgStartInput").value = state.bgStart;
  $("#bgEndInput").value = state.bgEnd;
  $("#fontScaleInput").value = Math.round(state.fontScale * 100);
  $("#imageDimInput").value = Math.round(state.imageDim * 100);
  $("#guideToggle").checked = state.guide;
  document.documentElement.style.setProperty("--accent", state.accent);
  document.documentElement.style.setProperty("--sub", state.subAccent);
  $$("#ratioSegment button").forEach((button) => button.classList.toggle("active", button.dataset.ratio === state.ratio));
  $$(".chips").forEach((group) => {
    const key = group.dataset.key;
    group.querySelectorAll("button").forEach((button) => button.classList.toggle("active", state.chips[key]?.includes(button.textContent)));
  });
}

function randomizeTone() {
  const pairs = [
    ["#13c8b5", "#ffcf5a", "#071011", "#173735"],
    ["#5bd7ff", "#f46b83", "#10151b", "#242033"],
    ["#8ee56f", "#f2d06b", "#10160f", "#24331b"],
    ["#ff7c55", "#8de0d1", "#171111", "#2c2520"],
    ["#d0f16f", "#62a8ff", "#11160f", "#182a34"],
  ];
  const [accent, sub, bgStart, bgEnd] = pairs[Math.floor(Math.random() * pairs.length)];
  state.accent = accent;
  state.subAccent = sub;
  state.bgStart = bgStart;
  state.bgEnd = bgEnd;
  syncControls();
  draw();
}

function resetState() {
  state.background = null;
  state.mainImage = null;
  state.profileImage = null;
  state.bgStart = "#071011";
  state.bgEnd = "#173735";
  state.fields.nickname = "";
  state.fields.handle = "";
  state.fields.mainCharacter = "";
  state.fields.bio = "";
  state.fields.tier = "";
  state.fields.memo = "";
  state.fields.activityOther = "";
  state.fields.fav1 = "";
  state.fields.fav2 = "";
  state.fields.love1 = "";
  state.fields.love2 = "";
  state.chips = {
    modes: [],
    voice: [],
    traits: [],
    gender: [],
    age: [],
    activity: [],
    bye: [],
  };
  syncControls();
  draw();
}

function activityValues() {
  const base = state.chips.activity.filter((value) => value !== "기타");
  const other = String(state.fields.activityOther || "").trim();
  if (state.chips.activity.includes("기타") && other) {
    return [...base, other];
  }
  return state.chips.activity;
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
