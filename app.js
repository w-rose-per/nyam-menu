/**
 * [냠냠 퀘스트] 디저트테이블냠냠&과일 마곡점 — 모바일 최적화 8-Bit 도트 메뉴 선정 앱 (v2)
 * 1. 최초 진입 시 이름 입력 필수 팝업창 통과 후 진행
 * 2. STEP 1: 음료 1개 선택 (drinks_photo 7개 카테고리 66종 · HOT/ICE 완벽 구분)
 * 3. STEP 2: 디저트 1순위 선택 (6개 대분류 -> 상세 메뉴 확장)
 * 4. STEP 3: 디저트 2순위 선택 (품절 대비 · 1순위와 동일 메뉴 선택 잠금/차단)
 * 5. STEP 4: 최종 영수증 확인 + Google 스프레드시트 실시간 연동 & 배민 링크/합산표 제공
 */

(function () {
  "use strict";

  const CONFIG = window.NYAM_CONFIG || {};
  const MENU = window.NYAM_MENU || { drinks: [], desserts: [] };
  const BAEMIN_URL = CONFIG.BAEMIN_URL || "https://s.baemin.com/bK000vefFFRgd";

  const STORAGE_KEYS = {
    LOCAL_ORDERS: "nyam_magok_local_orders_v2",
    SHEET_URL: "nyam_magok_sheet_url_v1"
  };

  // 모달 내 원클릭 복사용 Apps Script 코드 (v2: 1순위·2순위 지원)
  const APPS_SCRIPT_TEMPLATE = `const ORDER_SHEET_NAME = "주문내역";
const SUMMARY_SHEET_NAME = "메뉴별집계";

function refreshSummaryNow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  rebuildSummarySheet(ss, readAllOrders(getOrInitOrderSheet(ss)));
}

function getOrInitOrderSheet(ss) {
  let sheet = ss.getSheetByName(ORDER_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(ORDER_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    const headers = ["이름","음료 최종표기","디저트 1순위","디저트 2순위(품절대비)","음료 분류","음료 메뉴","온도(HOT/ICE)","1순위 배민표기","2순위 배민표기","요청메모","예상금액(1순위기준)","최종선택시각"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#2b213a").setFontColor("#ffd166").setFontWeight("bold");
  }
  return sheet;
}

function rebuildSummarySheet(ss, orders) {
  let sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SUMMARY_SHEET_NAME);
  sheet.clear();
  const activeOrders = orders.filter(function (o) {
    return !/^\\[삭제됨/.test(String(o.memo || "").trim());
  });
  const drinkCounts = {}, dessert1Counts = {};
  let totalPrice = 0;
  activeOrders.forEach(function (o) {
    const dKey = o.drinkDisplay || "미선택";
    drinkCounts[dKey] = (drinkCounts[dKey] || 0) + 1;
    const ds1Key = o.baeminDessert1Label || o.dessert1Display || "선택안함";
    dessert1Counts[ds1Key] = (dessert1Counts[ds1Key] || 0) + 1;
    totalPrice += Number(o.estimatedPrice || 0);
  });
  const rows = [
    ["[디저트테이블냠냠&과일 마곡점] 실시간 주문 합산표", "", ""],
    ["총 참여 인원", activeOrders.length + "명", "예상 총액(1순위 기준): " + totalPrice.toLocaleString() + "원"],
    ["배민 매장 링크", "https://s.baemin.com/bK000vefFFRgd", ""],
    ["", "", ""],
    ["🥤 음료 메뉴 (온도 포함)", "수량", "비고"]
  ];
  Object.keys(drinkCounts).sort(function(a,b){return drinkCounts[b]-drinkCounts[a];}).forEach(function(k){
    rows.push([k, drinkCounts[k], ""]);
  });
  rows.push(["", "", ""], ["🥇 디저트 1순위 장바구니 합계", "수량", "비고"]);
  Object.keys(dessert1Counts).sort(function(a,b){return dessert1Counts[b]-dessert1Counts[a];}).forEach(function(k){
    rows.push([k, dessert1Counts[k], k === "선택안함" ? "디저트 패스" : "기본 주문"]);
  });
  rows.push(["", "", ""], ["🥈 품절 시 개인별 2순위 대체 가이드", "1순위 메뉴", "품절 시 2순위 대체 메뉴"]);
  activeOrders.forEach(function(o){
    rows.push([o.name, o.baeminDessert1Label || o.dessert1Display || "선택안함", o.baeminDessert2Label || o.dessert2Display || "선택안함"]);
  });
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
  sheet.autoResizeColumns(1, 3);
}

function readAllOrders(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
  return values.filter(function(r){ return String(r[0]||"").trim(); }).map(function(r){
    return {
      name: String(r[0]).trim(), drinkDisplay: String(r[1]||""),
      dessert1Display: String(r[2]||""), dessert2Display: String(r[3]||""),
      drinkCategory: String(r[4]||""), drinkName: String(r[5]||""), drinkTemp: String(r[6]||""),
      baeminDessert1Label: String(r[7]||""), baeminDessert2Label: String(r[8]||""),
      memo: String(r[9]||""), estimatedPrice: Number(r[10]||0), timestamp: String(r[11]||"")
    };
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const orders = readAllOrders(getOrInitOrderSheet(ss));
  return jsonResponse({ ok: true, orders: orders, count: orders.length });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const name = String(body.name || "").trim();
    if (!name) return jsonResponse({ ok: false, error: "이름 누락" });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrInitOrderSheet(ss);
    const lastRow = sheet.getLastRow();
    const nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    let rowIdx = -1;
    if (lastRow > 1) {
      const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < names.length; i++) {
        if (String(names[i][0] || "").trim() === name) { rowIdx = i + 2; break; }
      }
    }
    if (body.action === "delete" || body.action === "soft_delete") {
      if (rowIdx > 1) {
        const curMemo = String(sheet.getRange(rowIdx, 10).getValue() || "").replace(/^\\[삭제됨[^\\]]*\\]\\s*/, "").trim();
        const delMemo = curMemo ? "[삭제됨 " + nowStr + "] " + curMemo : "[삭제됨 " + nowStr + "]";
        sheet.getRange(rowIdx, 10).setValue(delMemo);
        sheet.getRange(rowIdx, 12).setValue(nowStr);
      }
      const afterDel = readAllOrders(sheet);
      rebuildSummarySheet(ss, afterDel);
      return jsonResponse({ ok: true, mode: "soft_deleted", orders: afterDel });
    }
    const row = [
      name, String(body.drinkDisplay||""), String(body.dessert1Display||"선택안함"), String(body.dessert2Display||"선택안함"),
      String(body.drinkCategory||""), String(body.drinkName||""), String(body.drinkTemp||""),
      String(body.baeminDessert1Label||""), String(body.baeminDessert2Label||""),
      String(body.memo||""), Number(body.estimatedPrice||0), nowStr
    ];
    if (rowIdx > 1) sheet.getRange(rowIdx, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);
    const orders = readAllOrders(sheet);
    rebuildSummarySheet(ss, orders);
    return jsonResponse({ ok: true, orders: orders });
  } finally {
    lock.releaseLock();
  }
}`;

  // 상태 객체
  const state = {
    stage: 1, // 1: 음료 1개, 2: 디저트 1순위, 3: 디저트 2순위, 4: 최종 확인
    heroName: "",
    nameConfirmed: false,

    activeDrinkCategory: MENU.drinks[0] ? MENU.drinks[0].id : "coffee",
    drinkSearchQuery: "",
    selectedDrink: null, // { id, categoryId, categoryName, name, temp, price, display }

    expandedDessert1Category: "greek_mochi",
    customDessert1Input: "",
    selectedDessert1: null, // { categoryId, categoryName, itemId, name, baeminLabel, price, display }

    expandedDessert2Category: "financier",
    customDessert2Input: "",
    selectedDessert2: null, // { categoryId, categoryName, itemId, name, baeminLabel, price, display }

    memo: "",
    sheetUrl: "",
    isOnlineSync: false,
    isSubmitting: false,
    orders: [],

    gachaMode: null, // 'drink' | 'dessert1' | 'dessert2'
    gachaCandidate: null
  };

  const sfx = new window.PixelAudioEngine();
  const scene = new window.PixelCafeScene("cafeCanvas");
  let typewriterTimer = null;

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatWon(num) {
    const n = Number(num || 0);
    return n > 0 ? n.toLocaleString("ko-KR") + "원" : "0원";
  }

  function isDeletedOrder(o) {
    if (!o) return true;
    return o.deleted === true || /^\[삭제됨/.test(String(o.memo || "").trim());
  }

  function getActiveOrders() {
    return (state.orders || []).filter((o) => !isDeletedOrder(o));
  }

  function normalizeMenuKey(str) {
    return String(str || "")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  // 1순위와 2순위 디저트가 동일 메뉴인지 판별
  function isSameDessertChoice(d1, d2) {
    if (!d1 || !d2) return false;
    if (d1.categoryId === "none" || d2.categoryId === "none") {
      return false;
    }
    if (d1.itemId && d2.itemId && !d1.itemId.startsWith("custom_") && !d2.itemId.startsWith("custom_")) {
      return d1.itemId === d2.itemId;
    }
    return (
      normalizeMenuKey(d1.name) === normalizeMenuKey(d2.name) ||
      normalizeMenuKey(d1.baeminLabel) === normalizeMenuKey(d2.baeminLabel)
    );
  }

  // 음료 HOT 선택 시 'PET(캔)' 표기를 실제 제공 용기인 '(종이컵)'으로 깔끔하게 변환
  function formatDrinkDisplay(rawName, temp) {
    if (temp === "HOT") {
      const hotName = rawName.replace(/\s*PET\(캔\)/i, " (종이컵)");
      return `[HOT] ${hotName}`;
    }
    return `[ICE] ${rawName}`;
  }

  function isValidAppsScriptUrl(url) {
    if (!url || typeof url !== "string") return false;
    return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(\?.*)?$/.test(url.trim());
  }

  let toastTimeout = null;
  function showToast(msg) {
    const el = document.getElementById("pixelToast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      el.classList.remove("show");
    }, 2700);
  }

  function setNpcDialog(message) {
    const target = document.getElementById("npcMessageText");
    if (!target) return;
    clearInterval(typewriterTimer);
    target.textContent = "";
    let idx = 0;
    const chars = Array.from(message);
    typewriterTimer = setInterval(() => {
      idx += 2;
      target.textContent = chars.slice(0, idx).join("");
      if (idx >= chars.length) {
        clearInterval(typewriterTimer);
      }
    }, 20);
  }

  function initSheetAndLinks() {
    const params = new URLSearchParams(window.location.search);
    const paramSheet = params.get("sheet");
    if (paramSheet && isValidAppsScriptUrl(paramSheet)) {
      state.sheetUrl = paramSheet.trim();
      localStorage.setItem(STORAGE_KEYS.SHEET_URL, state.sheetUrl);
    } else if (CONFIG.GOOGLE_SCRIPT_URL && isValidAppsScriptUrl(CONFIG.GOOGLE_SCRIPT_URL)) {
      state.sheetUrl = CONFIG.GOOGLE_SCRIPT_URL.trim();
    } else {
      const saved = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
      if (saved && isValidAppsScriptUrl(saved)) {
        state.sheetUrl = saved.trim();
      }
    }

    ["baeminTopBanner", "baeminPopupLink", "baeminStep4Link"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.href = BAEMIN_URL;
    });

    const preview = document.getElementById("appsScriptPreview");
    if (preview) preview.textContent = APPS_SCRIPT_TEMPLATE;
  }

  function loadLocalOrders() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_ORDERS);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveLocalOrders(orders) {
    try {
      localStorage.setItem(STORAGE_KEYS.LOCAL_ORDERS, JSON.stringify(orders));
    } catch (_) {
      // ignore
    }
  }

  async function fetchOrders(silent = false) {
    const pill = document.getElementById("syncStatusPill");
    if (!state.sheetUrl) {
      state.isOnlineSync = false;
      state.orders = loadLocalOrders();
      if (pill) {
        pill.className = "sync-pill local";
        pill.textContent = "🟡 로컬 모드 (시트 미연결)";
      }
      renderPartyBoard();
      return;
    }

    try {
      const sep = state.sheetUrl.includes("?") ? "&" : "?";
      const res = await fetch(`${state.sheetUrl}${sep}action=list&t=${Date.now()}`, {
        method: "GET",
        cache: "no-store"
      });
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.orders)) {
        state.isOnlineSync = true;
        state.orders = data.orders;
        saveLocalOrders(data.orders);
        if (pill) {
          pill.className = "sync-pill online";
          pill.textContent = "🟢 Google 시트 실시간 연동중";
        }
        renderPartyBoard();
        if (!silent) showToast("✅ 실시간 현황판을 최신 상태로 업데이트했어요!");
        return;
      }
      throw new Error((data && data.error) || "응답 오류");
    } catch (_) {
      state.isOnlineSync = false;
      state.orders = loadLocalOrders();
      if (pill) {
        pill.className = "sync-pill local";
        pill.textContent = "🟠 오프라인 백업 표시중";
      }
      renderPartyBoard();
      if (!silent) {
        showToast("⚠️ 시트 연결 확인 필요: Apps Script 웹 앱 권한(모든 사용자)을 확인해 주세요.");
      }
    }
  }

  // ==================== 필수 이름 입력 팝업 제어 ====================
  function openNameEntryPopup() {
    const modal = document.getElementById("nameEntryModal");
    const input = document.getElementById("popupNameInput");
    if (!modal) return;
    modal.classList.add("open");
    document.body.classList.add("modal-locked");
    if (input) {
      input.value = state.heroName || "";
      setTimeout(() => input.focus(), 80);
    }
  }

  function confirmPopupName() {
    const input = document.getElementById("popupNameInput");
    const val = (input ? input.value : "").trim();
    if (!val) {
      sfx.playError();
      showToast("👤 주문자 이름을 입력해야 다음 단계로 넘어갈 수 있어요!");
      if (input) input.focus();
      return;
    }

    state.heroName = val;
    state.nameConfirmed = true;
    document.getElementById("nameEntryModal").classList.remove("open");
    document.body.classList.remove("modal-locked");

    sfx.playEquip();
    const restored = tryRestoreExistingOrder(val);
    goToStage(1);
    if (!restored) {
      showToast(`⚔️ 환영합니다, [${val}]님! 음료 1개를 골라주세요.`);
    }
  }

  function tryRestoreExistingOrder(name) {
    const existing = getActiveOrders().find((o) => o.name === name);
    if (!existing) return false;

    if (existing.drinkDisplay) {
      state.selectedDrink = {
        id: "restored_drink",
        categoryId: "coffee",
        categoryName: existing.drinkCategory || "기존선택",
        name: existing.drinkName || existing.drinkDisplay,
        temp: existing.drinkTemp || "ICE",
        price: 0,
        display: existing.drinkDisplay
      };
    }
    const d1Disp = existing.dessert1Display || existing.dessertDisplay || "";
    if (d1Disp) {
      state.selectedDessert1 = {
        categoryId: d1Disp === "선택안함" ? "none" : "restored_1",
        categoryName: "기존1순위",
        itemId: d1Disp === "선택안함" ? "none" : "restored_1_" + d1Disp,
        name: d1Disp,
        baeminLabel: existing.baeminDessert1Label || d1Disp,
        price: 0,
        display: d1Disp
      };
    }
    const d2Disp = existing.dessert2Display || "";
    if (d2Disp) {
      state.selectedDessert2 = {
        categoryId: d2Disp.includes("선택안함") || d2Disp.includes("해당없음") ? "none" : "restored_2",
        categoryName: "기존2순위",
        itemId: d2Disp.includes("선택안함") ? "none" : "restored_2_" + d2Disp,
        name: d2Disp,
        baeminLabel: existing.baeminDessert2Label || d2Disp,
        price: 0,
        display: d2Disp
      };
    }
    state.memo = existing.memo || "";
    const memoEl = document.getElementById("orderMemoInput");
    if (memoEl) memoEl.value = state.memo;
    showToast(`🔄 [${name}]님의 기존 주문 내역을 불러왔어요! 수정 후 다시 등록할 수 있습니다.`);
    return true;
  }

  // ==================== 상단 인벤토리 & 하단 모바일 액션 바 업데이트 ====================
  function updateHudAndDock() {
    const invHero = document.getElementById("invHeroVal");
    const invDrink = document.getElementById("invDrinkVal");
    const invD1 = document.getElementById("invDessert1Val");
    const invD2 = document.getElementById("invDessert2Val");

    const slotHero = document.getElementById("slotHero");
    const slotDrink = document.getElementById("slotDrink");
    const slotD1 = document.getElementById("slotDessert1");
    const slotD2 = document.getElementById("slotDessert2");

    if (state.heroName) {
      invHero.textContent = state.heroName;
      invHero.classList.remove("empty");
      slotHero.classList.add("filled");
    } else {
      invHero.textContent = "미입력";
      invHero.classList.add("empty");
      slotHero.classList.remove("filled");
    }

    if (state.selectedDrink) {
      invDrink.textContent = state.selectedDrink.display;
      invDrink.classList.remove("empty");
      slotDrink.classList.add("filled");
    } else {
      invDrink.textContent = "미선택";
      invDrink.classList.add("empty");
      slotDrink.classList.remove("filled");
    }

    if (state.selectedDessert1) {
      invD1.textContent = state.selectedDessert1.display;
      invD1.classList.remove("empty");
      slotD1.classList.add("filled");
    } else {
      invD1.textContent = "미선택";
      invD1.classList.add("empty");
      slotD1.classList.remove("filled");
    }

    if (state.selectedDessert2) {
      invD2.textContent = state.selectedDessert2.display;
      invD2.classList.remove("empty");
      slotD2.classList.add("filled");
    } else {
      invD2.textContent = "미선택";
      invD2.classList.add("empty");
      slotD2.classList.remove("filled");
    }

    // 스텝 필 상태
    const stepDone = {
      1: Boolean(state.selectedDrink),
      2: Boolean(state.selectedDessert1),
      3: Boolean(state.selectedDessert2),
      4: false
    };
    for (let s = 1; s <= 4; s++) {
      const pill = document.getElementById(`stepPill${s}`);
      if (!pill) continue;
      pill.classList.toggle("active", state.stage === s);
      pill.classList.toggle("done", state.stage !== s && stepDone[s]);
    }

    const stageLabels = {
      1: "STEP 1/4 · 음료 1개 선택",
      2: "STEP 2/4 · 디저트 1순위 선택",
      3: "STEP 3/4 · 디저트 2순위(품절대비)",
      4: "STEP 4/4 · 최종 주문서 확인"
    };
    const lbl = document.getElementById("canvasStageLabel");
    if (lbl) lbl.textContent = stageLabels[state.stage] || "";

    // 하단 모바일 엄지 액션 바 업데이트
    const prevBtn = document.getElementById("btnDockPrev");
    const nextBtn = document.getElementById("btnDockNext");
    if (prevBtn && nextBtn) {
      nextBtn.className = "pixel-btn dock-next-btn";
      if (state.stage === 1) {
        prevBtn.textContent = "👤 이름변경";
        nextBtn.textContent = "다음: 디저트 1순위 ▶";
        nextBtn.classList.add(state.selectedDrink ? "pixel-btn-mint" : "pixel-btn-pink");
      } else if (state.stage === 2) {
        prevBtn.textContent = "◀ 음료";
        const skip2 = state.selectedDessert1 && state.selectedDessert1.categoryId === "none";
        nextBtn.textContent = skip2 ? "다음: 최종 확인 ▶" : "다음: 디저트 2순위 ▶";
        nextBtn.classList.add(state.selectedDessert1 ? "pixel-btn-mint" : "pixel-btn-pink");
      } else if (state.stage === 3) {
        prevBtn.textContent = "◀ 1순위";
        nextBtn.textContent = "다음: 최종 확인 ▶";
        nextBtn.classList.add(state.selectedDessert2 ? "pixel-btn-mint" : "pixel-btn-pink");
      } else {
        prevBtn.textContent = "◀ 수정";
        nextBtn.textContent = state.isSubmitting ? "⏳ 전송 중..." : "🚀 주문 등록 완료!";
        nextBtn.classList.add("pixel-btn-mint");
      }
    }

    scene.setState({
      stage: state.stage,
      heroName: state.heroName,
      drink: state.selectedDrink,
      dessert: state.selectedDessert1
    });
  }

  // ==================== 스테이지 이동 검증 ====================
  function goToStage(targetStage) {
    if (!state.nameConfirmed || !state.heroName) {
      openNameEntryPopup();
      return;
    }

    if (targetStage >= 2 && !state.selectedDrink) {
      sfx.playError();
      showToast("🥤 먼저 STEP 1에서 마실 음료 1개(ICE/HOT)를 골라주세요!");
      targetStage = 1;
    }

    if (targetStage >= 3 && !state.selectedDessert1) {
      sfx.playError();
      showToast("🥇 먼저 STEP 2에서 디저트 [1순위]를 선택해 주세요!");
      targetStage = 2;
    }

    if (targetStage === 4) {
      if (!state.selectedDessert2) {
        sfx.playError();
        showToast("🥈 품절 대비용 디저트 [2순위]를 선택해 주세요!");
        targetStage = 3;
      } else if (isSameDessertChoice(state.selectedDessert1, state.selectedDessert2)) {
        sfx.playError();
        showToast("⚠️ 디저트 2순위는 1순위와 다른 메뉴여야 합니다!");
        state.selectedDessert2 = null;
        targetStage = 3;
      }
    }

    state.stage = targetStage;
    for (let s = 1; s <= 4; s++) {
      const panel = document.getElementById(`stage${s}`);
      if (panel) panel.classList.toggle("active", s === targetStage);
    }

    if (targetStage === 1) {
      renderDrinkCategoryTabs();
      renderDrinkList();
      setNpcDialog(
        `[${state.heroName}]님, 환영해요! 마실 음료 1개를 골라 [🧊 ICE] 또는 [🔥 HOT] 버튼을 눌러주세요!`
      );
    } else if (targetStage === 2) {
      renderDessertStack(1);
      setNpcDialog(
        `가장 드시고 싶은 [1순위 디저트]를 골라주세요! 분류 상자를 터치하면 상세 메뉴가 열립니다.`
      );
    } else if (targetStage === 3) {
      renderDessertStack(2);
      setNpcDialog(
        `혹시 1순위가 품절될 경우를 대비해, 1순위와 다른 [2순위 디저트]를 하나 더 골라주세요!`
      );
    } else if (targetStage === 4) {
      renderFinalReceipt();
      setNpcDialog(
        `준비 완료! [${state.heroName}]님의 음료 1개와 디저트 1·2순위를 확인하고 주문 등록을 눌러주세요!`
      );
    }

    updateHudAndDock();
    const activePanel = document.getElementById(`stage${targetStage}`);
    if (activePanel) {
      window.scrollTo({ top: Math.max(0, activePanel.offsetTop - 130), behavior: "smooth" });
    }
  }

  // ==================== STEP 1: 음료 (drinks_photo 66종) ====================
  function renderDrinkCategoryTabs() {
    const wrap = document.getElementById("drinkCategoryTabs");
    const descBox = document.getElementById("drinkCategoryDesc");
    if (!wrap) return;

    wrap.innerHTML = MENU.drinks
      .map((cat) => {
        const isActive = !state.drinkSearchQuery && state.activeDrinkCategory === cat.id;
        return `
          <button type="button" class="cat-tab ${isActive ? "active" : ""}" data-drink-cat="${escapeHtml(cat.id)}">
            <span>${cat.icon}</span>
            <span>${escapeHtml(cat.name)} (${cat.items.length})</span>
          </button>
        `;
      })
      .join("");

    if (descBox) {
      if (state.drinkSearchQuery.trim()) {
        descBox.textContent = `🔎 '${state.drinkSearchQuery.trim()}' 전체 카테고리 통합 검색 결과입니다.`;
      } else {
        const activeCat = MENU.drinks.find((c) => c.id === state.activeDrinkCategory) || MENU.drinks[0];
        descBox.textContent = activeCat ? `💡 ${activeCat.desc}` : "";
      }
    }

    wrap.querySelectorAll("[data-drink-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        sfx.playTab();
        state.activeDrinkCategory = btn.getAttribute("data-drink-cat");
        state.drinkSearchQuery = "";
        const searchInput = document.getElementById("drinkSearchInput");
        if (searchInput) searchInput.value = "";
        renderDrinkCategoryTabs();
        renderDrinkList();
      });
    });
  }

  function equipDrink(drinkObj) {
    state.selectedDrink = drinkObj;
    sfx.playEquip();
    updateHudAndDock();
    renderDrinkList();
    setNpcDialog(
      `🥤 ${drinkObj.display} 선택 완료! 하단 [다음: 디저트 1순위 ▶] 버튼을 눌러 계속 진행해 주세요!`
    );
    showToast(`🥤 ${drinkObj.display} 장착! 하단 [다음] 버튼을 눌러주세요.`);
  }

  function renderDrinkList() {
    const container = document.getElementById("drinkListContainer");
    if (!container) return;

    const query = state.drinkSearchQuery.trim().toLowerCase();
    let matchedItems = [];

    if (query) {
      MENU.drinks.forEach((cat) => {
        cat.items.forEach((item) => {
          if (item.name.toLowerCase().includes(query) || cat.name.toLowerCase().includes(query)) {
            matchedItems.push({ cat, item });
          }
        });
      });
    } else {
      const currentCat = MENU.drinks.find((c) => c.id === state.activeDrinkCategory) || MENU.drinks[0];
      if (currentCat && currentCat.items) {
        matchedItems = currentCat.items.map((item) => ({ cat: currentCat, item }));
      }
    }

    if (matchedItems.length === 0) {
      container.innerHTML = `
        <div class="drink-card" style="grid-column: 1 / -1; text-align:center; padding:20px;">
          <p style="color:var(--text-sub);">🔎 '${escapeHtml(state.drinkSearchQuery)}'에 해당하는 음료가 없습니다.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = matchedItems
      .map(({ cat, item }) => {
        const isSelectedItem = state.selectedDrink && state.selectedDrink.id === item.id;
        const selTemp = isSelectedItem ? state.selectedDrink.temp : "";
        const supportsIce = item.temps.includes("ICE");
        const supportsHot = item.temps.includes("HOT");

        const badgeClass =
          item.badge === "NEW"
            ? "badge-new"
            : item.badge === "ICE전용"
            ? "badge-ice"
            : "";

        return `
          <div class="drink-card ${isSelectedItem ? "selected" : ""}">
            <div class="drink-card-top">
              <div>
                <div class="drink-name">${escapeHtml(item.name)}</div>
                <div class="drink-price">
                  ${query ? `<span style="color:var(--text-muted);">[${escapeHtml(cat.name)}]</span> ` : ""}
                  ${formatWon(item.price)}
                </div>
                ${item.note ? `<div class="drink-note">${escapeHtml(item.note)}</div>` : ""}
              </div>
              ${item.badge ? `<span class="pixel-badge ${badgeClass}">${escapeHtml(item.badge)}</span>` : ""}
            </div>

            <div class="temp-btn-group">
              ${
                supportsIce
                  ? `<button
                      type="button"
                      class="temp-btn ice-btn ${selTemp === "ICE" ? "active" : ""}"
                      data-select-drink="${escapeHtml(item.id)}"
                      data-cat-id="${escapeHtml(cat.id)}"
                      data-temp="ICE"
                    >
                      🧊 ICE ${!supportsHot ? "(아이스 전용)" : "(PET캔)"}
                    </button>`
                  : ""
              }
              ${
                supportsHot
                  ? `<button
                      type="button"
                      class="temp-btn hot-btn ${selTemp === "HOT" ? "active" : ""}"
                      data-select-drink="${escapeHtml(item.id)}"
                      data-cat-id="${escapeHtml(cat.id)}"
                      data-temp="HOT"
                    >
                      🔥 HOT (종이컵)
                    </button>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");

    container.querySelectorAll("[data-select-drink]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemId = btn.getAttribute("data-select-drink");
        const catId = btn.getAttribute("data-cat-id");
        const temp = btn.getAttribute("data-temp");
        const cat = MENU.drinks.find((c) => c.id === catId);
        const item = cat ? cat.items.find((i) => i.id === itemId) : null;
        if (!item) return;

        equipDrink({
          id: item.id,
          categoryId: cat.id,
          categoryName: cat.name,
          name: item.name,
          temp: temp,
          price: item.price || 0,
          display: formatDrinkDisplay(item.name, temp)
        });
      });
    });
  }

  // ==================== STEP 2 & STEP 3: 디저트 1순위 / 2순위 공통 렌더러 ====================
  function equipDessertByRank(rank, dessertObj) {
    if (rank === 1) {
      state.selectedDessert1 = dessertObj;

      // 1순위를 '선택안함'으로 고른 경우 -> 품절될 디저트가 없으므로 2순위도 자동 패스 세팅
      if (dessertObj.categoryId === "none") {
        state.selectedDessert2 = {
          categoryId: "none",
          categoryName: "선택안함",
          itemId: "none_auto",
          name: "해당없음 (1순위 선택안함)",
          baeminLabel: "선택안함",
          price: 0,
          display: "해당없음 (1순위 패스)"
        };
        sfx.playEquip();
        updateHudAndDock();
        renderDessertStack(1);
        showToast("🚫 디저트 1순위 '선택안함' 설정! 하단 [다음: 최종 확인 ▶]을 눌러주세요.");
        return;
      }

      // 기존에 자동패스였던 2순위가 있거나, 새로 고른 1순위가 기존 2순위와 겹치면 2순위 초기화
      if (
        (state.selectedDessert2 && state.selectedDessert2.itemId === "none_auto") ||
        isSameDessertChoice(dessertObj, state.selectedDessert2)
      ) {
        state.selectedDessert2 = null;
      }

      sfx.playEquip();
      updateHudAndDock();
      renderDessertStack(1);
      setNpcDialog(
        `🥇 1순위 [${dessertObj.display}] 장착! 이제 하단 [다음: 디저트 2순위 ▶] 버튼을 눌러 품절 대비 2순위를 골라주세요!`
      );
      showToast(`🥇 1순위: ${dessertObj.display} 선택 완료!`);
    } else {
      // 2순위 검증: 1순위와 동일 메뉴 차단!
      if (isSameDessertChoice(state.selectedDessert1, dessertObj)) {
        sfx.playError();
        showToast("⚠️ 1순위와 동일한 메뉴는 2순위로 선택할 수 없어요! 다른 메뉴를 골라주세요.");
        return;
      }

      state.selectedDessert2 = dessertObj;
      sfx.playEquip();
      updateHudAndDock();
      renderDessertStack(2);
      setNpcDialog(
        `🥈 2순위 [${dessertObj.display}] 장착 완료! 하단 [다음: 최종 확인 ▶] 버튼을 눌러 주문을 마무리해 주세요!`
      );
      showToast(`🥈 2순위: ${dessertObj.display} 선택 완료!`);
    }
  }

  function renderDessertStack(rank) {
    const isRank2 = rank === 2;
    const stackId = isRank2 ? "dessert2ChestStack" : "dessert1ChestStack";
    const stack = document.getElementById(stackId);
    if (!stack) return;

    if (isRank2) {
      const p1Box = document.getElementById("priority1SummaryBox");
      if (p1Box) {
        if (state.selectedDessert1 && state.selectedDessert1.categoryId === "none") {
          p1Box.innerHTML = `
            🥇 현재 1순위: <strong>선택안함</strong><br/>
            1순위를 '선택안함'으로 고르셨으므로 2순위도 패스됩니다. 하단 <strong>[다음: 최종 확인 ▶]</strong>을 눌러주세요!
          `;
        } else {
          p1Box.innerHTML = `
            🥇 나의 1순위 디저트: <strong>${escapeHtml(
              state.selectedDessert1 ? state.selectedDessert1.display : "미선택"
            )}</strong><br/>
            <span style="color:var(--text-sub);">※ 위 1순위 메뉴는 아래 목록에서 <strong>🔒 잠금 처리</strong>됩니다. 품절 시 대신 받을 <strong>다른 메뉴</strong>를 골라주세요!</span>
          `;
        }
      }
    }

    const expandedCat = isRank2 ? state.expandedDessert2Category : state.expandedDessert1Category;
    const equippedObj = isRank2 ? state.selectedDessert2 : state.selectedDessert1;
    const customInputVal = isRank2 ? state.customDessert2Input : state.customDessert1Input;

    stack.innerHTML = MENU.desserts
      .map((cat) => {
        const isExpanded = expandedCat === cat.id;
        const isEquippedCat = equippedObj && equippedObj.categoryId === cat.id;
        const countLabel =
          cat.type === "list"
            ? `${cat.items.length}종 열기`
            : cat.type === "custom"
            ? "직접 입력"
            : isRank2
            ? "품절시 패스"
            : "디저트 패스";

        let bodyHtml = "";
        if (cat.type === "list") {
          bodyHtml = `
            <div style="font-size:0.78rem; color:var(--accent-gold); margin-bottom:8px;">
              ▼ <strong>${escapeHtml(cat.fullTitle)}</strong> 중 ${isRank2 ? "2순위(대체 메뉴)" : "1순위"} 선택
            </div>
            <div class="dessert-detail-grid">
              ${cat.items
                .map((item) => {
                  const lockedByRank1 =
                    isRank2 &&
                    state.selectedDessert1 &&
                    (state.selectedDessert1.itemId === item.id ||
                      normalizeMenuKey(state.selectedDessert1.name) === normalizeMenuKey(item.name));

                  const isItemActive =
                    !lockedByRank1 &&
                    isEquippedCat &&
                    (equippedObj.itemId === item.id || equippedObj.name === item.name);

                  const badgeClass =
                    item.badge === "NEW"
                      ? "badge-new"
                      : item.badge === "품절주의"
                      ? "badge-warn"
                      : "";

                  return `
                    <button
                      type="button"
                      class="dessert-item-btn ${isItemActive ? "active" : ""} ${
                    lockedByRank1 ? "locked-by-first" : ""
                  }"
                      data-rank="${rank}"
                      data-dessert-cat="${escapeHtml(cat.id)}"
                      data-dessert-item="${escapeHtml(item.id)}"
                      ${lockedByRank1 ? "disabled" : ""}
                    >
                      <div class="dessert-item-top">
                        <span class="dessert-item-name">
                          ${lockedByRank1 ? "🔒 " : isItemActive ? "✅ " : "▸ "}${escapeHtml(item.name)}
                        </span>
                        ${
                          lockedByRank1
                            ? `<span class="pixel-badge badge-warn">1순위 선택됨</span>`
                            : item.badge
                            ? `<span class="pixel-badge ${badgeClass}">${escapeHtml(item.badge)}</span>`
                            : ""
                        }
                      </div>
                      <div class="dessert-item-meta">
                        <span>${escapeHtml(
                          lockedByRank1 ? "1순위와 다른 메뉴를 선택해 주세요" : item.optionNote || ""
                        )}</span>
                        <span class="dessert-item-price">${formatWon(item.price)}</span>
                      </div>
                    </button>
                  `;
                })
                .join("")}
            </div>
          `;
        } else if (cat.type === "custom") {
          const shownText = isEquippedCat && equippedObj ? equippedObj.name : customInputVal;
          const fieldId = `customDessertField_${rank}`;
          const applyBtnId = `btnApplyCustomDessert_${rank}`;

          bodyHtml = `
            <div style="font-size:0.8rem; color:var(--accent-gold); margin-bottom:8px;">
              ✏️ 배민 앱(<a href="${escapeHtml(
                BAEMIN_URL
              )}" target="_blank" rel="noopener noreferrer" style="color:var(--baemin-mint);">매장 메뉴 보기</a>)에 있는 다른 디저트를 직접 입력해 주세요!
              ${isRank2 ? "<br/><span style='color:var(--accent-pink);'>※ 1순위와 다른 메뉴로 입력해 주세요.</span>" : ""}
            </div>
            <input
              type="text"
              id="${fieldId}"
              class="pixel-input"
              maxlength="40"
              placeholder="예: 두바이쫀득쿠키, 밀키롤, 초코롤, 컵화채 등"
              value="${escapeHtml(shownText)}"
            />
            <div style="font-size:0.73rem; color:var(--text-muted); margin-top:8px;">
              💡 빠른 자동입력 추천 태그 (터치 시 입력칸에 채워집니다):
            </div>
            <div class="suggestion-chips">
              ${(cat.suggestions || [])
                .map((sug) => {
                  const sameAs1 =
                    isRank2 &&
                    state.selectedDessert1 &&
                    normalizeMenuKey(state.selectedDessert1.name) === normalizeMenuKey(sug);
                  if (sameAs1) return "";
                  return `<button type="button" class="chip-btn" data-rank="${rank}" data-dessert-chip="${escapeHtml(
                    sug
                  )}">+ ${escapeHtml(sug)}</button>`;
                })
                .join("")}
            </div>
            <button type="button" id="${applyBtnId}" class="pixel-btn pixel-btn-mint" style="width:100%;">
              ✨ ${rank}순위 디저트로 장착하기
            </button>
          `;
        } else if (cat.type === "none") {
          const confirmId = `btnConfirmNoDessert_${rank}`;
          const descMsg = isRank2
            ? "1순위 디저트가 품절일 경우, 다른 디저트를 시키지 않고 패스합니다."
            : "디저트는 주문하지 않고 음료만 마실게요!";
          bodyHtml = `
            <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px;">
              <p style="font-size:0.82rem; color:var(--text-sub);">${descMsg}</p>
              <button type="button" id="${confirmId}" class="pixel-btn ${
            isEquippedCat ? "pixel-btn-mint" : "pixel-btn-gold"
          }" style="width:100%;">
                ${isEquippedCat ? "✅ 선택안함 적용됨" : isRank2 ? "🚫 1순위 품절 시 디저트 생략" : "🚫 디저트 선택안함 확정"}
              </button>
            </div>
          `;
        }

        return `
          <div class="dessert-chest ${isExpanded ? "expanded" : ""} ${isEquippedCat ? "equipped" : ""}">
            <button type="button" class="chest-header" data-rank="${rank}" data-toggle-chest="${escapeHtml(cat.id)}">
              <div class="chest-left">
                <div class="chest-icon">${cat.icon}</div>
                <div>
                  <div class="chest-title">
                    ${escapeHtml(cat.name)}
                    ${
                      isEquippedCat
                        ? `<span style="font-size:0.73rem; color:var(--accent-green); margin-left:4px;">[선택됨]</span>`
                        : ""
                    }
                  </div>
                  <div class="chest-sub">${escapeHtml(
                    cat.id === "none" && isRank2 ? "1순위 품절 시 디저트 안 먹음" : cat.subtitle
                  )}</div>
                </div>
              </div>
              <div class="chest-right">
                <span class="chest-stat">${escapeHtml(cat.statTag)}</span>
                <span class="chest-arrow">${countLabel} ${isExpanded ? "▲" : "▼"}</span>
              </div>
            </button>
            <div class="chest-body">
              ${bodyHtml}
            </div>
          </div>
        `;
      })
      .join("");

    // 아코디언 토글 바인딩
    stack.querySelectorAll("[data-toggle-chest]").forEach((hdr) => {
      hdr.addEventListener("click", () => {
        const cid = hdr.getAttribute("data-toggle-chest");
        sfx.playTab();

        if (cid === "none") {
          if (isRank2) state.expandedDessert2Category = "none";
          else state.expandedDessert1Category = "none";

          equipDessertByRank(rank, {
            categoryId: "none",
            categoryName: "선택안함",
            itemId: "none",
            name: isRank2 ? "선택안함 (품절시 생략)" : "선택안함",
            baeminLabel: "선택안함",
            price: 0,
            display: isRank2 ? "선택안함 (품절시 생략)" : "선택안함"
          });
          return;
        }

        if (isRank2) {
          state.expandedDessert2Category = state.expandedDessert2Category === cid ? "" : cid;
        } else {
          state.expandedDessert1Category = state.expandedDessert1Category === cid ? "" : cid;
        }
        renderDessertStack(rank);
      });
    });

    // 상세 메뉴 클릭 바인딩
    stack.querySelectorAll("[data-dessert-item]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cid = btn.getAttribute("data-dessert-cat");
        const iid = btn.getAttribute("data-dessert-item");
        const cat = MENU.desserts.find((c) => c.id === cid);
        const item = cat && cat.items ? cat.items.find((i) => i.id === iid) : null;
        if (!cat || !item) return;

        equipDessertByRank(rank, {
          categoryId: cat.id,
          categoryName: cat.name,
          itemId: item.id,
          name: item.name,
          baeminLabel: item.baeminLabel || `${cat.name} - ${item.name}`,
          price: item.price || 0,
          display: `${cat.name} > ${item.name}`
        });
      });
    });

    // 주관식 입력 바인딩
    const customField = document.getElementById(`customDessertField_${rank}`);
    if (customField) {
      customField.addEventListener("input", () => {
        if (isRank2) state.customDessert2Input = customField.value;
        else state.customDessert1Input = customField.value;
      });
      customField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const btn = document.getElementById(`btnApplyCustomDessert_${rank}`);
          if (btn) btn.click();
        }
      });
    }

    stack.querySelectorAll("[data-dessert-chip]").forEach((chip) => {
      chip.addEventListener("click", () => {
        sfx.playClick();
        const text = chip.getAttribute("data-dessert-chip");
        if (isRank2) state.customDessert2Input = text;
        else state.customDessert1Input = text;
        if (customField) {
          customField.value = text;
          customField.focus();
        }
      });
    });

    const btnApplyCustom = document.getElementById(`btnApplyCustomDessert_${rank}`);
    if (btnApplyCustom) {
      btnApplyCustom.addEventListener("click", () => {
        const val = (customField ? customField.value : "").trim();
        if (!val) {
          sfx.playError();
          showToast("✏️ 디저트 메뉴 이름을 입력해 주세요!");
          if (customField) customField.focus();
          return;
        }
        if (isRank2) state.customDessert2Input = val;
        else state.customDessert1Input = val;

        equipDessertByRank(rank, {
          categoryId: "custom",
          categoryName: "주관식 칸",
          itemId: "custom_" + normalizeMenuKey(val),
          name: val,
          baeminLabel: `[주관식] ${val}`,
          price: 0,
          display: `주관식 > ${val}`
        });
      });
    }

    const btnConfirmNone = document.getElementById(`btnConfirmNoDessert_${rank}`);
    if (btnConfirmNone) {
      btnConfirmNone.addEventListener("click", () => {
        equipDessertByRank(rank, {
          categoryId: "none",
          categoryName: "선택안함",
          itemId: "none",
          name: isRank2 ? "선택안함 (품절시 생략)" : "선택안함",
          baeminLabel: "선택안함",
          price: 0,
          display: isRank2 ? "선택안함 (품절시 생략)" : "선택안함"
        });
      });
    }
  }

  // ==================== 도트 가챠 추천 (2순위 가챠 시 1순위 자동 제외!) ====================
  function openGachaModal(mode) {
    state.gachaMode = mode;
    const modal = document.getElementById("gachaModal");
    if (!modal) return;
    modal.classList.add("open");
    spinGacha();
  }

  function spinGacha() {
    const iconEl = document.getElementById("gachaResultIcon");
    const titleEl = document.getElementById("gachaResultTitle");
    const metaEl = document.getElementById("gachaResultMeta");
    const applyBtn = document.getElementById("btnApplyGacha");
    if (!titleEl) return;

    applyBtn.disabled = true;
    const pool = [];

    if (state.gachaMode === "drink") {
      MENU.drinks.forEach((cat) => {
        cat.items.forEach((item) => {
          item.temps.forEach((temp) => {
            const disp = formatDrinkDisplay(item.name, temp);
            pool.push({
              icon: cat.icon,
              title: disp,
              meta: `${cat.name} · ${formatWon(item.price)}`,
              payload: {
                id: item.id,
                categoryId: cat.id,
                categoryName: cat.name,
                name: item.name,
                temp: temp,
                price: item.price || 0,
                display: disp
              }
            });
          });
        });
      });
    } else {
      const isRank2 = state.gachaMode === "dessert2";
      MENU.desserts.forEach((cat) => {
        if (cat.type !== "list") return;
        cat.items.forEach((item) => {
          if (item.badge === "품절주의") return;
          const candidate = {
            categoryId: cat.id,
            categoryName: cat.name,
            itemId: item.id,
            name: item.name,
            baeminLabel: item.baeminLabel,
            price: item.price || 0,
            display: `${cat.name} > ${item.name}`
          };
          if (isRank2 && isSameDessertChoice(state.selectedDessert1, candidate)) {
            return; // 1순위 메뉴는 2순위 가챠에서 자동 제외!
          }
          pool.push({
            icon: cat.icon,
            title: candidate.display,
            meta: `${cat.fullTitle} · ${formatWon(item.price)}`,
            payload: candidate
          });
        });
      });
    }

    if (pool.length === 0) return;

    let ticks = 0;
    const maxTicks = 12;
    const timer = setInterval(() => {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      sfx.playGachaTick(ticks);
      iconEl.textContent = pick.icon;
      titleEl.textContent = pick.title;
      metaEl.textContent = pick.meta;
      ticks++;

      if (ticks >= maxTicks) {
        clearInterval(timer);
        state.gachaCandidate = pick.payload;
        applyBtn.disabled = false;
        sfx.playGachaWin();
      }
    }, 60);
  }

  // ==================== STEP 4: 최종 주문서 & 등록 ====================
  function getEstimatedTotal() {
    const dp = state.selectedDrink ? Number(state.selectedDrink.price || 0) : 0;
    const dsp1 = state.selectedDessert1 ? Number(state.selectedDessert1.price || 0) : 0;
    return dp + dsp1;
  }

  function renderFinalReceipt() {
    const card = document.getElementById("finalReceiptCard");
    if (!card) return;
    const est = getEstimatedTotal();

    card.innerHTML = `
      <div class="receipt-header">
        <div class="receipt-title">🧾 [디저트테이블냠냠&amp;과일 마곡점] 주문서</div>
        <div style="font-size:0.74rem; color:#6d5b87; margin-top:2px;">1 DRINK + DESSERT (1ST &amp; 2ND CHOICE)</div>
      </div>
      <div class="receipt-row">
        <span class="r-label">👤 주문자</span>
        <span class="r-val">${escapeHtml(state.heroName)}</span>
      </div>
      <div class="receipt-row">
        <span class="r-label">🥤 음료 (1개)</span>
        <span class="r-val">${escapeHtml(state.selectedDrink ? state.selectedDrink.display : "미선택")}</span>
      </div>
      <div class="receipt-row">
        <span class="r-label">🥇 디저트 1순위</span>
        <span class="r-val">${escapeHtml(state.selectedDessert1 ? state.selectedDessert1.display : "미선택")}</span>
      </div>
      <div class="receipt-row">
        <span class="r-label">🥈 디저트 2순위<br/><small style="font-weight:normal;">(1순위 품절시)</small></span>
        <span class="r-val" style="color:#3c5a99;">${escapeHtml(
          state.selectedDessert2 ? state.selectedDessert2.display : "미선택"
        )}</span>
      </div>
      <div class="receipt-row" style="border-bottom:none; padding-top:10px;">
        <span class="r-label">💰 예상금액 (1순위 기준)</span>
        <span class="r-val" style="color:#b82955;">
          ${est > 0 ? formatWon(est) : "직접입력 포함"}
        </span>
      </div>
    `;
  }

  function buildOrderPayload() {
    const memoEl = document.getElementById("orderMemoInput");
    state.memo = memoEl ? memoEl.value.trim() : "";

    return {
      action: "upsert",
      name: state.heroName,
      drinkCategory: state.selectedDrink ? state.selectedDrink.categoryName : "",
      drinkName: state.selectedDrink ? state.selectedDrink.name : "",
      drinkTemp: state.selectedDrink ? state.selectedDrink.temp : "",
      drinkDisplay: state.selectedDrink ? state.selectedDrink.display : "",
      dessert1Display: state.selectedDessert1 ? state.selectedDessert1.display : "선택안함",
      dessert2Display: state.selectedDessert2 ? state.selectedDessert2.display : "선택안함",
      baeminDessert1Label: state.selectedDessert1 ? state.selectedDessert1.baeminLabel : "선택안함",
      baeminDessert2Label: state.selectedDessert2 ? state.selectedDessert2.baeminLabel : "선택안함",
      memo: state.memo,
      estimatedPrice: getEstimatedTotal(),
      timestamp: new Date().toLocaleString("ko-KR", { hour12: false })
    };
  }

  async function submitOrder() {
    if (state.isSubmitting) return;
    if (!state.selectedDrink || !state.selectedDessert1 || !state.selectedDessert2) {
      goToStage(4);
      return;
    }
    if (isSameDessertChoice(state.selectedDessert1, state.selectedDessert2)) {
      sfx.playError();
      showToast("⚠️ 1순위와 2순위 디저트는 서로 다른 메뉴여야 합니다!");
      goToStage(3);
      return;
    }

    const payload = buildOrderPayload();
    const btn = document.getElementById("btnSubmitOrder");
    state.isSubmitting = true;
    updateHudAndDock();
    if (btn) {
      btn.disabled = true;
      btn.textContent = "⏳ 주문서 전송 중...";
    }

    try {
      if (state.sheetUrl) {
        const res = await fetch(state.sheetUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data || !data.ok) {
          throw new Error((data && data.error) || "시트 저장 오류");
        }
        state.isOnlineSync = true;
        state.orders = Array.isArray(data.orders) ? data.orders : state.orders;
        saveLocalOrders(state.orders);
      } else {
        const local = loadLocalOrders();
        const idx = local.findIndex((o) => o.name === payload.name);
        if (idx >= 0) local[idx] = payload;
        else local.push(payload);
        state.orders = local;
        saveLocalOrders(local);
      }

      sfx.playFanfare();
      scene.setState({ celebrating: true });
      setTimeout(() => scene.setState({ celebrating: false }), 2800);

      renderPartyBoard();
      setNpcDialog(
        `🎉 주문 완료! [${payload.name}]님의 음료와 디저트(1·2순위)가 현황판에 등록되었습니다!`
      );
      showToast(`🎉 [${payload.name}]님의 메뉴 선택이 등록되었습니다!`);

      const board = document.getElementById("partyBoardSection");
      if (board) board.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (_) {
      const local = loadLocalOrders();
      const idx = local.findIndex((o) => o.name === payload.name);
      if (idx >= 0) local[idx] = payload;
      else local.push(payload);
      state.orders = local;
      saveLocalOrders(local);
      renderPartyBoard();

      sfx.playError();
      showToast("⚠️ 시트 전송 지연! 로컬에 저장되었으며 [내 주문 카톡 복사]로도 전달 가능합니다.");
    } finally {
      state.isSubmitting = false;
      updateHudAndDock();
      if (btn) {
        btn.disabled = false;
        btn.textContent = "🚀 주문 등록 완료하기! (실시간 현황판 전송)";
      }
    }
  }

  async function deleteOrderByName(targetName) {
    if (!confirm(`[${targetName}]님의 주문을 현황판에서 삭제할까요?\n(구글 시트에는 [삭제됨] 기록으로 남아 보존됩니다)`)) return;

    const existingOrder =
      getActiveOrders().find((o) => o.name === targetName) ||
      (state.orders || []).find((o) => o.name === targetName) ||
      { name: targetName };
    const cleanMemo = String(existingOrder.memo || "").replace(/^\[삭제됨[^\]]*\]\s*/, "").trim();
    const softDeleteMemo = cleanMemo ? `[삭제됨] ${cleanMemo}` : "[삭제됨]";
    const softDeletePayload = {
      action: "soft_delete",
      name: targetName,
      drinkCategory: existingOrder.drinkCategory || "",
      drinkName: existingOrder.drinkName || "",
      drinkTemp: existingOrder.drinkTemp || "",
      drinkDisplay: existingOrder.drinkDisplay || "",
      dessert1Display: existingOrder.dessert1Display || existingOrder.dessertDisplay || "선택안함",
      dessert2Display: existingOrder.dessert2Display || "선택안함",
      baeminDessert1Label: existingOrder.baeminDessert1Label || existingOrder.dessert1Display || "선택안함",
      baeminDessert2Label: existingOrder.baeminDessert2Label || existingOrder.dessert2Display || "선택안함",
      memo: softDeleteMemo,
      estimatedPrice: Number(existingOrder.estimatedPrice || 0)
    };

    if (state.sheetUrl) {
      try {
        const res = await fetch(state.sheetUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(softDeletePayload)
        });
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.orders)) {
          state.orders = data.orders;
          saveLocalOrders(state.orders);
          renderPartyBoard();
          showToast(`🗑️ [${targetName}]님의 주문을 현황판에서 삭제했습니다. (시트에는 [삭제됨]으로 기록 유지)`);
          return;
        }
      } catch (_) {
        showToast("⚠️ 시트 삭제 처리 중 오류가 발생했습니다.");
        return;
      }
    }

    const updatedLocal = loadLocalOrders().map((o) =>
      o.name === targetName ? Object.assign({}, o, { memo: softDeleteMemo, deleted: true }) : o
    );
    state.orders = updatedLocal;
    saveLocalOrders(updatedLocal);
    renderPartyBoard();
    showToast(`🗑️ [${targetName}]님의 주문을 현황판에서 삭제했습니다. (시트에는 [삭제됨]으로 기록 유지)`);
  }

  // ==================== 실시간 현황판 (모바일 친화 카드 리스트) ====================
  function renderPartyBoard() {
    const orders = getActiveOrders();
    const hudCount = document.getElementById("hudOrderCount");
    const totalCount = document.getElementById("totalCountLabel");
    const totalPriceEl = document.getElementById("totalPriceLabel");
    const drinkUl = document.getElementById("drinkSummaryList");
    const dessertUl = document.getElementById("dessertSummaryList");
    const listWrap = document.getElementById("memberOrderList");

    if (hudCount) hudCount.textContent = String(orders.length);
    if (totalCount) totalCount.textContent = `${orders.length}명`;

    let sumPrice = 0;
    const drinkMap = {};
    const dessert1Map = {};

    orders.forEach((o) => {
      sumPrice += Number(o.estimatedPrice || 0);
      const dLabel = o.drinkDisplay || "미선택";
      drinkMap[dLabel] = (drinkMap[dLabel] || 0) + 1;

      const ds1Label = o.baeminDessert1Label || o.dessert1Display || o.dessertDisplay || "선택안함";
      dessert1Map[ds1Label] = (dessert1Map[ds1Label] || 0) + 1;
    });

    if (totalPriceEl) totalPriceEl.textContent = formatWon(sumPrice);

    const drinkEntries = Object.entries(drinkMap).sort((a, b) => b[1] - a[1]);
    if (drinkUl) {
      drinkUl.innerHTML =
        drinkEntries.length === 0
          ? `<li style="color:var(--text-muted);">아직 등록된 주문이 없습니다.</li>`
          : drinkEntries
              .map(
                ([k, cnt]) => `
                  <li>
                    <span>${escapeHtml(k)}</span>
                    <span class="summary-count">× ${cnt}</span>
                  </li>
                `
              )
              .join("");
    }

    const dessertEntries = Object.entries(dessert1Map).sort((a, b) => b[1] - a[1]);
    if (dessertUl) {
      dessertUl.innerHTML =
        dessertEntries.length === 0
          ? `<li style="color:var(--text-muted);">아직 등록된 주문이 없습니다.</li>`
          : dessertEntries
              .map(
                ([k, cnt]) => `
                  <li>
                    <span>${escapeHtml(k)}</span>
                    <span class="summary-count">× ${cnt}</span>
                  </li>
                `
              )
              .join("");
    }

    if (listWrap) {
      if (orders.length === 0) {
        listWrap.innerHTML = `
          <div class="member-card" style="text-align:center; color:var(--text-muted); padding:18px;">
            첫 번째 주문 용사가 되어 보세요! ✨
          </div>
        `;
      } else {
        listWrap.innerHTML = orders
          .map((o) => {
            const isIce = (o.drinkTemp || "") === "ICE" || String(o.drinkDisplay || "").startsWith("[ICE]");
            const isHot = (o.drinkTemp || "") === "HOT" || String(o.drinkDisplay || "").startsWith("[HOT]");
            const cleanDrink = String(o.drinkDisplay || "").replace(/^\[(ICE|HOT)\]\s*/, "");
            const tempBadge = isIce
              ? `<span class="temp-tag ice">ICE</span>`
              : isHot
              ? `<span class="temp-tag hot">HOT</span>`
              : "";
            const d1 = o.dessert1Display || o.dessertDisplay || "선택안함";
            const d2 = o.dessert2Display || "선택안함";

            return `
              <div class="member-card">
                <div class="member-card-head">
                  <span class="member-name">👤 ${escapeHtml(o.name)}</span>
                  <div style="display:flex; gap:5px;">
                    <button
                      type="button"
                      class="pixel-btn pixel-btn-sm"
                      style="min-height:30px; padding:3px 8px; font-size:0.72rem;"
                      data-edit-person="${escapeHtml(o.name)}"
                    >수정</button>
                    <button
                      type="button"
                      class="pixel-btn pixel-btn-sm"
                      style="min-height:30px; padding:3px 8px; font-size:0.72rem;"
                      data-del-person="${escapeHtml(o.name)}"
                    >✕</button>
                  </div>
                </div>
                <div class="member-picks">
                  <div>🥤 <strong>음료:</strong> ${tempBadge}${escapeHtml(cleanDrink)}</div>
                  <div>🥇 <strong>1순위:</strong> ${escapeHtml(d1)}</div>
                  <div style="color:var(--text-sub);">🥈 <strong>2순위(품절시):</strong> ${escapeHtml(d2)}</div>
                  ${
                    o.memo
                      ? `<div style="color:var(--accent-gold); font-size:0.76rem;">💬 메모: ${escapeHtml(o.memo)}</div>`
                      : ""
                  }
                </div>
              </div>
            `;
          })
          .join("");

        listWrap.querySelectorAll("[data-edit-person]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const targetName = btn.getAttribute("data-edit-person");
            sfx.playClick();
            state.heroName = targetName;
            state.nameConfirmed = true;
            document.getElementById("nameEntryModal").classList.remove("open");
            document.body.classList.remove("modal-locked");
            tryRestoreExistingOrder(targetName);
            goToStage(1);
          });
        });

        listWrap.querySelectorAll("[data-del-person]").forEach((btn) => {
          btn.addEventListener("click", () => {
            deleteOrderByName(btn.getAttribute("data-del-person"));
          });
        });
      }
    }
  }

  // ==================== 복사 기능 ====================
  async function copyText(text, successMsg) {
    try {
      await navigator.clipboard.writeText(text);
      sfx.playEquip();
      showToast(successMsg);
    } catch (_) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      sfx.playEquip();
      showToast(successMsg);
    }
  }

  function copyMyOrderText() {
    const p = buildOrderPayload();
    const lines = [
      `🍓 [냠냠 메뉴선택] ${p.name}`,
      `• 음료: ${p.drinkDisplay}`,
      `• 디저트 1순위: ${p.dessert1Display}`,
      `• 디저트 2순위(품절시): ${p.dessert2Display}`
    ];
    if (p.memo) lines.push(`• 요청메모: ${p.memo}`);
    copyText(lines.join("\n"), "📋 내 주문 내역이 복사되었어요! 카톡/슬랙에 붙여넣기 하세요.");
  }

  function copyBaeminSummaryText() {
    const orders = getActiveOrders();
    if (orders.length === 0) {
      sfx.playError();
      showToast("⚠️ 아직 등록된 주문이 없습니다!");
      return;
    }

    const drinkMap = {};
    const dessert1Map = {};
    let totalPrice = 0;

    orders.forEach((o) => {
      totalPrice += Number(o.estimatedPrice || 0);
      const d = o.drinkDisplay || "";
      if (d) drinkMap[d] = (drinkMap[d] || 0) + 1;

      const ds1 = o.baeminDessert1Label || o.dessert1Display || o.dessertDisplay || "선택안함";
      if (ds1 !== "선택안함") dessert1Map[ds1] = (dessert1Map[ds1] || 0) + 1;
    });

    const lines = [
      `🍓 [디저트테이블냠냠&과일 마곡점] 주문 합산표 (총 ${orders.length}명)`,
      `🛵 배민 링크: ${BAEMIN_URL}`,
      `────────────────────`,
      `🥤 [음료 장바구니 합계]`
    ];

    const dEntries = Object.entries(drinkMap).sort((a, b) => b[1] - a[1]);
    dEntries.forEach(([k, v]) => lines.push(`• ${k} × ${v}`));

    lines.push(``, `🥇 [디저트 1순위 장바구니 합계]`);
    const ds1Entries = Object.entries(dessert1Map).sort((a, b) => b[1] - a[1]);
    if (ds1Entries.length === 0) lines.push(`• 디저트 주문 없음`);
    else ds1Entries.forEach(([k, v]) => lines.push(`• ${k} × ${v}`));

    lines.push(``, `🥈 [1순위 품절 시 개인별 2순위 대체표]`);
    orders.forEach((o) => {
      const d1 = o.dessert1Display || o.dessertDisplay || "선택안함";
      const d2 = o.dessert2Display || "선택안함";
      const memoPart = o.memo ? ` | 메모: ${o.memo}` : "";
      lines.push(`• ${o.name}: [음료] ${o.drinkDisplay} / [1순위] ${d1} ➔ (품절시 2순위: ${d2})${memoPart}`);
    });

    if (totalPrice > 0) {
      lines.push(``, `💰 예상 합계(1순위 기준): ${formatWon(totalPrice)}`);
    }

    copyText(lines.join("\n"), "📋 배민 장바구니 합산표(1·2순위 포함)가 복사되었습니다!");
  }

  // ==================== 이벤트 바인딩 ====================
  function bindEvents() {
    // 1. 필수 이름 입력 팝업 이벤트
    const popupInput = document.getElementById("popupNameInput");
    popupInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmPopupName();
      }
    });
    document.getElementById("btnConfirmPopupName").addEventListener("click", confirmPopupName);

    // 인벤토리 이름 슬롯 클릭 시 이름 변경 팝업 재오픈
    document.getElementById("slotHero").addEventListener("click", () => {
      sfx.playClick();
      openNameEntryPopup();
    });

    // 상단 HUD
    document.getElementById("btnToggleSfx").addEventListener("click", (e) => {
      const on = sfx.toggle();
      e.currentTarget.textContent = on ? "🔊 효과음 ON" : "🔇 효과음 OFF";
    });

    document.getElementById("btnJumpBoard").addEventListener("click", () => {
      sfx.playClick();
      const board = document.getElementById("partyBoardSection");
      if (board) board.scrollIntoView({ behavior: "smooth" });
    });

    // 스텝 필 & 인벤토리 슬롯 이동
    for (let s = 1; s <= 4; s++) {
      const pill = document.getElementById(`stepPill${s}`);
      if (pill) {
        pill.addEventListener("click", () => {
          sfx.playClick();
          goToStage(s);
        });
      }
    }

    document.querySelectorAll("[data-goto]").forEach((slot) => {
      slot.addEventListener("click", () => {
        sfx.playClick();
        goToStage(Number(slot.getAttribute("data-goto")));
      });
    });

    // 하단 모바일 고정 액션 바 (이전 / 다음)
    document.getElementById("btnDockPrev").addEventListener("click", () => {
      sfx.playClick();
      if (state.stage === 1) {
        openNameEntryPopup();
      } else if (state.stage === 2) {
        goToStage(1);
      } else if (state.stage === 3) {
        goToStage(2);
      } else if (state.stage === 4) {
        if (state.selectedDessert1 && state.selectedDessert1.categoryId === "none") {
          goToStage(2);
        } else {
          goToStage(3);
        }
      }
    });

    document.getElementById("btnDockNext").addEventListener("click", () => {
      if (state.stage === 1) {
        if (!state.selectedDrink) {
          sfx.playError();
          showToast("🥤 마실 음료 1개(ICE 또는 HOT)를 선택해 주세요!");
          return;
        }
        sfx.playClick();
        goToStage(2);
      } else if (state.stage === 2) {
        if (!state.selectedDessert1) {
          sfx.playError();
          showToast("🥇 디저트 1순위(또는 선택안함)를 먼저 골라주세요!");
          return;
        }
        sfx.playClick();
        if (state.selectedDessert1.categoryId === "none") {
          goToStage(4);
        } else {
          goToStage(3);
        }
      } else if (state.stage === 3) {
        if (!state.selectedDessert2) {
          sfx.playError();
          showToast("🥈 품절 대비용 디저트 2순위를 골라주세요!");
          return;
        }
        if (isSameDessertChoice(state.selectedDessert1, state.selectedDessert2)) {
          sfx.playError();
          showToast("⚠️ 2순위는 1순위와 다른 메뉴여야 합니다!");
          return;
        }
        sfx.playClick();
        goToStage(4);
      } else if (state.stage === 4) {
        submitOrder();
      }
    });

    // 음료 검색
    const drinkSearch = document.getElementById("drinkSearchInput");
    drinkSearch.addEventListener("input", () => {
      state.drinkSearchQuery = drinkSearch.value;
      renderDrinkCategoryTabs();
      renderDrinkList();
    });

    // 주문 등록 & 복사
    document.getElementById("btnSubmitOrder").addEventListener("click", submitOrder);
    document.getElementById("btnCopyMyOrder").addEventListener("click", copyMyOrderText);
    document.getElementById("btnRefreshBoard").addEventListener("click", () => {
      sfx.playClick();
      fetchOrders(false);
    });
    document.getElementById("btnCopyBaeminSummary").addEventListener("click", copyBaeminSummaryText);

    // 가챠 모달
    document.getElementById("btnDrinkGacha").addEventListener("click", () => openGachaModal("drink"));
    document.getElementById("btnDessert1Gacha").addEventListener("click", () => openGachaModal("dessert1"));
    document.getElementById("btnDessert2Gacha").addEventListener("click", () => openGachaModal("dessert2"));
    document.getElementById("btnRerollGacha").addEventListener("click", spinGacha);
    document.getElementById("btnCloseGacha").addEventListener("click", () => {
      sfx.playClick();
      document.getElementById("gachaModal").classList.remove("open");
    });
    document.getElementById("btnApplyGacha").addEventListener("click", () => {
      if (!state.gachaCandidate) return;
      if (state.gachaMode === "drink") {
        state.activeDrinkCategory = state.gachaCandidate.categoryId;
        state.drinkSearchQuery = "";
        document.getElementById("drinkSearchInput").value = "";
        renderDrinkCategoryTabs();
        equipDrink(state.gachaCandidate);
      } else if (state.gachaMode === "dessert1") {
        state.expandedDessert1Category = state.gachaCandidate.categoryId;
        equipDessertByRank(1, state.gachaCandidate);
      } else if (state.gachaMode === "dessert2") {
        state.expandedDessert2Category = state.gachaCandidate.categoryId;
        equipDessertByRank(2, state.gachaCandidate);
      }
      document.getElementById("gachaModal").classList.remove("open");
    });

    // 시트 연동 설정 모달
    const sheetModal = document.getElementById("sheetSetupModal");
    const sheetInput = document.getElementById("sheetUrlInput");

    document.getElementById("btnOpenSheetModal").addEventListener("click", () => {
      sfx.playClick();
      sheetInput.value = state.sheetUrl || "";
      sheetModal.classList.add("open");
    });
    document.getElementById("btnCloseSheetModal").addEventListener("click", () => {
      sfx.playClick();
      sheetModal.classList.remove("open");
    });
    document.getElementById("btnSaveSheetUrl").addEventListener("click", async () => {
      const url = sheetInput.value.trim();
      if (!isValidAppsScriptUrl(url)) {
        sfx.playError();
        showToast("⚠️ 올바른 Google Apps Script 웹 앱(/exec) URL을 입력해 주세요!");
        return;
      }
      state.sheetUrl = url;
      localStorage.setItem(STORAGE_KEYS.SHEET_URL, url);
      await fetchOrders(false);
      sheetModal.classList.remove("open");
    });
    document.getElementById("btnCopyShareLink").addEventListener("click", () => {
      const url = sheetInput.value.trim() || state.sheetUrl;
      if (!isValidAppsScriptUrl(url)) {
        sfx.playError();
        showToast("⚠️ 먼저 유효한 Google Apps Script 웹 앱(/exec) URL을 입력해 주세요!");
        return;
      }
      state.sheetUrl = url;
      localStorage.setItem(STORAGE_KEYS.SHEET_URL, url);

      const shareUrl = new URL(window.location.href);
      shareUrl.searchParams.set("sheet", url);
      copyText(
        shareUrl.toString(),
        "🔗 팀원 공유용 링크 복사 완료! 카톡에 전달하면 모두 같은 시트로 실시간 연동됩니다!"
      );
    });
    document.getElementById("btnClearSheetUrl").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.SHEET_URL);
      state.sheetUrl = CONFIG.GOOGLE_SCRIPT_URL || "";
      sheetInput.value = state.sheetUrl;
      fetchOrders(true);
      showToast("시트 URL 설정을 초기화했습니다.");
    });
    document.getElementById("btnCopyAppsScriptCode").addEventListener("click", () => {
      copyText(APPS_SCRIPT_TEMPLATE, "📜 Google Apps Script 코드(1·2순위 지원)가 복사되었습니다!");
    });

    // 가챠/시트 모달만 바깥 터치 시 닫기 허용 (이름 필수 팝업은 바깥 클릭 닫기 불가!)
    [document.getElementById("gachaModal"), sheetModal].forEach((m) => {
      m.addEventListener("click", (e) => {
        if (e.target === m) m.classList.remove("open");
      });
    });
  }

  function init() {
    initSheetAndLinks();
    bindEvents();
    renderDrinkCategoryTabs();
    renderDrinkList();
    updateHudAndDock();
    fetchOrders(true);

    // 최초 진입 시 이름 입력 필수 팝업 오픈 및 포커스
    openNameEntryPopup();

    const interval = Number(CONFIG.POLL_INTERVAL_MS || 15000);
    if (interval >= 5000) {
      setInterval(() => {
        if (state.sheetUrl && !document.hidden) {
          fetchOrders(true);
        }
      }, interval);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
