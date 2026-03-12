// components/manual/ProfessorManual.js
// 목적: 교수 전용 매뉴얼 화면 (공용 로그인/비번 변경은 제외)
// 변경 요약:
//  - 이미지 위치 참조가 필요한 곳은 학생 매뉴얼 방식의 step 배지(.num)로만 번호 표기
//  - 중복 번호 문장(①, 1. 등) 제거
//  - 불필요한 start 속성/중첩 리스트 정리
//  - [추가] 하위 메뉴 클릭 스크롤 + 스크롤스파이(바텀 라인 기준, ESLint 안전)

import React, { useEffect } from "react";
import ManualLayout from "./ManualLayout";
import "./CommonManual.css";
import "./ProfessorManual.css";

import courseCreate1 from './png/course-create1.png';
import courseCreate2 from './png/course-create2.png';
import courseEditImg   from "./png/course-edit.png";
import courseDeleteImg from "./png/course-delete.png";
import problemCreate from './png/problem-create.png';
import problemCreateDetailImg   from "./png/problem-create-detail.png";
import problemEditImg from "./png/problem-edit.png";
import userEnrollImg from './png/user-enroll.png';
import submitScoreOverview from "./png/submit-score-overview.png";
import submitUserDetail    from "./png/submit-user-detail.png";
import submitTestcaseStatus from "./png/submit-testcase-status.png";
import bankImg1 from "./png/1.png";
import bankImg2 from "./png/2.png";


