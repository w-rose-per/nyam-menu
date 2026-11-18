/**
 * [디저트테이블냠냠&과일 마곡점] 도트 RPG 메뉴 선정 페이지 환경설정
 *
 * Google 스프레드시트 실시간 연동을 사용하려면:
 * 1. google-apps-script.gs 파일(또는 웹페이지 우측 상단 [시트연동] 버튼)의 코드를
 *    구글 스프레드시트 > 확장 프로그램 > Apps Script에 붙여넣고 [웹 앱으로 배포] 합니다.
 * 2. 발급된 웹 앱 URL (https://script.google.com/macros/s/.../exec)을
 *    아래 GOOGLE_SCRIPT_URL 큰따옴표 안에 붙여넣고 GitHub에 푸시하면 모든 접속자에게 자동 적용됩니다!
 *    (코드를 수정하지 않고 웹페이지 내 [시트연동] 버튼에서 공유 링크를 생성해 배포할 수도 있습니다.)
 */
window.NYAM_CONFIG = {
  STORE_NAME: "디저트테이블냠냠&과일 마곡점",
  STORE_SUBTITLE: "DESSERT TABLE NYAM-NYAM & FRUIT (MAGOK)",
  BAEMIN_URL: "https://s.baemin.com/bK000vefFFRgd",
  STORE_ADDRESS: "서울 강서구 공항대로 220 1층 112호 (마곡점)",

  // 👇 여기에 Google Apps Script 웹 앱 URL(/exec)을 입력하면 전체 팀원에게 즉시 연동됩니다.
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyk4sy8DtU_MiVrv_LOn0d0QfpMBhF45B_6skFVbys3KpUYHFePk2BWJk_opVpBkxUq-g/exec",

  // 현황판 자동 새로고침 주기 (밀리초, 기본 15초)
  POLL_INTERVAL_MS: 15000,
};
