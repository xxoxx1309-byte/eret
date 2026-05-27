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

const state = {
  template: "neon",
  backgroundMode: "default",
  accent: "#13c8b5",
  subAccent: "#ffcf5a",
  bgStart: "#071011",
  bgEnd: "#173735",
  canvasFont: "Paperozi",
  fontScale: 1,
  imageDim: 0.28,
  background: null,
  mainImage: null,
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
  $("#mainImageInput").addEventListener("change", (event) => loadImage(event, "mainImage"));
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
  $("#mainCharactersInput").addEventListener("input", (event) => {
    state.characters.mainText = event.target.value;
    draw();
  });

  $("#loveCharactersInput").addEventListener("input", (event) => {
    state.characters.loveText = event.target.value;
    draw();
  });
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
    mainImage: "mainImageFileName",
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
  drawMainImage(layout.mainImage);
  drawProfileImage(layout.profileImage);
  drawContent(w, h, layout);
}

function getCanvasLayout(w, h) {
  const pad = Math.round(Math.min(w, h) * 0.064);
  const inner = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };
  const profileSize = Math.round(inner.w * 0.18);
  return {
    pad,
    inner,
    content: { x: pad + inner.w * 0.09, title: pad + inner.h * 0.11, w: inner.w * 0.7, h: inner.h * 0.19 },
    mainImage: { x: pad + inner.w * 0.14, y: pad + inner.h * 0.31, w: inner.w * 0.72, h: inner.h * 0.23 },
    profileImage: { x: w / 2 - profileSize / 2, y: pad + inner.h * 0.535, size: profileSize },
    stat: { x: pad + inner.w * 0.1, y: pad + inner.h * 0.68, w: inner.w * 0.8, columns: 2 },
    memo: { x: pad + inner.w * 0.16, y: pad + inner.h * 0.925, w: inner.w * 0.68, h: inner.h * 0.055 },
    slots: { x: pad + inner.w * 0.16, y: pad + inner.h * 0.805, w: inner.w * 0.68, h: inner.h * 0.105 },
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
    setCanvasFont(24 * state.fontScale);
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
    setCanvasFont(size * 0.1, 700);
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

  drawGlassPanel(pad - 22, titleY - 56 * scale, leftW + 44, layout.content.h, 14, 0.36);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = state.subAccent;
  setCanvasFont(34 * scale, 700);
  fitText(catchphraseText(), pad, titleY, leftW, 34 * scale, 14);

  ctx.fillStyle = "#ffffff";
  setCanvasFont(72 * scale, 700);
  if (state.fields.nickname) fitText(state.fields.nickname, pad, titleY + 78 * scale, leftW, 72 * scale);

  ctx.fillStyle = state.accent;
  setCanvasFont(36 * scale, 600);
  if (state.fields.handle) ctx.fillText(state.fields.handle, pad, titleY + 130 * scale);

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
    ["INFO", [...state.chips.gender, ...state.chips.age, ...activityValues()]],
    ["BYE", state.chips.bye],
  ];
  const layout = getCanvasLayout(canvas.width, canvas.height);
  const columns = layout.stat.columns || 1;
  const gap = 8;
  const columnGap = 10;
  const columnW = (width - columnGap * (columns - 1)) / columns;
  const baseRowH = Math.max(42, canvas.height * 0.027);

  rows.forEach(([label, values], index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const xx = x + col * (columnW + columnGap);
    const yy = y + row * (baseRowH + gap);
    const pillAreaW = columnW * (columns > 1 ? 0.66 : 0.74);
    const layout = getPillLayout(values, pillAreaW, baseRowH - 18);
    ctx.fillStyle = "rgba(0,0,0,0.46)";
    roundedRect(xx, yy, columnW, baseRowH, 10);
    ctx.fill();
    ctx.fillStyle = state.subAccent;
    setCanvasFont((columns > 1 ? 18 : 22) * state.fontScale, 700);
    ctx.fillText(label, xx + 16, yy + baseRowH * 0.62);
    drawPills(layout, xx + columnW * (columns > 1 ? 0.3 : 0.24), yy + 9, pillAreaW);
  });
}

