/**
 * ============================================================================
 * [디저트테이블냠냠&과일 마곡점] 도트 RPG 메뉴 선정 — Google Apps Script 서버 코드 (v2)
 * - 음료 1개(HOT/ICE) + 디저트 1순위 + 디저트 2순위(품절 대비) 지원
 * ============================================================================
 *
 * [설치 방법 — 3분이면 끝!]
 * 1. 새 Google 스프레드시트(https://sheets.new)를 만듭니다.
 * 2. 상단 메뉴 [확장 프로그램] > [Apps Script]를 클릭합니다.
 * 3. 기존 코드를 모두 지우고 이 파일의 내용을 그대로 붙여넣은 뒤 저장(Ctrl+S)합니다.
 * 4. 우측 상단 [배포] > [새 배포] 클릭:
 *    - 유형 선택(톱니바퀴): [웹 앱]
 *    - 다음 사용자 인증 정보로 실행: [나 (Me)]
 *    - 액세스 권한이 있는 사용자: [모든 사용자 (Anyone)]  <-- ★필수!
 * 5. [배포] 클릭 후 권한 승인을 완료하면 나오는 [웹 앱 URL] (https://script.google.com/macros/s/.../exec)을 복사합니다.
 * 6. 복사한 URL을 config.js의 GOOGLE_SCRIPT_URL에 넣거나,
 *    웹페이지 우측 상단 [⚙️ 시트연동] 버튼에 붙여넣고 공유 링크를 복사해 팀원들에게 전달하세요!
 */

const ORDER_SHEET_NAME = "주문내역";
const SUMMARY_SHEET_NAME = "메뉴별집계";

function getOrInitOrderSheet(ss) {
  let sheet = ss.getSheetByName(ORDER_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ORDER_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    const headers = [
      "이름",
      "음료 최종표기",
      "디저트 1순위",
      "디저트 2순위(품절대비)",
      "음료 분류",
      "음료 메뉴",
      "온도(HOT/ICE)",
      "1순위 배민표기",
      "2순위 배민표기",
      "요청메모",
      "예상금액(1순위기준)",
      "최종선택시각"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#2b213a");
    headerRange.setFontColor("#ffd166");
    headerRange.setFontWeight("bold");
  }
  return sheet;
}

function rebuildSummarySheet(ss, orders) {
  let sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SUMMARY_SHEET_NAME);
  }
  sheet.clear();

  const drinkCounts = {};
  const dessert1Counts = {};
  let totalPrice = 0;

  orders.forEach(function (o) {
    const dKey = o.drinkDisplay || "미선택";
    drinkCounts[dKey] = (drinkCounts[dKey] || 0) + 1;

    const ds1Key = o.baeminDessert1Label || o.dessert1Display || "선택안함";
    dessert1Counts[ds1Key] = (dessert1Counts[ds1Key] || 0) + 1;

    totalPrice += Number(o.estimatedPrice || 0);
  });

  const rows = [];
  rows.push(["[디저트테이블냠냠&과일 마곡점] 실시간 주문 합산표", "", ""]);
  rows.push(["총 참여 인원", orders.length + "명", "예상 총액(1순위 기준): " + totalPrice.toLocaleString() + "원"]);
  rows.push(["배민 매장 링크", "https://s.baemin.com/bK000vefFFRgd", ""]);
  rows.push(["", "", ""]);
  rows.push(["🥤 음료 메뉴 (온도 포함)", "수량", "비고"]);

  Object.keys(drinkCounts)
    .sort(function (a, b) { return drinkCounts[b] - drinkCounts[a]; })
    .forEach(function (k) {
      rows.push([k, drinkCounts[k], ""]);
    });

  rows.push(["", "", ""]);
  rows.push(["🥇 디저트 1순위 장바구니 합계", "수량", "비고"]);

  Object.keys(dessert1Counts)
    .sort(function (a, b) { return dessert1Counts[b] - dessert1Counts[a]; })
    .forEach(function (k) {
      rows.push([k, dessert1Counts[k], k === "선택안함" ? "디저트 패스" : "기본 주문"]);
    });

  rows.push(["", "", ""]);
  rows.push(["🥈 품절 시 개인별 2순위 대체 가이드", "1순위 메뉴", "품절 시 2순위 대체 메뉴"]);
  orders.forEach(function (o) {
    rows.push([
      o.name,
      o.baeminDessert1Label || o.dessert1Display || "선택안함",
      o.baeminDessert2Label || o.dessert2Display || "선택안함"
    ]);
  });

  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
  sheet.getRange(1, 1, 1, 3).setBackground("#ff5c8a").setFontColor("#ffffff").setFontWeight("bold");
  sheet.autoResizeColumns(1, 3);
}

function readAllOrders(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
  const orders = [];
  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    const name = String(r[0] || "").trim();
    if (!name) continue;
    orders.push({
      name: name,
      drinkDisplay: String(r[1] || ""),
      dessert1Display: String(r[2] || ""),
      dessert2Display: String(r[3] || ""),
      drinkCategory: String(r[4] || ""),
      drinkName: String(r[5] || ""),
      drinkTemp: String(r[6] || ""),
      baeminDessert1Label: String(r[7] || ""),
      baeminDessert2Label: String(r[8] || ""),
      memo: String(r[9] || ""),
      estimatedPrice: Number(r[10] || 0),
      timestamp: String(r[11] || "")
    });
  }
  return orders;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrInitOrderSheet(ss);
    const orders = readAllOrders(sheet);
    return jsonResponse({
      ok: true,
      orders: orders,
      count: orders.length,
      serverTime: Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss")
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const body = JSON.parse(raw);
    const action = body.action || "upsert";
    const name = String(body.name || "").trim();

    if (!name) {
      return jsonResponse({ ok: false, error: "이름이 비어 있습니다." });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrInitOrderSheet(ss);
    const lastRow = sheet.getLastRow();
    const nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

    let existingRowIndex = -1;
    if (lastRow > 1) {
      const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < names.length; i++) {
        if (String(names[i][0] || "").trim() === name) {
          existingRowIndex = i + 2;
          break;
        }
      }
    }

    if (action === "delete") {
      if (existingRowIndex > 1) {
        sheet.deleteRow(existingRowIndex);
      }
      const updatedOrders = readAllOrders(sheet);
      rebuildSummarySheet(ss, updatedOrders);
      return jsonResponse({ ok: true, mode: "deleted", orders: updatedOrders });
    }

    const rowData = [
      name,
      String(body.drinkDisplay || ""),
      String(body.dessert1Display || "선택안함"),
      String(body.dessert2Display || "선택안함"),
      String(body.drinkCategory || ""),
      String(body.drinkName || ""),
      String(body.drinkTemp || ""),
      String(body.baeminDessert1Label || ""),
      String(body.baeminDessert2Label || ""),
      String(body.memo || ""),
      Number(body.estimatedPrice || 0),
      nowStr
    ];

    let mode = "inserted";
    if (existingRowIndex > 1) {
      sheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
      mode = "updated";
    } else {
      sheet.appendRow(rowData);
    }

    sheet.autoResizeColumns(1, 4);
    const orders = readAllOrders(sheet);
    rebuildSummarySheet(ss, orders);

    return jsonResponse({
      ok: true,
      mode: mode,
      orders: orders,
      serverTime: nowStr
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
