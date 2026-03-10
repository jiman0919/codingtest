// components/manual/admin/AdminManual.js
// 목적: 관리자 매뉴얼 (교수 추가 / 비밀번호 초기화 / 유저 제거)
// 특징:
//  - 경로 우선(/admin_manual/*) + 해시 진입 시 경로 정규화
//  - 사이드바 클릭 시 pushState + 부드러운 스크롤
//  - 바텀 라인 기반 ScrollSpy(OFFSET=140)
//  - 레이아웃: 왼쪽 이미지, 오른쪽 텍스트 (기존 두 컬럼 클래스 재사용)

import React, { useEffect } from "react";
import ManualLayout from "./ManualLayout";
import "./CommonManual.css"; // 공통 스타일 재사용
//import "./AdminManual.css";  // 필요시만 작성, 없어도 동작

// 스크린샷 이미지 (경로는 프로젝트 구조에 맞춰 ./png/ 폴더에 배치)
import addProfessorImg   from "./png/add-professor.png";
import resetPasswordImg  from "./png/reset-password.png";
import removeUserImg     from "./png/remove-user.png";

export default function AdminManual() {
  const sidebarItems = [
    { href: "/manual/admin_manual/professor-add", label: "교수 추가" },
    { href: "/manual/admin_manual/password-reset", label: "비밀번호 초기화" },
    { href: "/manual/admin_manual/user-remove", label: "유저 제거" },
  ];

  useEffect(() => {
    const BASE = "/manual/admin_manual";
    const slugToId = {
      "professor-add": "professor-add",
      "password-reset": "password-reset",
      "user-remove": "user-remove",
    };
    const idToSlug = { ...slugToId };

    // 해시 진입(#password-reset 등) 시 경로로 정규화
    if (window.location.hash) {
      const slug = window.location.hash.slice(1);
      if (slugToId[slug]) {
        window.history.replaceState(null, "", `${BASE}/${slug}`);
      }
    }

    // 기본 경로 보정
    if (window.location.pathname === BASE) {
      window.history.replaceState(null, "", `${BASE}/professor-add`);
    }

    // 사이드바 활성 동기화
    const setActivePath = (path) => {
      const links = document.querySelectorAll('.manual-sidebar-menu a, .u-sidebar-menu a');
      links.forEach(a => {
        try {
          const ap = new URL(a.href, window.location.origin).pathname;
          a.classList.toggle('is-active', ap === path);
        } catch {}
      });
    };

    // 부드러운 스크롤
    let programmaticScrollUntil = 0;
    const scrollToSlug = (slug) => {
      const id = slugToId[slug];
      const el = id && document.getElementById(id);
      if (el) {
        programmaticScrollUntil = Date.now() + 700;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // 사이드바 클릭 위임
    const onMenuClick = (e) => {
      const a = e.target.closest('.manual-sidebar-menu a, .u-sidebar-menu a');
      if (!a) return;
      const ap = new URL(a.href, window.location.origin).pathname;
      if (!ap.startsWith(BASE + "/")) return;
      e.preventDefault();
      if (window.location.pathname !== ap) {
        window.history.pushState(null, "", ap);
      }
      const slug = ap.replace(BASE + "/", "");
      setActivePath(ap);
      scrollToSlug(slug);
    };
    document.addEventListener('click', onMenuClick);

    // 초기 활성화
    setActivePath(window.location.pathname);

    // ===== 하이브리드 ScrollSpy =====
    // 기본: 바텀 라인 (마지막 섹션 활성화 보장)
    // 보정: 최상단/문서 바닥 근처 스냅 처리
    const TOP_PIN_TOL   = 80;   // 최상단에서 첫 섹션 고정 허용 범위(px)
    const BOTTOM_OFFSET = 100;  // 바텀 라인 오프셋(헤더/여백 감안하여 80~140 권장)
    const END_PIN_TOL   = 40;   // 문서 끝에서 마지막 섹션 고정 허용 범위(px)
    
    const sections = Array.from(document.querySelectorAll('.manual-section.u-section'));
    const ids = sections.map(s => s.id);
    
    let ticking = false;
    const onScroll = () => {
      if (Date.now() < programmaticScrollUntil) return;
      if (ticking) return;
      ticking = true;
    
      window.requestAnimationFrame(() => {
        ticking = false;
    
        const scrollY   = window.scrollY || window.pageYOffset;
        const vh        = window.innerHeight;
        const docH      = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        const lineBottom = scrollY + vh - BOTTOM_OFFSET;
        const lineTop    = scrollY + TOP_PIN_TOL;
    
        // 1) 최상단 근처면 첫 섹션 고정
        const firstTopAbs = sections[0].getBoundingClientRect().top + scrollY;
        if (lineTop <= firstTopAbs) {
          const path = `${BASE}/${idToSlug[ids[0]]}`;
          if (window.location.pathname !== path) window.history.replaceState(null, "", path);
          setActivePath(path);
          return;
        }
    
        // 2) 문서 바닥 근처면 마지막 섹션 고정
        const atEnd = (docH - (scrollY + vh)) <= END_PIN_TOL;
        if (atEnd) {
          const lastIdx = ids.length - 1;
          const path = `${BASE}/${idToSlug[ids[lastIdx]]}`;
          if (window.location.pathname !== path) window.history.replaceState(null, "", path);
          setActivePath(path);
          return;
        }
    
        // 3) 그 외 구간은 "바텀 라인"으로 활성 섹션 결정
        let idx = ids.length - 1;
        for (let i = 0; i < sections.length; i++) {
          const rect = sections[i].getBoundingClientRect();
          const bottomAbs = rect.bottom + scrollY;
          if (bottomAbs > lineBottom) { idx = i; break; }
        }
    
        const currentId = ids[idx];
        const slug = idToSlug[currentId];
        if (slug) {
          const path = `${BASE}/${slug}`;
          if (window.location.pathname !== path) window.history.replaceState(null, "", path);
          setActivePath(path);
        }
      });
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    // 초기 1회 동기화 (새로고침 직후 잘못된 활성 방지)
    onScroll();


    // 뒤/앞으로 가기
    const onPop = () => {
      const p = window.location.pathname;
      if (!p.startsWith(BASE)) return;
      const slug = p.replace(BASE + "/", "");
      setActivePath(p);
      scrollToSlug(slug);
    };
    window.addEventListener('popstate', onPop);

    return () => {
      document.removeEventListener('click', onMenuClick);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  return (
    <ManualLayout title="관리자 매뉴얼" sidebarItems={sidebarItems}>
      <div className="admin-manual u-admin-manual">

        {/* 1) 교수 추가 (왼쪽 이미지 / 오른쪽 텍스트) */}
        <section id="professor-add" className="manual-section u-section">
          <div className="manual-two-col u-two-col">
            <div className="manual-figure u-figure">
              <div className="img-box">
                <img src={addProfessorImg} alt="교수 추가 화면" />
              </div>
            </div>
            <div className="manual-steps u-steps">
              <h2>교수 추가</h2>
              <ul>
                <li className="manual-step u-step">
                  <span>추가 버튼을 누르면 교수 아이디를 추가할 수 있습니다. 교수님에게 <b>성명, 아이디 및 비밀번호</b>를 받은 후 진행해 주세요.</span>
                </li>
              </ul>
              <span className="manual-note u-note">
                생성 후 <b>비밀번호 변경</b>을 권장해 주세요.
              </span>
            </div>
          </div>
        </section>

        {/* 2) 비밀번호 초기화 */}
        <section id="password-reset" className="manual-section u-section">
          <div className="manual-two-col u-two-col">
            <div className="manual-figure u-figure">
              <div className="img-box">
                <img src={resetPasswordImg} alt="비밀번호 초기화 화면" />
              </div>
            </div>
            <div className="manual-steps u-steps">
              <h2>비밀번호 초기화</h2>
              <ul>
                <li className="manual-step u-step">
                  <span>교수님이 비밀번호를 잊으셨을 경우 <b>성명</b>을 확인한 뒤 <b>초기화</b> 버튼을 눌러주십시오. 비밀번호가 <b>0000</b>으로 초기화됩니다.</span>
                </li>
              </ul>
              <span className="manual-note u-note">
                 초기화 후 공지하고 <b>비밀번호 변경</b>을 권장해 주세요. 
              </span>
            </div>
          </div>
        </section>

        {/* 3) 유저 제거 */}
        <section id="user-remove" className="manual-section u-section">
          <div className="manual-two-col u-two-col">
            <div className="manual-figure u-figure">
              <div className="img-box">
                <img src={removeUserImg} alt="유저 제거 화면" />
              </div>
            </div>
            <div className="manual-steps u-steps">
              <h2>유저 제거</h2>
              <ul>
                <li className="manual-step u-step">
                  <span>잘못 추가한 사용자 또는 더는 사용하지 않는 계정일 경우 <b>제거</b> 버튼을 누르면 계정이 <b>삭제</b>됩니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </ManualLayout>
  );
}