function getPillLayout(values, width, singleHeight) {
  const rawItems = values.filter(Boolean);
  setCanvasFont(22 * state.fontScale);
  const gap = 8;
  const natural = rawItems.map((value) => ({
    value,
    width: Math.min(ctx.measureText(value).width + 28, Math.max(42, width * 0.48)),
  }));
  const pillH = singleHeight;
  const visible = [];
  let used = 0;

  natural.forEach((item, index) => {
    const remaining = natural.length - index - 1;
    const needsMore = remaining > 0;
    const moreWidth = needsMore ? 44 + gap : 0;
    const nextWidth = item.width + (visible.length ? gap : 0);
    if (used + nextWidth + moreWidth <= width) {
      visible.push(item);
      used += nextWidth;
    }
  });

  const hidden = Math.max(0, natural.length - visible.length);
  if (!visible.length && hidden) {
    visible.push({
      value: `+${hidden}`,
      width: Math.min(44, width),
      isMore: true,
    });
    return { rows: [visible], height: pillH, pillH, gap };
  }

  if (hidden) {
    const more = {
      value: `+${hidden}`,
      width: 44,
      isMore: true,
    };
    while (visible.length && rowWidth([...visible, more], gap) > width) visible.pop();
    visible.push(more);
  }

  return { rows: [visible], height: pillH, pillH, gap };
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
      ctx.fillStyle = colorWithAlpha(state.accent, item.isMore ? 0.52 : 0.36);
      roundedRect(cursor, yy, pillW, layout.pillH, 8);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      const fontSize = Math.max(16, Math.round(22 * state.fontScale * Math.min(1, scale + 0.08)));
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
  drawGlassPanel(x, y, boxW, boxH, 16, 0.42);
  ctx.strokeStyle = colorWithAlpha(state.accent, 0.72);
  ctx.lineWidth = 2;
  roundedStroke(x, y, boxW, boxH, 16);

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = state.subAccent;
  setCanvasFont(18 * state.fontScale, 700);
  ctx.fillText("CHARACTERS", x + 18, y + 15);

  const mainValues = characterDisplayValues("main");
  const loveValues = characterDisplayValues("love");
  const sectionGap = Math.max(10, boxH * 0.08);
  const sectionY = y + Math.max(42, boxH * 0.28);
  const sectionH = (boxH - (sectionY - y) - sectionGap - 16) / 2;
  drawCharacterLine("주캐", mainValues, x + 18, sectionY, boxW - 36, sectionH, state.accent);
  drawCharacterLine("애정캐", loveValues, x + 18, sectionY + sectionH + sectionGap, boxW - 36, sectionH, state.subAccent);
  ctx.textBaseline = "alphabetic";
}

function characterDisplayValues(type) {
  return splitCommaValues(state.characters[`${type}Text`]).slice(0, 3);
}

function drawCharacterLine(label, values, x, y, width, height, accent) {
  ctx.fillStyle = colorWithAlpha(accent, 0.2);
  roundedRect(x, y, width, height, 10);
  ctx.fill();

  ctx.fillStyle = accent;
  setCanvasFont(Math.min(18, height * 0.32) * state.fontScale, 700);
  ctx.fillText(label, x + 16, y + Math.max(9, height * 0.2));

  const text = values.length ? values.join(", ") : "선택 안 함";
  const labelW = Math.min(width * 0.22, 86);
  const textX = x + labelW;
  const textW = width - labelW - 18;
  ctx.fillStyle = "#ffffff";
  setCanvasFont(Math.min(22, height * 0.38) * state.fontScale, 600);
  fitText(text, textX, y + height * 0.34, textW, Math.min(22, height * 0.38) * state.fontScale, 12);
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
  const link = document.createElement("a");
  link.download = `eret-profile-${Date.now()}.png`;
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
  state.mainImage = null;
  state.profileImage = null;
  setUploadName("background", "선택 안 함");
  setUploadName("mainImage", "선택 안 함");
  setUploadName("profileImage", "선택 안 함");
  state.bgStart = "#071011";
  state.bgEnd = "#173735";
  state.canvasFont = "Paperozi";
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
  };
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
