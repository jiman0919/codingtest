// components/manual/ManualLayout.js
// 목적: "메뉴얼" 화면 공통 레이아웃 컴포넌트
// - 상단 헤더 + 좌측 사이드바 + 우측 본문 구조
// - 'sidebarItems' prop으로 좌측 메뉴를 주입하여 페이지별로 맞춤 구성이 가능함
// - 반응형: 모바일에서는 기본 닫힘, 데스크탑에서는 기본 열림

import React, { useState, useEffect, useCallback } from "react";
import "../manual/manual.css"; // 공통 스타일(그리드/폰트/색상/사이드바 등)
import "./StudentManual.css";   // ★ 학생 전용(이미지 비율만)

export default function ManualLayout({
  title = "코딩테스트 플랫폼 메뉴얼",   // 상단 헤더 타이틀(기본값 제공)
  children,                      // 실제 콘텐츠(섹션들)
  sidebarItems,                  // 좌측 메뉴 항목 주입: [{href:"/path", label:"텍스트"}, ...]
}) {
  // 사이드바 열림/닫힘 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 현재 뷰포트가 모바일인지 여부(768px 이하 기준)
  const [isMobile, setIsMobile] = useState(false);

  // 윈도우 리사이즈 시 모바일 판별 + 사이드바 초기 상태 결정
  // - 모바일: 기본 닫힘
  // - 데스크탑: 기본 열림
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    setIsSidebarOpen(!mobile);
  }, []);

  useEffect(() => {
    handleResize(); // 최초 1회 실행해서 현재 상태 반영
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // 기본 사이드바 항목(주입이 없을 때만 사용)
  // - 다른 일반 매뉴얼 페이지에서 재사용할 수 있도록 기본값을 유지
  const defaultItems = [
    { href: "/manual/common_manual/login",           label: "로그인" },
    { href: "/manual/common_manual/register",        label: "회원가입" },
    { href: "/manual/common_manual/change-password", label: "비밀번호 변경" },
  ];

  // 실제로 렌더할 항목(학생 매뉴얼에서는 StudentManual.js에서 주입)
  const items = Array.isArray(sidebarItems) && sidebarItems.length > 0 ? sidebarItems : defaultItems;

  // (선택) 모바일에서 메뉴 항목을 클릭하면 사이드바를 자동으로 닫고자 할 때 사용하는 핸들러
  const handleItemClick = (e) => {
    // a[href="#..."] 클릭 시 기본 동작(해시 이동)은 그대로 두고,
    // 모바일이라면 사이드바를 닫아 UX 개선
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div className="manual-page-wrapper u-page-wrapper">
      {/* 상단 헤더: 페이지 타이틀 + 메뉴 토글 버튼 */}
      <header className="manual-header u-header">
        <div className="manual-header-title u-header-title">
          {/* h1/h3 논쟁: 글로벌 헤딩 구조에 맞춰 적절히 수정 가능. 여기서는 h3 유지 */}
          <h3>{title}</h3>
        </div>

        <div className="manual-header-right u-header-right">
          {/* 사이드바 토글 버튼: 모바일/데스크탑 공통 제공(데스크탑에서도 접고 펼칠 수 있음) */}
          <button
            className="manual-header-button u-header-button"
            type="button"
            aria-label="사이드바 열기/닫기"
            onClick={() => setIsSidebarOpen((v) => !v)}
          >
            {/* 접근성: 텍스트 대신 아이콘(☰). 필요 시 svg 아이콘으로 교체 가능 */}
            ☰ 메뉴
          </button>
        </div>
      </header>

      {/* 본문 영역: 좌측 사이드바 + 우측 콘텐츠를 나란히 배치 */}
      <div className="manual-content-wrapper u-content-wrapper">
        {/* 좌측 사이드바: isSidebarOpen이 true일 때만 렌더 */}
        {isSidebarOpen && (
          <aside
            className={`manual-sidebar ${isMobile ? "mobile" : ""}`}
            aria-label="메뉴얼 목차"
          >
            {/* 목차 항목 리스트 */}
            <ul className="manual-sidebar-menu u-sidebar-menu">
              {items.map((it) => (
                <li key={it.href}>
                  {/* 경로 링크: 메뉴얼 경로(/.../...)로 이동 */}
                  <a href={it.href} onClick={handleItemClick}>
                    {it.label}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* 우측 본문: 실제 매뉴얼 섹션(이미지 + 텍스트 등) */}
        <main className="manual-main u-main">
          {/*
            권장: manual.css에 아래를 추가해서 스무스 스크롤 적용
            html { scroll-behavior: smooth; }
            또한 각 섹션에는 scroll-margin-top을 설정하여 헤더에 가리지 않게 함:
            .manual-section { scroll-margin-top: 80px; }
          */}
          {children}
        </main>
      </div>
    </div>
  );
}
