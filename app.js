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
  fontScale: 1,
  imageDim: 0.12,
  guide: true,
  background: null,
  mainImage: null,
  profileImage: null,
  fields: {
    nickname: "루미아의 친구",
    handle: "@eternal_return",
    mainCharacter: "아야 / 헤이즈",
    bio: "같이 오래 게임할 트친을 찾고 있어요.",
    tier: "골드",
    memo: "평일 저녁, 주말 접속. 실수해도 웃고 넘기는 분위기를 좋아해요.",
    activityOther: "",
    fav1: "쇼이치",
    fav2: "레녹스",
    love1: "엠마",
    love2: "리오",
  },
  chips: {
    modes: ["일반"],
    voice: ["전부"],
    traits: ["즐겜"],
    gender: ["기타"],
    age: ["성인"],
    activity: ["소비", "흔적"],
    bye: ["블언블"],
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
  ctx.clearRect(0, 0, w, h);

  if (state.background?.image) {
    drawCoverImage(state.background.image, 0, 0, w, h);
    ctx.fillStyle = `rgba(0, 0, 0, ${state.imageDim})`;
    ctx.fillRect(0, 0, w, h);
  } else {
    drawTemplate(w, h);
  }

  drawFrame(w, h);
  drawMainImage(w, h);
  drawProfileImage(w, h);
  drawContent(w, h);
  if (state.guide) drawGuide(w, h);
}

