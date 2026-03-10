// components/manual/student/StudentManual.js
// 목적: 학생 매뉴얼 - 경로/사이드바/스크롤 동기화(바텀 라인 기반 ScrollSpy) 통합
// 변경 요약:
//  - /student_manual/* 경로를 단일 진실 소스로 사용(해시 진입 시 경로 정규화)
//  - 사이드바 클릭 시 해당 섹션으로 부드러운 스크롤 + pushState
//  - 스크롤 시 바텀 기준선(lineBottom)으로 현재 섹션 활성화 + replaceState
//  - 콘텐츠/마크업/이미지 경로는 기존과 동일 유지

import React, { useEffect } from "react";
import ManualLayout from "./ManualLayout.js";

// 캡처 이미지
import enrollImg from "./png/student_enroll.png";
import selectImg from "./png/student_select.png";
import solveImg  from "./png/student_solve.png";

// 스타일
import "./CommonManual.css";
import "./StudentManual.css";

export default function StudentManual() {
  const sidebarItems = [
    { href: "/manual/student_manual/enroll", label: "수강 신청" },
    { href: "/manual/student_manual/select", label: "문제 선택" },
    { href: "/manual/student_manual/solve",  label: "문제 풀이" },
  ];

  useEffect(() => {
    const BASE = "/manual/student_manual";
    // slug <-> section id 매핑 (동일)
    const slugToId = { enroll: "enroll", select: "select", solve: "solve" };
    const idToSlug = { enroll: "enroll", select: "select", solve: "solve" };

    // 경로 정규화
    if (window.location.hash) {
      const slug = window.location.hash.slice(1); // #enroll -> enroll
      if (slugToId[slug]) {
        window.history.replaceState(null, "", `${BASE}/${slug}`);
      }
    }
    if (window.location.pathname === BASE) {
      window.history.replaceState(null, "", `${BASE}/enroll`);
    }

    // 활성 클래스 동기화
    const setActivePath = (path) => {
      const links = document.querySelectorAll('.manual-sidebar-menu a, .u-sidebar-menu a');
      links.forEach(a => a.classList.remove('is-active'));
      const active = Array.from(links).find(a => {
        try {
          return new URL(a.href, window.location.origin).pathname === path;
        } catch { return false; }
      });
      if (active) active.classList.add('is-active');
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
    const onClick = (e) => {
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
    document.addEventListener("click", onClick);

    // 초기 1회
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

    // 뒤/앞으로가기
    const onPop = () => {
      const p = window.location.pathname;
      if (!p.startsWith(BASE)) return;
      const slug = p.replace(BASE + "/", "");
      setActivePath(p);
      scrollToSlug(slug);
    };
    window.addEventListener("popstate", onPop);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  return (
    <ManualLayout title="학생 매뉴얼" sidebarItems={sidebarItems}>
      {/* 전용 스코프: 이 래퍼가 있어야 StudentManual.css가 확실히 적용됩니다 */}
      <div className="student-manual u-student-manual">

        {/* [1] 수강 신청 */}
        <section id="enroll" className="manual-section u-section">
          <div className="manual-two-col u-two-col">
            <div className="manual-figure u-figure">
              <div className="img-box" style={{ "--ar": "1474 / 790", "--img-fit": "contain" }}>
                <img src={enrollImg} alt="수강 신청 화면" />
              </div>
            </div>

            <div className="manual-steps u-steps">
              <h2>수강 신청</h2>
              <ul>
                <li className="manual-step u-step"><span className="num">1</span>
                  <span>강좌 목록에서 들어야 하는 수업에 <b>수강 신청</b> 버튼을 누릅니다.</span> 
                  <span>수강 신청 버튼을 누르면 교수에게 수강 신청 승인이 전송됩니다.</span>
                </li>
                <li className="manual-step u-step"><span className="num">2</span>
                  <span>승인되면 수강 강좌 목록에 자동 추가됩니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* [2] 문제 선택 */}
        <section id="select" className="manual-section u-section">
          <div className="manual-two-col u-two-col">
            <div className="manual-figure u-figure">
              <div className="img-box" style={{ "--ar": "1387 / 665", "--img-fit": "contain" }}>
                <img src={selectImg} alt="문제 선택 화면" />
              </div>
            </div>

            <div className="manual-steps u-steps">
              <h2>문제 선택</h2>
              <ul>
                <li>
                  <span>수강 중인 강좌를 누르면 <b>문제 목록</b>이 나타납니다.</span>
                </li>
                  <span>내가 푼 문제의 <b>제출 상태</b>가 문제 오른쪽에 표시됩니다.</span>
              </ul>
            </div>
          </div>
        </section>

        {/* [3] 문제 풀이 */}
        <section id="solve" className="manual-section u-section">
          <div className="manual-two-col u-two-col">
            <div className="manual-figure u-figure">
              <div className="img-box" style={{ "--ar": "1919 / 909", "--img-fit": "contain"}}>
                <img src={solveImg} alt="문제 풀이 화면" />
              </div>
            </div>

            <div className="manual-steps u-steps">
              <h2>문제 풀이</h2>
              <ul>
                <li className="manual-step u-step"><span className="num">1</span>
                  <span><b>문제:</b> 제목·배점·설명·예시가 표시됩니다.</span>
                </li>
                <li className="manual-step u-step"><span className="num">2</span>
                  <span><b>코드 에디터:</b> 코드를 작성하는 칸입니다. 문제에 따라 기본 제공 코드가 있을 수 있습니다.</span>
                </li>
                <li className="manual-step u-step"><span className="num">3</span>
                  <span><b>결과창:</b> 실행 결과가 표시됩니다.</span>
                </li>
                <li className="manual-step u-step"><span className="num">4</span>
                  <span><b>실행:</b> 코드를 실행해 확인할 수 있습니다. 값을 정확하게 보고 싶으시면 직접 출력을 입력해야 합니다. <span><b>ex)</b> print(solution(1,2)) (점수 반영 없음)</span></span>
                </li>
                <li className="manual-step u-step"><span className="num">5</span>
                  <span><b>제출:</b> 코드를 제출하면 점수에 반영되고 기록됩니다.</span>
                </li>
                <span className="manual-note note-align u-note">제출은 한 번 하면 <b>변경할 수 없습니다.</b></span>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </ManualLayout>
  );
}
