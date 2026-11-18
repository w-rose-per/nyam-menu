/**
 * '디저트테이블냠냠&과일 마곡점' 실제 배민 메뉴 데이터베이스
 * - 음료: drinks_photo 기준 7개 카테고리 66종 전체 수록 (차가운 음료: PET캔 / 따뜻한 음료: 종이컵 / 아이스 전용 구분 완벽 반영)
 * - 디저트: menu_photo 기준 6개 대분류 [과일 모찌, 그릭요거트과일모찌, 컵과일, 휘낭시에, 주관식 칸, 선택안함] -> 상세 메뉴 확장
 *   (1순위 선택 후 품절 대비용으로 1순위와 다른 2순위 메뉴 선택 지원)
 */

window.NYAM_MENU = {
  drinks: [
    {
      id: "coffee",
      name: "냠냠 커피",
      icon: "☕",
      desc: "디카페인 변경 가능 · ICE는 PET(캔), HOT은 종이컵 제공",
      items: [
        { id: "americano", name: "아메리카노 PET(캔)", temps: ["ICE", "HOT"], price: 3900, badge: "인기", note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "hazelnut_americano", name: "헤이즐넛 아메리카노 PET(캔)", temps: ["ICE", "HOT"], price: 4500, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "cafe_latte", name: "카페라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "vanilla_latte", name: "바닐라 라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, badge: "인기", note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "hazelnut_latte", name: "헤이즐넛 라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "maple_latte", name: "메이플 라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "cafe_mocha", name: "카페모카(휘핑x) PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "caramel_macchiato", name: "카라멜마끼아또 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "dolce_latte", name: "돌체 연유 라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "dabang_coffee", name: "다방커피 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "dabang_latte", name: "다방라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "einspanner", name: "아인슈페너 PET(캔)", temps: ["ICE"], price: 4900, badge: "ICE전용", note: "아메리카노+달콤 크림 · 오직 아이스만" }
      ]
    },
    {
      id: "liter",
      name: "1리터 대용량",
      icon: "🧋",
      desc: "넉넉하게 즐기는 1L 대용량 (보틀X, PET 제공 · 오직 아이스만 가능)",
      items: [
        { id: "1l_americano", name: "1리터 아메리카노 PET(4샷,보틀x)", temps: ["ICE"], price: 6900, badge: "1L 대용량", note: "오직 아이스만 가능" },
        { id: "1l_peach_tea", name: "1리터 복숭아아이스티 PET(보틀x)", temps: ["ICE"], price: 6900, badge: "1L 대용량", note: "오직 아이스만 가능" },
        { id: "1l_plum_tea", name: "1리터 매실차 PET(보틀x)", temps: ["ICE"], price: 6900, badge: "1L 대용량", note: "오직 아이스만 가능" },
        { id: "1l_misutgaru", name: "1리터 미숫가루라떼 PET(보틀x)", temps: ["ICE"], price: 8900, badge: "1L 대용량", note: "오직 아이스만 가능" },
        { id: "1l_strawberry_latte", name: "1리터 딸기라떼 PET(보틀x)", temps: ["ICE"], price: 8900, badge: "1L 대용량", note: "오직 아이스만 가능" },
        { id: "1l_choco_latte", name: "1리터 초코라떼 PET(보틀x)", temps: ["ICE"], price: 8900, badge: "1L 대용량", note: "오직 아이스만 가능" }
      ]
    },
    {
      id: "latte",
      name: "냠냠 라떼",
      icon: "🥛",
      desc: "부드럽고 진한 한 잔 (논커피 라떼)",
      items: [
        { id: "strawberry_latte", name: "딸기라떼 PET(캔)", temps: ["ICE"], price: 4900, badge: "ICE전용", note: "오직 아이스만 가능" },
        { id: "mango_latte", name: "망고라떼 PET(캔)", temps: ["ICE"], price: 4900, badge: "ICE전용", note: "오직 아이스만 가능" },
        { id: "choco_latte", name: "초코라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "matcha_latte", name: "말차라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "misutgaru_latte", name: "미숫가루라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "sweet_potato_latte", name: "자색고구마라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "cookies_cream_latte", name: "아이스쿠앤크라떼 PET(캔)", temps: ["ICE"], price: 4900, badge: "ICE전용", note: "오직 아이스만 가능" },
        { id: "milk_tea", name: "밀크티 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "mint_choco_latte", name: "민트초코라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "black_sesame_latte", name: "흑임자크림라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "mugwort_latte", name: "쑥크림라떼 PET(캔)", temps: ["ICE", "HOT"], price: 4900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "pistachio_cafe_latte", name: "피스타치오 카페라떼 PET(캔)", temps: ["ICE", "HOT"], price: 5200, badge: "추천", note: "ICE: PET(캔) / HOT: 종이컵" }
      ]
    },
    {
      id: "smoothie",
      name: "냠냠 스무디",
      icon: "🥤",
      desc: "시원하게 즐기는 스무디 & 요거트 스무디 (전 메뉴 ICE)",
      items: [
        { id: "strawberry_smoothie", name: "딸기 스무디 PET(캔)", temps: ["ICE"], price: 4900, note: "시원한 과일 스무디" },
        { id: "mango_smoothie", name: "망고 스무디 PET(캔)", temps: ["ICE"], price: 4900, note: "시원한 과일 스무디" },
        { id: "kiwi_smoothie", name: "키위 스무디 PET(캔)", temps: ["ICE"], price: 4900, note: "시원한 과일 스무디" },
        { id: "blueberry_smoothie", name: "블루베리 스무디 PET(캔)", temps: ["ICE"], price: 4900, note: "시원한 과일 스무디" },
        { id: "peach_smoothie", name: "복숭아 스무디 PET(캔)", temps: ["ICE"], price: 4900, note: "시원한 과일 스무디" },
        { id: "plain_yogurt_smoothie", name: "플레인 요거트 스무디 PET(캔)", temps: ["ICE"], price: 5500, badge: "인기", note: "상큼 요거트 스무디" },
        { id: "strawberry_yogurt_smoothie", name: "딸기 요거트 스무디 PET(캔)", temps: ["ICE"], price: 5500, badge: "인기", note: "상큼 요거트 스무디" },
        { id: "mango_yogurt_smoothie", name: "망고 요거트 스무디 PET(캔)", temps: ["ICE"], price: 5500, note: "상큼 요거트 스무디" },
        { id: "kiwi_yogurt_smoothie", name: "키위 요거트 스무디 PET(캔)", temps: ["ICE"], price: 5500, note: "상큼 요거트 스무디" },
        { id: "blueberry_yogurt_smoothie", name: "블루베리 요거트 스무디 PET(캔)", temps: ["ICE"], price: 5500, note: "상큼 요거트 스무디" }
      ]
    },
    {
      id: "ade",
      name: "냠냠 에이드",
      icon: "🍹",
      desc: "톡 쏘는 청량감! 에이드 PET(캔) (전 메뉴 ICE)",
      items: [
        { id: "lemon_ade", name: "레몬 에이드 PET(캔)", temps: ["ICE"], price: 4900, note: "톡 쏘는 에이드" },
        { id: "green_grape_ade", name: "청포도 에이드 PET(캔)", temps: ["ICE"], price: 4900, note: "톡 쏘는 에이드" },
        { id: "orange_ade", name: "오렌지 에이드 PET(캔)", temps: ["ICE"], price: 4900, note: "톡 쏘는 에이드" },
        { id: "grapefruit_ade", name: "자몽 에이드 PET(캔)", temps: ["ICE"], price: 4900, badge: "인기", note: "톡 쏘는 에이드" },
        { id: "strawberry_ade", name: "딸기에이드 PET(캔)", temps: ["ICE"], price: 4900, note: "톡 쏘는 에이드" },
        { id: "mango_ade", name: "망고에이드 PET(캔)", temps: ["ICE"], price: 4900, note: "톡 쏘는 에이드" },
        { id: "kiwi_ade", name: "키위에이드 PET(캔)", temps: ["ICE"], price: 4900, note: "톡 쏘는 에이드" },
        { id: "blueberry_ade", name: "블루베리에이드 PET(캔)", temps: ["ICE"], price: 4900, note: "톡 쏘는 에이드" },
        { id: "peach_ade", name: "[NEW] 복숭아 에이드 PET(캔)", temps: ["ICE"], price: 4900, badge: "NEW", note: "톡 쏘는 에이드" },
        { id: "black_cherry_ade", name: "블랙체리에이드 PET(캔)", temps: ["ICE"], price: 4900, note: "톡 쏘는 에이드" },
        { id: "yuja_ade", name: "유자에이드 PET(캔)", temps: ["ICE"], price: 4900, note: "톡 쏘는 에이드" }
      ]
    },
    {
      id: "tea",
      name: "냠냠 차(TEA)",
      icon: "🍵",
      desc: "따뜻한 여유 한 잔 & 시원한 티",
      items: [
        { id: "peach_iced_tea", name: "복숭아아이스티 (샷추가 가능) PET(캔)", temps: ["ICE"], price: 3900, badge: "ICE전용", note: "오직 아이스만 가능 (샷추가는 메모 기재)" },
        { id: "plum_tea", name: "매실차 PET(캔)", temps: ["ICE"], price: 3900, badge: "ICE전용", note: "오직 아이스만 가능" },
        { id: "chamomile", name: "캐모마일 PET(캔)", temps: ["ICE", "HOT"], price: 3900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "peppermint", name: "페퍼민트 PET(캔)", temps: ["ICE", "HOT"], price: 3900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "earl_grey", name: "얼그레이 PET(캔)", temps: ["ICE", "HOT"], price: 3900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "hibiscus", name: "히비스커스 PET(캔)", temps: ["ICE", "HOT"], price: 3900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "rooibos", name: "루이보스 PET(캔)", temps: ["ICE", "HOT"], price: 3900, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "yuja_tea", name: "유자차 PET(캔)", temps: ["ICE", "HOT"], price: 4500, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "ginger_tea", name: "생강차 PET(캔)", temps: ["ICE", "HOT"], price: 4500, note: "ICE: PET(캔) / HOT: 종이컵" },
        { id: "jujube_tea", name: "대추차 PET(캔)", temps: ["ICE", "HOT"], price: 4500, note: "ICE: PET(캔) / HOT: 종이컵" }
      ]
    },
    {
      id: "juice",
      name: "생과일 주스",
      icon: "🍍",
      desc: "100% 생과일 사용 PET(캔) 주스 (전 메뉴 ICE)",
      items: [
        { id: "pineapple_juice", name: "[리얼] 파인애플 주스 PET(캔)", temps: ["ICE"], price: 4000, badge: "20%할인", note: "100% 생과일 주스 (정가 5,000원)" },
        { id: "shinemuscat_juice", name: "[리얼] 샤인머스켓 주스 PET(캔)", temps: ["ICE"], price: 5000, badge: "인기", note: "100% 생과일 주스" },
        { id: "tomato_juice", name: "토마토 주스 PET(캔)", temps: ["ICE"], price: 5000, note: "100% 생과일 주스" },
        { id: "kiwi_juice", name: "키위 주스 PET(캔)", temps: ["ICE"], price: 5000, note: "100% 생과일 주스" },
        { id: "banana_juice", name: "바나나 주스 PET(캔)", temps: ["ICE"], price: 5000, note: "100% 생과일 주스" }
      ]
    }
  ],

  /**
   * 디저트 6대 대분류 (클릭 시 상세 메뉴 확장)
   * - 1순위 선택 후 품절 대비용으로 1순위와 다른 2순위 메뉴를 선택합니다.
   */
  desserts: [
    {
      id: "fruit_mochi",
      name: "과일 모찌",
      fullTitle: "생과일 왕모찌 (팥모찌)",
      icon: "🍓",
      statTag: "인기 3위",
      subtitle: "쫀득한 모찌와 달콤한 팥·생과일의 만남",
      type: "list",
      items: [
        {
          id: "mochi_strawberry",
          name: "[NEW] 딸기 팥",
          baeminLabel: "생과일 왕모찌 - [NEW] 딸기 팥",
          price: 4900,
          optionNote: "기본 3,900원 + 1,000원",
          badge: "NEW"
        },
        {
          id: "mochi_shinemuscat",
          name: "샤인머스켓 팥",
          baeminLabel: "생과일 왕모찌 - 샤인머스켓 팥",
          price: 3900,
          optionNote: "기본 3,900원 (+0원)"
        },
        {
          id: "mochi_tangerine",
          name: "귤 팥",
          baeminLabel: "생과일 왕모찌 - 귤 팥",
          price: 4300,
          optionNote: "기본 3,900원 + 400원",
          badge: "많이 팔렸어요"
        },
        {
          id: "mochi_goldkiwi",
          name: "골드키위 팥",
          baeminLabel: "생과일 왕모찌 - 골드키위 팥",
          price: 4700,
          optionNote: "기본 3,900원 + 800원"
        }
      ]
    },
    {
      id: "greek_mochi",
      name: "그릭요거트과일모찌",
      fullTitle: "[그릭요거트] 생과일 왕모찌",
      icon: "🥣",
      statTag: "인기 1위",
      subtitle: "꾸덕한 수제 그릭요거트 품은 생과일 왕모찌",
      type: "list",
      items: [
        {
          id: "yogurt_mochi_strawberry",
          name: "[NEW] 딸기",
          baeminLabel: "[그릭요거트]생과일 왕모찌 - [NEW] 딸기",
          price: 5900,
          optionNote: "기본 4,900원 + 1,000원",
          badge: "NEW"
        },
        {
          id: "yogurt_mochi_shinemuscat",
          name: "[요거트] 샤인머스켓",
          baeminLabel: "[그릭요거트]생과일 왕모찌 - [요거트] 샤인머스켓",
          price: 4900,
          optionNote: "기본 4,900원 (+0원)"
        },
        {
          id: "yogurt_mochi_goldkiwi",
          name: "[요거트] 골드키위",
          baeminLabel: "[그릭요거트]생과일 왕모찌 - [요거트] 골드키위",
          price: 5700,
          optionNote: "기본 4,900원 + 800원"
        },
        {
          id: "yogurt_mochi_blueberry",
          name: "[요거트] 블루베리",
          baeminLabel: "[그릭요거트]생과일 왕모찌 - [요거트] 블루베리",
          price: 5700,
          optionNote: "기본 4,900원 + 800원",
          badge: "많이 팔렸어요"
        },
        {
          id: "yogurt_mochi_tangerine",
          name: "[요거트] 귤",
          baeminLabel: "[그릭요거트]생과일 왕모찌 - [요거트] 귤",
          price: 5300,
          optionNote: "기본 4,900원 + 400원 (매장 품절 주의)",
          badge: "품절주의"
        }
      ]
    },
    {
      id: "cup_fruit",
      name: "컵과일",
      fullTitle: "신선 제철 컵과일",
      icon: "🍍",
      statTag: "상큼충전",
      subtitle: "당일 손질한 고당도 제철 생과일 구성",
      type: "list",
      items: [
        {
          id: "cup_fruit_basic",
          name: "컵과일 (기본 · 제철과일 3~5종)",
          baeminLabel: "컵과일 (기본)",
          price: 4500,
          optionNote: "신선 제철과일 먹기 좋게 한 컵",
          badge: "BEST"
        },
        {
          id: "cup_fruit_sizeup",
          name: "사이즈업 컵과일 (4~5종 듬뿍)",
          baeminLabel: "사이즈업 컵과일",
          price: 5500,
          optionNote: "넉넉한 사이즈업 과일 구성",
          badge: "인기"
        }
      ]
    },
    {
      id: "financier",
      name: "휘낭시에",
      fullTitle: "+ 냠냠 휘낭시에 + (10종)",
      icon: "🥖",
      statTag: "겉바속촉",
      subtitle: "겉은 바삭, 속은 촉촉 구움과자 휘낭시에 10종",
      type: "list",
      items: [
        {
          id: "fin_classic_butter",
          name: "클래식 버터 휘낭시에",
          baeminLabel: "클래식 버터 휘낭시에",
          price: 2700,
          optionNote: "고소한 고메버터 풍미",
          badge: "기본정석"
        },
        {
          id: "fin_classic_choco",
          name: "클래식 초코 휘낭시에",
          baeminLabel: "클래식 초코 휘낭시에",
          price: 2800,
          optionNote: "진한 초콜릿 베이스"
        },
        {
          id: "fin_choco_chunk",
          name: "초코청크 휘낭시에",
          baeminLabel: "초코청크 휘낭시에",
          price: 2800,
          optionNote: "달콤한 초코청크 콕콕"
        },
        {
          id: "fin_salty_choco",
          name: "솔티초코 휘낭시에",
          baeminLabel: "솔티초코 휘낭시에",
          price: 3200,
          optionNote: "단짠단짠 솔티드 초코 코팅",
          badge: "인기"
        },
        {
          id: "fin_churros",
          name: "츄러스 휘낭시에",
          baeminLabel: "츄러스 휘낭시에",
          price: 3200,
          optionNote: "향긋한 시나몬 슈가 츄러스"
        },
        {
          id: "fin_lemon",
          name: "레몬 휘낭시에",
          baeminLabel: "레몬 휘낭시에",
          price: 3200,
          optionNote: "상큼달콤 레몬 글레이즈"
        },
        {
          id: "fin_earlgrey",
          name: "얼그레이 휘낭시에",
          baeminLabel: "얼그레이 휘낭시에",
          price: 3200,
          optionNote: "은은한 홍차 향 가득"
        },
        {
          id: "fin_ferrero_white",
          name: "페레로화이트 휘낭시에",
          baeminLabel: "페레로화이트 휘낭시에",
          price: 3200,
          optionNote: "고소한 크런치 화이트초코"
        },
        {
          id: "fin_ferrero_choco",
          name: "페레로초코 휘낭시에",
          baeminLabel: "페레로초코 휘낭시에",
          price: 3200,
          optionNote: "바삭한 헤이즐넛 초코 크런치"
        },
        {
          id: "fin_cheese",
          name: "황치즈 휘낭시에",
          baeminLabel: "황치즈 휘낭시에",
          price: 3200,
          optionNote: "꾸덕 짭짤 미니 프레첼 황치즈",
          badge: "인기"
        }
      ]
    },
    {
      id: "custom",
      name: "주관식 칸",
      fullTitle: "기타 디저트 직접 입력 (주관식)",
      icon: "✏️",
      statTag: "직접입력",
      subtitle: "두바이쫀득쿠키·밀키롤·초코롤·컵화채 등 기타 메뉴 직접 작성",
      type: "custom",
      suggestions: [
        "두바이쫀득쿠키",
        "밀키롤",
        "초코롤",
        "컵화채"
      ]
    },
    {
      id: "none",
      name: "선택안함",
      fullTitle: "디저트 선택 안 함",
      icon: "🚫",
      statTag: "PASS",
      subtitle: "디저트는 패스할게요!",
      type: "none"
    }
  ]
};
