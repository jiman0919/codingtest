import React, { useEffect, useRef } from "react";
import ManualLayout from "./ManualLayout";
import loginImg from "./png/login.png";
import registerImg from "./png/register.png";
import changePwImg from "./png/change_password.png";
import "./CommonManual.css"; // 스타일 파일

// ===== 이미지 원본 크기 기준으로 스케일 계산 훅 =====
function useScaleOverlay(boxRef, imgRef) {
  useEffect(() => {
    if (!boxRef.current || !imgRef.current) return;
    const box = boxRef.current;
    const img = imgRef.current;

    const place = () => {
      const natW = img.naturalWidth, natH = img.naturalHeight;
      if (!natW || !natH) return;
      const { width: W, height: H } = box.getBoundingClientRect();
      box.style.setProperty("--baseW", natW + "px");
      box.style.setProperty("--baseH", natH + "px");
      box.style.setProperty("--sx", (W / natW).toString());
      box.style.setProperty("--sy", (H / natH).toString());
      
      // 이미지 보더 두께를 읽어서 오버레이 inset에 반영 (Y 오차 근본 해결)
      const cs = getComputedStyle(img);
      box.style.setProperty("--img-border-top",    cs.borderTopWidth);
      box.style.setProperty("--img-border-right",  cs.borderRightWidth);
      box.style.setProperty("--img-border-bottom", cs.borderBottomWidth);
      box.style.setProperty("--img-border-left",   cs.borderLeftWidth);
    };

    const onLoad = () => place();
    if (img.complete) onLoad(); else img.addEventListener("load", onLoad);

    const ro = new ResizeObserver(place);
    ro.observe(box);
    window.addEventListener("resize", place);

    return () => {
      img.removeEventListener("load", onLoad);
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [boxRef, imgRef]);
}

export default function CommonManual() {

  // 비밀번호 변경 섹션에만 ref 적용
  const pwBoxRef = useRef(null);
  const pwImgRef = useRef(null);
  useScaleOverlay(pwBoxRef, pwImgRef);
  
  // 활성 항목 강조 + 경로/스크롤 동기화 (바텀 라인 기반)
  useEffect(() => {
    const BASE = "/manual/common_manual";
    const slugToId = {
      login: "login",
      register: "register",
      "change-password": "change-password",
    };
    const idToSlug = {
      login: "login",
      register: "register",
      "change-password": "change-password",
    };

    // 0) 해시 진입(#login 등) 시 경로로 정규화
    if (window.location.hash) {
      const slug = window.location.hash.slice(1);
      if (slugToId[slug]) {
        window.history.replaceState(null, "", `${BASE}/${slug}`);
      }
    }

    // 1) 기본 경로 보정: /common_manual -> /common_manual/login
    if (window.location.pathname === BASE) {
      window.history.replaceState(null, "", `${BASE}/login`);
    }

    // 2) 사이드바 활성 클래스 동기화
    const setActivePath = (path) => {
      const menu = document.querySelector('.manual-sidebar-menu, .u-sidebar-menu');
      if (!menu) return;
      const anchors = Array.from(menu.querySelectorAll('a'));
      anchors.forEach(a => {
        try {
          const ap = new URL(a.href, window.location.origin).pathname;
          a.classList.toggle('is-active', ap === path);
        } catch {}
      });
    };

    // 3) 부드러운 스크롤
    let programmaticScrollUntil = 0;
    const scrollToSlug = (slug) => {
      const id = slugToId[slug];
      const el = id && document.getElementById(id);
      if (el) {
        programmaticScrollUntil = Date.now() + 700;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // 4) 사이드바 클릭 위임: pushState + 스크롤
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

    // 5) 초기 1회 활성 동기화
    setActivePath(window.location.pathname);

    // 6) 바텀 라인 ScrollSpy: lineBottom이 직전 섹션 bottom을 지나면 다음 섹션 활성화
    const BOTTOM_OFFSET = 140; // 필요 시 120~180으로 조정
    const sections = Array.from(document.querySelectorAll('.manual-section.u-section'));
    const ids = sections.map(s => s.id);

    let ticking = false;
    const onScroll = () => {
      if (Date.now() < programmaticScrollUntil) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          ticking = false;
          const lineBottom = (window.scrollY || window.pageYOffset) + window.innerHeight - BOTTOM_OFFSET;

          let idx = ids.length - 1;
          for (let i = 0; i < sections.length; i++) {
            const rect = sections[i].getBoundingClientRect();
            const bottomAbs = rect.bottom + window.scrollY;
            if (bottomAbs > lineBottom) { // 아직 기준선 아래로 내려가지 않음
              idx = i;
              break;
            }
          }
          const currentId = ids[idx];
          const slug = idToSlug[currentId];
          if (slug) {
            const path = `${BASE}/${slug}`;
            if (window.location.pathname !== path) {
              window.history.replaceState(null, "", path);
            }
            setActivePath(path);
          }
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // 7) 뒤/앞으로가기: popstate
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
    <ManualLayout title="로그인 매뉴얼">
      <>
        {/* ------------------------------
            1) 로그인
           ------------------------------ */}
        <section id="login" className="manual-section u-section">
          <div className="manual-two-col u-two-col">
            <div className="manual-figure u-figure">
              <div className="img-box">
                <img src={loginImg} alt="로그인 화면" />
        
                  {/* SVG 오버레이 (좌표: %) */}
                  <svg className="svg-overlay" viewBox="0 0 599 603" preserveAspectRatio="none">
                  <rect x="47.92" y="420" width="497.17" height="62" fill="none" stroke="#e53935" strokeWidth="4" rx="1" />
          
                  {/* 번호 마커: scale(0.55) 로 크기만 축소 */}
                  <g className="svg-marker" transform="translate(545,240) scale(2)">
                    <circle r="11" />
                    <text y="1.5">1</text>
                  </g>
                  <g className="svg-marker" transform="translate(545,360) scale(2)">
                    <circle r="11" />
                    <text y="1.5">2</text>
                  </g>
                  <g className="svg-marker" transform="translate(545,425) scale(2)">
                    <circle r="11" />
                    <text y="1.5">3</text>
                  </g>
                </svg>
              </div>
            </div>
            <div className="manual-steps u-steps">
              <h2>로그인</h2>
              <p>
                메인 페이지 하단의 <b>로그인</b> 버튼을 클릭합니다.{" "}
                <span className="nowrap">학번/교수 계정과</span> 비밀번호 입력 후 로그인하면 대시보드로 이동합니다.
              </p>
              <ul>
                <li className="manual-step u-step"><span className="num">1</span>아이디<span className="nowrap">(학번/교수 계정)</span> 입력</li>
                <li className="manual-step u-step"><span className="num">2</span>비밀번호 입력</li>
                <li className="manual-step u-step"><span className="num">3</span><b>로그인</b> 버튼 클릭</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ------------------------------
            2) 회원가입
           ------------------------------ */}
        <section id="register" className="manual-section u-section">
          <div className="manual-two-col u-two-col">
            <div className="manual-figure u-figure">
              <div className="img-box">
                <img src={registerImg} alt="회원가입 화면" />
        
                {/* SVG 오버레이 (좌표: %) */}
                <svg className="svg-overlay" viewBox="0 0 588 835" preserveAspectRatio="none">
                  {/* 회원가입은 박스 없이 마커만 있었음 */}
                  <g className="svg-marker" transform="translate(530,230) scale(2)">
                    <circle r="11" />
                    <text y="1.5">1</text>
                  </g>
                  <g className="svg-marker" transform="translate(530,350) scale(2)">
                    <circle r="11" />
                    <text y="1.5">2</text>
                  </g>
                  <g className="svg-marker" transform="translate(530,470) scale(2)">
                    <circle r="11" />
                    <text y="1.5">3</text>
                  </g>
                  <g className="svg-marker" transform="translate(530,590) scale(2)">
                    <circle r="11" />
                    <text y="1.5">4</text>
                  </g>
                </svg>
              </div>
            </div>
            <div className="manual-steps u-steps">
              <h2>회원가입</h2>
              <p>
                로그인 화면 하단의 <b>회원가입</b>을 클릭해 이동합니다.
                <span className="manual-note u-note">교수는 관리자 추가로만 생성됩니다.</span>
              </p>
              <ul>
                <li className="manual-step u-step"><span className="num">1</span><b>이름:</b> 사용자의 이름을 입력하세요.</li>
                <li className="manual-step u-step"><span className="num">2</span><b>아이디:</b> 아이디(학번)을 입력하세요.</li> <span className="manual-note note-align u-note">ID=학번 필수입니다.</span>
                <li className="manual-step u-step"><span className="num">3</span><b>비밀번호:</b> 비밀번호를 입력하세요.</li>
                <li className="manual-step u-step"><span className="num">4</span><b>비밀번호 확인:</b>비밀번호와 일치하게 입력하세요.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ------------------------------
            3) 비밀번호 변경 (SVG 오버레이)
           ------------------------------ */}
        <section id="change-password" className="manual-section u-section">
          <div className="manual-two-col u-two-col">
            <div className="manual-figure u-figure">
              <div className="img-box" ref={pwBoxRef}>
                <img src={changePwImg} alt="비밀번호 변경 화면" ref={pwImgRef} />
        
                {/* SVG 오버레이: 0~100 좌표계(퍼센트) */}
                <svg className="svg-overlay" viewBox="0 0 586 629" preserveAspectRatio="none">
                  {/* 버튼 테두리 박스 */}
                  <rect
                    x="40" y="526" width="245" height="59"
                    fill="none" stroke="#e53935"
                    strokeWidth="3" vectorEffect="non-scaling-stroke" rx="1"
                  />
        
                  {/* 번호 마커 (크기는 scale로 조절) */}
                  <g className="svg-marker" transform="translate(534,235) scale(2)">
                    <circle r="11" /><text y="1.5">1</text>
                  </g>
                  <g className="svg-marker" transform="translate(534,355) scale(2)">
                    <circle r="11" /><text y="1.5">2</text>
                  </g>
                  <g className="svg-marker" transform="translate(534,475) scale(2)">
                    <circle r="11" /><text y="1.5">3</text>
                  </g>
                  <g className="svg-marker" transform="translate(285,520) scale(2)">
                    <circle r="11" /><text y="1.5">4</text>
                  </g>
                </svg>
              </div>
            </div>
        
            <div className="manual-steps u-steps">
              <h2>비밀번호 변경</h2>
              <p>로그인 후 상단 메뉴에서 <b>비밀번호 변경</b> 클릭 → 현재 비밀번호 확인 후 새 비밀번호 저장</p>
              <ul>
                <li className="manual-step u-step"><span className="num">1</span>현재 비밀번호 입력</li>
                <li className="manual-step u-step"><span className="num">2</span>새 비밀번호 입력</li>
                <li className="manual-step u-step"><span className="num">3</span>새 비밀번호 확인 입력</li>
                <li className="manual-step u-step"><span className="num">4</span><b>비밀번호 변경</b> 버튼 클릭</li>
              </ul>
            </div>
          </div>
        </section>
      </>
    </ManualLayout>
  );
}