export default function ProfessorManual() {
  const sidebarItems = [
    { href: "/manual/professor_manual/course", label: "강좌" },
    { href: "/manual/professor_manual/course-create", label: "생성" },
    { href: "/manual/professor_manual/course-edit", label: "수정" },
    { href: "/manual/professor_manual/course-delete", label: "삭제" },
    { href: "/manual/professor_manual/problem", label: "문제" },
    { href: "/manual/professor_manual/problem-create", label: "생성" },
    { href: "/manual/professor_manual/problem-edit", label: "수정" },
    { href: "/manual/professor_manual/problem-delete", label: "삭제" },
    { href: "/manual/professor_manual/user", label: "유저" },
    { href: "/manual/professor_manual/user-enroll", label: "수강 신청 관리" },
    { href: "/manual/professor_manual/user-pw-reset", label: "학생 PW 초기화" },
    { href: "/manual/professor_manual/submit", label: "제출" },
    { href: "/manual/professor_manual/submit-list", label: "제출 현황" },
    { href: "/manual/professor_manual/submit-user", label: "유저별 세부 현황" },
    { href: "/manual/professor_manual/submit-problem", label: "문제별 통과 여부" },
    { href: "/manual/professor_manual/bank", label: "문제 은행" },
    { href: "/manual/professor_manual/bank-mine", label: "내 문제" },
    { href: "/manual/professor_manual/bank-others", label: "다른 사람 문제" },
  ];

  useEffect(() => {
    const BASE = "/manual/professor_manual";
    const root = document.body;
    const GROUPS = ["course", "problem", "user", "submit", "bank"];

    // slug <-> id 매핑 (하위 스크롤용만 유지)
    const slugToId = {
      "course-create":  "course-create",
      "course-edit":    "course-edit",
      "course-delete":  "course-delete",
      "problem-create": "problem-create",
      "problem-edit":   "problem-edit",
      "problem-delete": "problem-delete",
      "user-enroll":    "user-enroll",
      "user-pw-reset":  "user-password",   // 과거 링크 호환
      "user-password":  "user-password",
      "submit-list":    "submit-list",
      "submit-user":    "submit-user",
      "submit-problem": "submit-problem",
      "bank-mine":      "bank-mine",
      "bank-others":    "bank-others",
    };
    const idToSlug = Object.fromEntries(
      Object.entries(slugToId).map(([slug, id]) => [id, slug])
    );

    // 그룹 판별
    const groupOfSlug = (slug) =>
      slug?.startsWith("course") ? "course" :
      slug?.startsWith("problem") ? "problem" :
      slug?.startsWith("user") ? "user" :
      slug?.startsWith("submit") ? "submit" :
      slug?.startsWith("bank") ? "bank" : null;

    const groupOfId = (id) => groupOfSlug(idToSlug[id] || id);

    // 펼침상태/활성화 (상위 항목만)
    const collapseAll = () => {
      GROUPS.forEach(g => root.classList.remove(`expand-${g}`));
      root.removeAttribute("data-view");
      // 상위 링크의 상태 리셋
      const all = document.querySelectorAll('.manual-sidebar-menu a[href^="/manual/professor_manual/"], .u-sidebar-menu a[href^="/manual/professor_manual/"]');
      all.forEach(a => {
        if ([`${BASE}/course`, `${BASE}/problem`, `${BASE}/user`, `${BASE}/submit`, `${BASE}/bank`].includes(a.getAttribute("href"))) {
          a.classList.remove("is-active");
          a.setAttribute("aria-expanded", "false");
        }
      });
    };

    const setExpanded = (group) => {
      if (!group) return;
      if (!root.classList.contains(`expand-${group}`)) {
        collapseAll();
        root.classList.add(`expand-${group}`);
        root.setAttribute("data-view", group);
      }
      // 상위 항목만 활성화
      const selector = `a[href="${BASE}/${group}"]`;
      document.querySelectorAll(`.manual-sidebar-menu ${selector}, .u-sidebar-menu ${selector}`).forEach(a => {
        a.classList.add("is-active");
        a.setAttribute("aria-expanded", "true");
      });
    };

    // 하위 경로용 스크롤
    let programmaticScrollUntil = 0;
    const scrollToSlug = (slug) => {
      const id = slugToId[slug] || slug;
      const el = document.getElementById(id);
      if (el) {
        programmaticScrollUntil = Date.now() + 900;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // 클릭 위임
    const onDelegatedClick = (e) => {
      // 하위 항목 클릭
      const sub = e.target.closest(
        `a[href^="${BASE}/"]:not([href="${BASE}/course"]):not([href="${BASE}/problem"]):not([href="${BASE}/user"]):not([href="${BASE}/submit"]):not([href="${BASE}/bank"])`
      );
      if (sub) {
        e.preventDefault();
        const ap = new URL(sub.href, window.location.origin).pathname;
        const slug = ap.replace(`${BASE}/`, "");
        const grp  = groupOfSlug(slug);
        setExpanded(grp);              // 상위만 활성화
        if (window.location.pathname !== ap) {
          window.history.pushState(null, "", ap);
        }
        scrollToSlug(slug);
        return;
      }

      // 상위 그룹 클릭
      const top = e.target.closest(
        `a[href="${BASE}/course"], a[href="${BASE}/problem"], a[href="${BASE}/user"], a[href="${BASE}/submit"], a[href="${BASE}/bank"]`
      );
      if (!top) return;
      e.preventDefault();

      const group = new URL(top.href, window.location.origin).pathname.split("/").pop();
      const isAlready = root.classList.contains(`expand-${group}`);
      if (isAlready) { collapseAll(); return; }

      setExpanded(group);
      const first =
        group === "user"   ? `${BASE}/user-enroll` :
        group === "submit" ? `${BASE}/submit-list` :
        group === "bank"   ? `${BASE}/bank-mine` :
                             `${BASE}/${group}-create`;

      if (window.location.pathname !== first) {
        window.history.pushState(null, "", first);
      }
      scrollToSlug(first.replace(`${BASE}/`, ""));
    };
    document.addEventListener("click", onDelegatedClick);

    // 초기 동기화
    collapseAll();
    let slug = window.location.pathname.replace(`${BASE}/`, "");
    if (!slug || !/^(course|problem|user|submit|bank)/.test(slug)) {
      window.history.replaceState(null, "", `${BASE}/course-create`);
      slug = "course-create";
    }
    setExpanded(groupOfSlug(slug));
    scrollToSlug(slug);

    // 스크롤 스파이(상위만 갱신)
    const TOP_OFFSET = 100;
    const isVisible = (el) => !!el && (el.offsetParent !== null || el.getClientRects().length > 0);
    const getVisibleSections = () =>
      Array.from(document.querySelectorAll(".manual-section.u-section")).filter(isVisible);

    let ticking = false;
    const onScroll = () => {
      if (Date.now() < programmaticScrollUntil) return;
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        ticking = false;

        const sections = getVisibleSections();
        if (sections.length === 0) return;

        const lineTop = (window.scrollY || window.pageYOffset) + TOP_OFFSET;
        let currentIndex = 0;
        for (let i = 0; i < sections.length; i++) {
          const topAbs = sections[i].getBoundingClientRect().top + window.scrollY;
          if (topAbs <= lineTop) currentIndex = i; else break;
        }
        const currentId = sections[currentIndex].id;
        const grp = groupOfId(currentId);
        setExpanded(grp);   // 경로는 유지, 상위만 활성화
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // 뒤/앞으로가기
    const onPop = () => {
      const s = window.location.pathname.replace(`${BASE}/`, "");
      setExpanded(groupOfSlug(s));
      scrollToSlug(s);
    };
    window.addEventListener("popstate", onPop);

    return () => {
      document.removeEventListener("click", onDelegatedClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("popstate", onPop);
    };
  }, []);


  return (
    <ManualLayout title="교수 매뉴얼" sidebarItems={sidebarItems}>
      <div className="professor-manual u-professor-manual">

        {/* ===== 강좌 그룹 ===== */}
        <section id="course-create" className="manual-section u-section">
          {/* 세트 1 : 강좌 목록 -> '강좌 추가' 진입 */}
          <div className="manual-two-col u-two-col">
            <div className="manual-figure u-figure">
              <div className="img-box">
                <img src={courseCreate1} alt="강좌 목록 화면 - 강좌 추가 버튼" />
              </div>
            </div>
            <div className="manual-steps u-steps">
              <h2>강좌 생성</h2>
              <ul>
                <li className="manual-step u-step">
                  <span><b>강좌 추가</b>를 누르면 강좌 추가 페이지가 열립니다.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 세트 2 : 강좌 추가 폼 → 입력 항목 */}
          <div className="manual-two-col u-two-col u-set">
            <div className="manual-figure u-figure">
              <div className="img-box">
                <img src={courseCreate2} alt="강좌 추가 폼 - 제목/언어/인원 입력" />
              </div>
            </div>
            <div className="manual-steps u-steps">
              <h2>강좌 생성 입력 항목</h2>
              <ul>
                <li className="manual-step u-step"><span className="num">1</span><span><b>강좌 제목</b> : 표시되는 강좌의 명칭입니다.</span></li>
                <li className="manual-step u-step"><span className="num">2</span><span><b>언어</b> : 수업 시간에 사용할 컴퓨터 언어입니다.</span></li>
                <li className="manual-step u-step"><span className="num">3</span><span><b>인원 제한</b> : 수강 인원 제한 수입니다.</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section id="course-edit" className="manual-section u-section">
          <div className="manual-two-col u-two-col">
            <div className="manual-figure u-figure">
              <div className="img-box"><img src={courseEditImg} alt="강좌 수정 화면" /></div>
            </div>
            <div className="manual-steps u-steps">
              <h2>강좌 수정</h2>
              <ul>
                <li className="manual-step u-step"><span className="num">1</span><span>생성된 강좌 우측의 <b>수정</b>을 눌러 변경합니다.</span></li>
                <li className="manual-step u-step"><span className="num">2</span><span>변경 후 <b>완료</b>를 누르면 저장됩니다.</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section id="course-delete" className="manual-section u-section">
          <div className="manual-two-col u-two-col">
            <div className="manual-figure u-figure">
              <div className="img-box"><img src={courseDeleteImg} alt="강좌 삭제 화면" /></div>
            </div>
            <div className="manual-steps u-steps">
              <h2>강좌 삭제</h2>
              <ul>
                <li className="manual-step u-step"><span className="num">1</span><span>생성된 강좌 우측의 <b>삭제</b>를 눌러 삭제합니다.</span></li>
              </ul>
              <span className="manual-note note-align u-note">강좌 삭제 시 하위의 모든 데이터가 함께 삭제됩니다.</span>
            </div>
          </div>
        </section>

        {/* ===== 문제 그룹 ===== */}
        <section id="problem-create" className="manual-section u-section">
          {/* 세트 1 */}
          <div className="manual-two-col u-two-col u-set">
            <div className="manual-figure u-figure">
              <div className="img-box"><img src={problemCreate} alt="문제 생성 화면" /></div>
            </div>
            <div className="manual-steps u-steps">
              <h2>문제 생성</h2>
              <ul>
                <li className="manual-step u-step">
                  <span>강좌 생성 후 문제 목록에 들어가면 <b>문제를 추가</b>할 수 있습니다.</span>
                </li>
              </ul>
              <span className="manual-note u-note">문제를 추가할 시 자동으로 문제 은행에 만든 문제가 저장됩니다.</span>              
            </div>
          </div>

          {/* 세트 2 : 상세 입력 항목 */}
          <div className="manual-two-col u-two-col u-set">
            <div className="manual-figure u-figure">
              <div className="img-box"><img src={problemCreateDetailImg} alt="문제 생성 상세 화면" /></div>
            </div>
            <div className="manual-steps u-steps">
              <h2>문제 생성 입력 항목</h2>
              <ul>
                <li className="manual-step u-step"><span className="num">1</span><span><b>문제 이름</b> : 문제에 표시될 제목입니다.</span></li>
                <li className="manual-step u-step"><span className="num">2</span><span><b>문제 설명</b> : 문제의 세부 내용을 작성하는 곳입니다.</span></li>
                <li className="manual-step u-step"><span className="num">3</span><span><b>배점</b> : 채점 후 학생에게 부여될 점수입니다.</span></li>
                <li className="manual-step u-step"><span className="num">4</span><span><b>정답 함수명</b> : 채점 기준이 되는 함수 이름입니다.</span></li>
                <li className="manual-step u-step"><span className="num">5</span><span><b>문제 제공 코드</b> : 학생에게 기본으로 주어질 코드입니다. <span className="manual-note u-note">정답 함수명과 일치해야 하며 필수 입력은 아닙니다.</span></span></li>
                <li className="manual-step u-step"><span className="num">6</span><span><b>예시 추가</b> : 전체 예시 개수를 늘립니다.</span></li>
                <li className="manual-step u-step"><span className="num">7</span><span><b>예시 행 추가</b> : 예시 인풋 값의 개수를 늘립니다.</span></li>
                <li className="manual-step u-step"><span className="num">8</span><span><b>Tc 추가</b> : 실제 채점에 사용되는 값을 늘립니다.</span></li>
                <li className="manual-step u-step"><span className="num">9</span><span><b>Tc 행 추가</b> : 실제 채점 인풋 값의 개수를 늘립니다.</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section id="problem-edit" className="manual-section u-section">
          <div className="manual-two-col u-two-col u-set">
            <div className="manual-figure u-figure">
              <div className="img-box"><img src={problemEditImg} alt="문제 수정 화면" /></div>
            </div>
            <div className="manual-steps u-steps">
              <h2>문제 수정</h2>
              <ul>
                <li className="manual-step u-step">
                  <span>문제 항목의 <b>문제 수정</b> 버튼을 눌러 수정 화면으로 이동합니다. 필요한 내용을 수정한 후 <b>완료</b>를 누르세요.</span>
                </li>
              </ul>
              <span className="manual-note u-note">문제를 수정할 시 자동으로 문제 은행에 만든 문제가 수정되어 저장됩니다. 만약 문제 은행에서 삭제한 문제일 경우 수정된 문제로 새로 다시 저장됩니다.</span>
            </div>
          </div>
        </section>

        <section id="problem-delete" className="manual-section u-section">
          <div className="manual-two-col u-two-col u-set">
            <div className="manual-figure u-figure">
              <div className="img-box"><img src={problemCreate} alt="문제 삭제 화면" /></div>
            </div>
            <div className="manual-steps u-steps">
              <h2>문제 삭제</h2>
              <ul>
                <li className="manual-step u-step">
                  <span><b>삭제</b> 버튼을 눌러 문제를 삭제합니다.</span>
                </li>
              </ul>
              <span className="manual-note">
                 삭제된 문제는 다시 불러올 수 없습니다.
              </span>
            </div>
          </div>
        </section>
        

        {/* ===== 유저 그룹 ===== */}
        <section id="user-enroll" className="manual-section u-section">
          <div className="manual-two-col u-two-col u-set">
            <div className="manual-figure u-figure">
              <div className="img-box"><img src={userEnrollImg} alt="수강 신청 관리 화면" /></div>
            </div>
            <div className="manual-steps u-steps">
              <h2>수강 신청 관리</h2>
              <ul>
                <li className="manual-step u-step"><span className="num">1</span><span><b>승인</b> : 수업을 듣는 학생이면 <b>승인</b>을 누르세요.</span></li>
                <li className="manual-step u-step"><span className="num">2</span><span><b>거부</b> : 수업 대상이 아니면 <b>거부</b>를 누르세요.</span></li>
                <li className="manual-step u-step"><span className="num">3</span><span><b>제거</b> : 잘못 추가된 경우 <b>제거</b>를 누르세요.</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section id="user-password" className="manual-section u-section">
          <div className="manual-two-col u-two-col u-set">
            <div className="manual-figure u-figure">
              <div className="img-box"><img src={userEnrollImg} alt="학생 비밀번호 초기화 화면" /></div>
            </div>
            <div className="manual-steps u-steps">
              <h2>학생 비밀번호 관리</h2>
              <ul>
                <li className="manual-step u-step">
                  <span>학생이 비밀번호를 잊은 경우, <b>이름(학번)</b>을 확인한 뒤 <b>초기화</b>를 누르세요.</span>
                </li>
              </ul>
              <span className="manual-note"> 초기화 시 비밀번호는 <b>000000</b>으로 설정됩니다. 로그인 후 비밀번호 변경을 권장합니다.</span>
            </div>
          </div>
        </section>

        {/* ===== 제출 그룹 ===== */}
        <section id="submit-list" className="manual-section u-section">
          <div className="manual-two-col u-two-col u-set">
            <div className="manual-figure u-figure">
              <div className="img-box"><img src={submitScoreOverview} alt="유저 제출 총점 확인 화면" /></div>
            </div>
            <div className="manual-steps u-steps">
              <h2>제출 현황</h2>
              <ul>
                <li className="manual-step u-step">
                  <span className="num">1</span>
                  <span>강의를 수강 중인 학생들의 <b>총점</b>을 확인할 수 있습니다.</span>
                </li>
                <li className="manual-step u-step">
                  <span className="num">2</span>
                  <span><b>강좌 전체 점수 내보내기</b> 버튼으로 CSV를 저장할 수 있습니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="submit-user" className="manual-section u-section">
          <div className="manual-two-col u-two-col u-set">
            <div className="manual-figure u-figure">
              <div className="img-box"><img src={submitUserDetail} alt="유저별 제출 현황 화면" /></div>
            </div>
            <div className="manual-steps u-steps">
              <h2>유저별 세부 현황</h2>
              <ul>
                <li className="manual-step u-step">
                  <span className="num">1</span>
                  <span><b>유저</b>를 누르면 해당 유저가 푼 문제, 점수, 제출 상태가 나타납니다.</span>
                </li>
                <li className="manual-step u-step">
                  <span className="num">2</span>
                  <span><b>csv로 내보내기</b>를 통해 <b>문제별 점수</b>를 확인할 수 있습니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="submit-problem" className="manual-section u-section">
          <div className="manual-two-col u-two-col u-set">
            <div className="manual-figure u-figure">
              <div className="img-box"><img src={submitTestcaseStatus} alt="문제별 통과 여부/오류 화면" /></div>
            </div>
            <div className="manual-steps u-steps">
              <h2>문제별 통과 여부</h2>
              <ul>
                <li className="manual-step u-step">
                  <span className="num">1</span>
                  <span><b>문제</b>를 누르면 학생의 코드와 테스트 케이스별 <b>통과 여부</b>가 표시됩니다.</span>
                </li>
              </ul>

            </div>
          </div>
        </section>
        
        {/* ===== 문제은행===== */}
        <section id="bank-mine" className="manual-section u-section">
          <div className="manual-two-col u-two-col u-set">
            <div className="manual-figure u-figure">
              <div className="img-box">
                {/* 임시 이미지: 1.png */}
                <img src={bankImg1} alt="문제은행 - 내 문제 목록 (임시)" />
              </div>
            </div>
            <div className="manual-steps u-steps">
              <h2>내 문제 목록</h2>
              <ul>
                <li className="manual-step u-step">
                  <span className="num">1</span>
                  <span>문제 추가로 생성한 내 문제들이 자동으로 저장되어 있습니다.</span>
                </li>
                <li className="manual-step u-step">
                  <span className="num">2</span>
                  <span>문제 카드를 눌러 <b>상세</b>를 확인합니다. 아래 <b>가져오기 버튼</b>으로 내강좌에 문제를 추가할수 있습니다.</span>
                </li>
                <li className="manual-step u-step">
                  <span className="num">3</span>
                  <span><b>삭제</b>를 누르면 해당 문제가 <b>문제 은행에서 제거</b>됩니다.</span>
                </li>
              </ul>
              <span className="manual-note u-note"> 문제 은행과 강좌의 문제는 별도입니다.</span>
            </div>
          </div>
        </section>
        
        <section id="bank-others" className="manual-section u-section">
          <div className="manual-two-col u-two-col u-set">
            <div className="manual-figure u-figure">
              <div className="img-box">
                {/* 임시 이미지: 2.png */}
                <img src={bankImg2} alt="문제은행 - 다른 사람 문제 목록 (임시)" />
              </div>
            </div>
            <div className="manual-steps u-steps">
              <h2>다른 사람 문제 목록</h2>
              <ul>
                <li className="manual-step u-step">
                  <span className="num">1</span>
                  <span>다른 사람들이 문제 추가로 생성한 문제들이 자동으로 저장되어 있습니다.</span>
                </li>
                <li className="manual-step u-step">
                  <span className="num">2</span>
                  <span>문제 카드를 눌러 <b>상세</b>를 확인합니다. 아래 <b>가져오기 버튼</b>으로 내강좌에 문제를 추가할수 있습니다.</span>
                </li>
              </ul>
              <span className="manual-note u-note">다른사람이 만든  문제는 가져오기만 가능합니다. 문제를 수정할 시 자신이 새로 만든 문제로취급됩니다.</span>
            </div>
          </div>
        </section>

      </div>
    </ManualLayout>
  );
}