function drawTemplate(w, h) {
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  if (state.template === "clean") {
    gradient.addColorStop(0, "#edf6f3");
    gradient.addColorStop(0.5, "#dbe9e6");
    gradient.addColorStop(1, "#22292a");
  } else if (state.template === "signal") {
    gradient.addColorStop(0, "#151719");
    gradient.addColorStop(0.45, "#32171e");
    gradient.addColorStop(1, "#d4a93f");
  } else {
    gradient.addColorStop(0, "#071011");
    gradient.addColorStop(0.54, "#173735");
    gradient.addColorStop(1, "#101314");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

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

function drawFrame(w, h) {
  const pad = Math.round(Math.min(w, h) * 0.045);
  ctx.save();
  ctx.strokeStyle = state.accent;
  ctx.lineWidth = Math.max(4, w * 0.005);
  ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(pad + 14, pad + 14, w - (pad + 14) * 2, h - (pad + 14) * 2);
  ctx.restore();
}

function drawMainImage(w, h) {
  const pad = Math.round(Math.min(w, h) * 0.07);
  const boxW = w * (state.ratio === "wide" ? 0.34 : 0.38);
  const boxH = h * (state.ratio === "wide" ? 0.66 : 0.42);
  const x = w - pad - boxW;
  const y = pad + h * 0.1;

  ctx.save();
  roundedRect(x, y, boxW, boxH, 22);
  ctx.clip();
  if (state.mainImage?.image) {
    drawCoverImage(state.mainImage.image, x, y, boxW, boxH);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(x, y, boxW, boxH);
  } else {
    const gradient = ctx.createLinearGradient(x, y, x + boxW, y + boxH);
    gradient.addColorStop(0, colorWithAlpha(state.accent, 0.58));
    gradient.addColorStop(1, "rgba(255,255,255,0.08)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, boxW, boxH);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = `${Math.round(28 * state.fontScale)}px Paperlogy, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("MAIN IMAGE", x + boxW / 2, y + boxH / 2);
  }
  ctx.restore();

  ctx.strokeStyle = state.subAccent;
  ctx.lineWidth = 4;
  roundedStroke(x, y, boxW, boxH, 22);
}

function drawProfileImage(w, h) {
  const size = Math.round(Math.min(w, h) * (state.ratio === "wide" ? 0.18 : 0.2));
  const x = Math.round(w / 2 - size / 2);
  const y = Math.round(h / 2 - size / 2);

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  if (state.profileImage?.image) {
    drawCoverImage(state.profileImage.image, x, y, size, size);
  } else {
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, colorWithAlpha(state.subAccent, 0.82));
    gradient.addColorStop(1, colorWithAlpha(state.accent, 0.72));
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.font = `700 ${Math.round(size * 0.12)}px Paperlogy, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PROFILE", x + size / 2, y + size / 2);
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 8, 0, Math.PI * 2);
  ctx.strokeStyle = state.subAccent;
  ctx.lineWidth = Math.max(5, size * 0.04);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 18, 0, Math.PI * 2);
  ctx.strokeStyle = colorWithAlpha(state.accent, 0.55);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawContent(w, h) {
  const pad = Math.round(Math.min(w, h) * 0.07);
  const leftW = w * (state.ratio === "wide" ? 0.5 : 0.48);
  const titleY = pad + h * 0.12;
  const scale = state.fontScale;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = state.subAccent;
  ctx.font = `${Math.round(34 * scale)}px Rajdhani, sans-serif`;
  ctx.fillText("FIND YOUR LUMIA FRIEND", pad, titleY);

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.round(72 * scale)}px Paperlogy, sans-serif`;
  fitText(state.fields.nickname || "닉네임", pad, titleY + 78 * scale, leftW, 72 * scale);

  ctx.fillStyle = state.accent;
  ctx.font = `${Math.round(36 * scale)}px Rajdhani, sans-serif`;
  ctx.fillText(state.fields.handle || "@username", pad, titleY + 130 * scale);

  drawInfoBlock("MAIN", state.fields.mainCharacter, pad, titleY + 190 * scale, leftW);
  drawWrappedText(state.fields.bio, pad, titleY + 292 * scale, leftW, 34 * scale, 2, "#eef5f4");

  const chipY = h * (state.ratio === "wide" ? 0.55 : 0.58);
  drawStatRows(pad, chipY, leftW);
  drawCharacterSlots(w, h, pad);
  drawMemo(w, h, pad);
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
  fitText(value || "주 실험체", x + 20, y + 58 * scale, width - 40, 34 * scale);
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
  const rowH = Math.max(54, canvas.height * 0.039);
  rows.forEach(([label, values], index) => {
    const yy = y + index * (rowH + 10);
    ctx.fillStyle = "rgba(0,0,0,0.26)";
    roundedRect(x, yy, width, rowH, 10);
    ctx.fill();
    ctx.fillStyle = state.subAccent;
    ctx.font = `700 ${Math.round(22 * state.fontScale)}px Rajdhani, sans-serif`;
    ctx.fillText(label, x + 18, yy + rowH * 0.62);
    drawPills(values, x + width * 0.24, yy + 9, width * 0.74, rowH - 18);
  });
}

function drawPills(values, x, y, width, height) {
  let cursor = x;
  ctx.font = `${Math.round(22 * state.fontScale)}px Paperlogy, sans-serif`;
  values.filter(Boolean).slice(0, 6).forEach((value) => {
    const pillW = Math.min(ctx.measureText(value).width + 32, width);
    if (cursor + pillW > x + width) return;
    ctx.fillStyle = colorWithAlpha(state.accent, 0.22);
    roundedRect(cursor, y, pillW, height, 8);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(value, cursor + 16, y + height * 0.68);
    cursor += pillW + 8;
  });
}

function drawCharacterSlots(w, h, pad) {
  const labels = [
    ["주캐릭터 1", state.fields.fav1],
    ["주캐릭터 2", state.fields.fav2],
    ["애정캐릭터 1", state.fields.love1],
    ["애정캐릭터 2", state.fields.love2],
  ];
  const areaW = w - pad * 2;
  const slotW = (areaW - 30) / 4;
  const slotH = Math.max(94, h * 0.084);
  const y = h - pad - slotH;

  labels.forEach(([label, value], index) => {
    const x = pad + index * (slotW + 10);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    roundedRect(x, y, slotW, slotH, 12);
    ctx.fill();
    ctx.strokeStyle = index < 2 ? state.accent : state.subAccent;
    ctx.lineWidth = 2;
    roundedStroke(x, y, slotW, slotH, 12);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = `700 ${Math.round(18 * state.fontScale)}px Rajdhani, sans-serif`;
    ctx.fillText(label.toUpperCase(), x + 16, y + 30);
    ctx.fillStyle = "#ffffff";
    ctx.font = `${Math.round(32 * state.fontScale)}px Paperlogy, sans-serif`;
    fitText(value || "-", x + 16, y + slotH - 26, slotW - 32, 32 * state.fontScale);
  });
}

function drawMemo(w, h, pad) {
  const boxW = w * (state.ratio === "wide" ? 0.34 : 0.38);
  const boxH = h * (state.ratio === "wide" ? 0.24 : 0.22);
  const x = w - pad - boxW;
  const y = h - pad - boxH - Math.max(120, h * 0.1);
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
    ["#13c8b5", "#ffcf5a"],
    ["#5bd7ff", "#f46b83"],
    ["#8ee56f", "#f2d06b"],
    ["#ff7c55", "#8de0d1"],
    ["#d0f16f", "#62a8ff"],
  ];
  const [accent, sub] = pairs[Math.floor(Math.random() * pairs.length)];
  state.accent = accent;
  state.subAccent = sub;
  syncControls();
  draw();
}

function resetState() {
  state.background = null;
  state.mainImage = null;
  state.profileImage = null;
  state.fields.nickname = "루미아의 친구";
  state.fields.handle = "@eternal_return";
  state.fields.mainCharacter = "아야 / 헤이즈";
  state.fields.bio = "같이 오래 게임할 트친을 찾고 있어요.";
  state.fields.memo = "평일 저녁, 주말 접속. 실수해도 웃고 넘기는 분위기를 좋아해요.";
  state.fields.activityOther = "";
  state.fields.fav1 = "쇼이치";
  state.fields.fav2 = "레녹스";
  state.fields.love1 = "엠마";
  state.fields.love2 = "리오";
  state.chips = {
    modes: ["일반"],
    voice: ["전부"],
    traits: ["즐겜"],
    gender: ["기타"],
    age: ["성인"],
    activity: ["소비", "흔적"],
    bye: ["블언블"],
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

init();
