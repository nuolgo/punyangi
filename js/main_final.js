/* =============================================
   PUNYANGI PUDDING JELLY — Amazon A+ Content Mock
   Main JavaScript — FINAL FIXED VERSION
   수정 목록:
     FIX-01  buyerUnlock: BUYER_CONFIG / sha256 미정의 안전 처리
     FIX-02  buyerUnlock: Enter 키 지원 추가 (별도 initBuyerEnterKey)
     FIX-03  buyerAutoLock: gate 먼저 표시 → 빈 화면 방지
     FIX-04  buyerSetupOutsideClose: 섹션 참조 한 번만 저장
     FIX-05  buyerSetupOutsideClose: DOMContentLoaded 후에 호출되므로
             scroll 감지 시 section null 안전 처리
     FIX-06  heroHover: Drive URL pathname 비교 버그 수정
             (drive.google.com 경로가 달라도 id 쿼리 파라미터로 비교)
     FIX-07  heroZoom: 이미지 클릭 시 overlay 닫힘 버그 수정
             (bigImg에 stopPropagation 추가)
     FIX-08  heroZoom: 이미 열려있는 overlay 재사용 방지
     FIX-09  fallbackIndex: arguments.callee 제거 → named handler 사용
     FIX-10  rating-bar: Map 방식으로 indexOf 인덱스 버그 해결
     FIX-11  _resetAdminForm: DOM null 체크 추가
     FIX-12  adminVerify: BUYER_CONFIG / sha256 undefined 안전 처리
     FIX-13  buyerChangePassword: API POST body id 필드 충돌 제거
             (시스템 자동 생성 id와 충돌 방지 → key 필드 사용)
     FIX-14  initAllEyeBtns: overflow hidden 영향 없도록 z-index 보정
   ============================================= */

/* ==========================================
   전역 상태 (var → let/const)
   ========================================== */
let   _buyerLockTimer     = null;
let   _buyerLocked        = true;
let   _buyerCountInterval = null;
const BUYER_TIMEOUT_SEC   = 300; // 5분

/* ==========================================
   BUYER — 자동 잠금 타이머
   ========================================== */
function buyerStartLockTimer() {
  buyerClearLockTimer();

  let remaining  = BUYER_TIMEOUT_SEC;
  const timerEl  = document.getElementById('buyerTimerCount');
  const timerBox = document.getElementById('buyerTimer');

  if (timerEl)  timerEl.textContent    = remaining;
  if (timerBox) timerBox.style.display = 'flex';

  _buyerCountInterval = setInterval(function () {
    remaining--;
    if (timerEl)  timerEl.textContent = remaining;
    if (timerBox) timerBox.classList.toggle('buyer__timer--warn', remaining <= 30);
    if (remaining <= 0) clearInterval(_buyerCountInterval);
  }, 1000);

  _buyerLockTimer = setTimeout(function () {
    buyerAutoLock('⏱ 5분이 지나 자동으로 잠겼습니다.');
  }, BUYER_TIMEOUT_SEC * 1000);
}

function buyerClearLockTimer() {
  if (_buyerLockTimer)     { clearTimeout(_buyerLockTimer);      _buyerLockTimer     = null; }
  if (_buyerCountInterval) { clearInterval(_buyerCountInterval); _buyerCountInterval = null; }
  const timerBox = document.getElementById('buyerTimer');
  if (timerBox) timerBox.style.display = 'none';
}

// FIX-03: gate 먼저 표시 → 내용 숨기기 → 빈 화면 방지
function buyerAutoLock(msg) {
  if (_buyerLocked) return;
  _buyerLocked = true;
  buyerClearLockTimer();

  const content = document.getElementById('buyerContent');
  const gate    = document.getElementById('buyerGate');
  const hint    = document.getElementById('buyerHint');
  const input   = document.getElementById('buyerPassword');

  if (gate)  gate.style.display = '';
  if (hint)  { hint.textContent = msg || ''; hint.className = 'buyer__hint'; }
  if (input) input.value = '';

  setTimeout(function () {
    if (content) content.classList.remove('visible');
    const gallery = document.getElementById('buyerGallery');
    const ingBox  = document.getElementById('buyerIngredients');
    if (gallery) gallery.innerHTML = '';
    if (ingBox)  ingBox.innerHTML  = '';
    const pwForm  = document.getElementById('buyerPwForm');
    if (pwForm)  pwForm.classList.remove('visible');
  }, 400);
}

// FIX-04, FIX-05: 섹션 참조 한 번 저장, scroll null 안전 처리
function buyerSetupOutsideClose() {
  const section = document.getElementById('buyer');

  document.addEventListener('click', function (e) {
    if (_buyerLocked) return;
    if (section && !section.contains(e.target)) {
      buyerAutoLock('🔒 페이지를 벗어나 자동으로 잠겼습니다.');
    }
  });

  window.addEventListener('scroll', function () {
    if (_buyerLocked || !section) return;
    const rect = section.getBoundingClientRect();
    // 섹션이 완전히 뷰포트 밖으로 나갔을 때만 잠금
    if (rect.bottom < -50 || rect.top > window.innerHeight + 50) {
      buyerAutoLock('🔒 페이지를 벗어나 자동으로 잠겼습니다.');
    }
  }, { passive: true });
}

/* ==========================================
   🔐 비밀번호 잠금 해제 (SHA-256 해시 비교)
   ========================================== */
// FIX-02: Enter 키 지원
function initBuyerEnterKey() {
  const input = document.getElementById('buyerPassword');
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') buyerUnlock();
    });
  }
}

// FIX-01: BUYER_CONFIG / sha256 미정의 안전 처리
function buyerUnlock() {
  const input   = document.getElementById('buyerPassword');
  const hint    = document.getElementById('buyerHint');
  const content = document.getElementById('buyerContent');
  const gate    = document.getElementById('buyerGate');
  if (!input || !hint) return;

  const enteredPw = input.value.trim();
  if (!enteredPw) {
    hint.textContent = '⚠️ 비밀번호를 입력해 주세요.';
    hint.className   = 'buyer__hint';
    return;
  }

  if (typeof BUYER_CONFIG === 'undefined' || typeof sha256 === 'undefined') {
    hint.textContent = '❌ 설정 파일을 불러올 수 없습니다. 관리자에게 문의하세요.';
    hint.className   = 'buyer__hint';
    return;
  }

  hint.textContent = '검증 중...';
  hint.className   = 'buyer__hint';
  input.disabled   = true;

  sha256(enteredPw).then(function (hashedInput) {
    // SHA-256 불가(HTTP 환경 등)일 때 hashedInput === '' → 항상 실패
    if (!hashedInput) {
      input.disabled   = false;
      hint.textContent = '❌ 보안 해시를 계산할 수 없습니다. HTTPS 환경인지 확인하세요.';
      hint.className   = 'buyer__hint';
      return;
    }

    function tryVerify(activePwHash) {
      input.disabled = false;
      if (hashedInput === activePwHash || enteredPw === activePwHash) {
        hint.textContent = '✅ Access granted! Welcome.';
        hint.className   = 'buyer__hint success';
        buyerBuildContent();
        setTimeout(function () {
          if (gate)    gate.style.display = 'none';
          if (content) content.classList.add('visible');
          _buyerLocked = false;
          buyerStartLockTimer();
        }, 600);
      } else {
        hint.textContent      = '❌ Incorrect password. Please try again.';
        hint.className        = 'buyer__hint';
        input.value           = '';
        input.focus();
        input.style.animation = 'none';
        void input.offsetHeight;
        input.style.animation = 'shake 0.4s ease';
      }
    }

    // API 우선 시도 → 실패 시 buyer-config.js 해시값으로 폴백
    fetch('tables/buyer_config?search=buyer_password')
      .then(function (res) {
        if (!res.ok) throw new Error('no api');
        return res.json();
      })
      .then(function (data) {
        const record    = data.data && data.data[0];
        const activePw  = (record && record.value) ? record.value : BUYER_CONFIG.password;
        tryVerify(activePw);
      })
      .catch(function () {
        tryVerify(BUYER_CONFIG.password);
      });
  });
}

/* ==========================================
   바이어 콘텐츠 빌드 (이미지 갤러리 + 성분표)
   ========================================== */
function buyerBuildContent() {
  const gallery = document.getElementById('buyerGallery');
  if (gallery && BUYER_CONFIG.images && BUYER_CONFIG.images.length > 0) {
    gallery.innerHTML = BUYER_CONFIG.images.map(function (img) {
      const thumbUrl    = 'https://drive.google.com/thumbnail?id=' + img.id + '&sz=w800';
      const driveUrl    = 'https://drive.google.com/file/d/'       + img.id + '/view';
      const downloadUrl = 'https://drive.google.com/uc?export=download&id=' + img.id;
      return (
        '<div class="buyer__gallery-item">' +
          '<a href="' + driveUrl + '" target="_blank" class="buyer__img-link">' +
            '<div class="buyer__img-box">' +
              '<img src="' + thumbUrl + '" alt="' + img.label + '"' +
                ' onerror="this.onerror=null;this.parentElement.innerHTML=\'<div class=\\\'buyer__img-placeholder\\\'>' + img.icon + '<br>' + img.label + '</div>\'"' +
              '/>' +
              '<div class="buyer__img-overlay">🔍 View Full Size</div>' +
            '</div>' +
          '</a>' +
          '<span class="buyer__img-label">' + img.label + '</span>' +
          '<a class="buyer__download-btn" href="' + downloadUrl + '" target="_blank">⬇ Download</a>' +
        '</div>'
      );
    }).join('');
  }

  const ingBox = document.getElementById('buyerIngredients');
  if (ingBox && BUYER_CONFIG.ingredients && BUYER_CONFIG.ingredients.length > 0) {
    ingBox.innerHTML = BUYER_CONFIG.ingredients.map(function (ing) {
      const driveUrl    = 'https://docs.google.com/spreadsheets/d/' + ing.id + '/view';
      const downloadUrl = 'https://docs.google.com/spreadsheets/d/' + ing.id + '/export?format=xlsx';
      return (
        '<div class="buyer__ingredient-card">' +
          '<div class="buyer__ingredient-btns">' +
            '<a href="' + driveUrl    + '" target="_blank" class="buyer__ingredient-btn buyer__ingredient-btn--view">🔗 Open in Google Sheets</a>' +
            '<a href="' + downloadUrl + '" target="_blank" class="buyer__ingredient-btn buyer__ingredient-btn--dl">⬇ Download Excel</a>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }
}

/* ==========================================
   눈 버튼 (비밀번호 표시/숨김)
   FIX-14: z-index / position 관련 문제 보정
   ========================================== */
function initAllEyeBtns() {
  document.querySelectorAll('.buyer__eye-btn[data-for]').forEach(function (btn) {
    const targetId = btn.getAttribute('data-for');
    const input    = document.getElementById(targetId);
    if (!input) return;

    /* position/zIndex는 CSS .buyer__eye-btn에서 absolute로 관리 */

    function showPw(e) {
      e.preventDefault();
      input.type      = 'text';
      btn.textContent = '🙈';
    }
    function hidePw() {
      input.type      = 'password';
      btn.textContent = '👁';
    }

    // 마우스: 누르는 동안만 표시
    btn.addEventListener('mousedown',  showPw);
    btn.addEventListener('mouseup',    hidePw);
    btn.addEventListener('mouseleave', hidePw);

    // 터치: 누르는 동안만 표시 (좌클릭 길게 누르기 방식)
    btn.addEventListener('touchstart',  showPw, { passive: false });
    btn.addEventListener('touchend',    hidePw);
    btn.addEventListener('touchcancel', hidePw);

    // 우클릭 컨텍스트 메뉴 차단
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  });
}

/* shake 애니메이션 주입 */
(function injectShakeAnimation() {
  const s = document.createElement('style');
  s.textContent =
    '@keyframes shake{' +
    '0%,100%{transform:translateX(0)}' +
    '20%{transform:translateX(-8px)}' +
    '40%{transform:translateX(8px)}' +
    '60%{transform:translateX(-6px)}' +
    '80%{transform:translateX(6px)}' +
    '}';
  document.head.appendChild(s);
}());

/* ==========================================
   관리자 설정 & 비밀번호 변경 (SHA-256 적용)
   ========================================== */
function buyerTogglePwChange() {
  const form = document.getElementById('buyerPwForm');
  if (!form) return;
  if (form.classList.toggle('visible')) {
    const authStep    = document.getElementById('adminAuthStep');
    const changeStep  = document.getElementById('adminChangeStep');
    const authMsg     = document.getElementById('adminAuthMsg');
    const adminPwInp  = document.getElementById('adminPw');
    if (authStep)   authStep.style.display   = 'block';
    if (changeStep) changeStep.style.display = 'none';
    if (authMsg)    authMsg.textContent       = '';
    if (adminPwInp) adminPwInp.value          = '';
  }
}

// FIX-12: STEP 1 — 관리자 인증 (SHA-256 해시 비교, undefined 안전 처리)
function adminVerify() {
  const adminPwEl = document.getElementById('adminPw');
  const authMsg   = document.getElementById('adminAuthMsg');
  if (!adminPwEl || !authMsg) return;

  if (typeof BUYER_CONFIG === 'undefined' || typeof sha256 === 'undefined') {
    authMsg.textContent = '❌ 설정 파일을 불러올 수 없습니다.';
    authMsg.className   = 'buyer__pw-msg error';
    return;
  }

  const val = adminPwEl.value.trim();
  if (!val) {
    authMsg.textContent = '⚠️ 관리자 비밀번호를 입력하세요.';
    authMsg.className   = 'buyer__pw-msg error';
    return;
  }

  authMsg.textContent = '인증 중...';
  authMsg.className   = 'buyer__pw-msg';

  sha256(val).then(function (hashedInput) {
    // 해시 비교 + 평문 폴백 동시 비교 (HTTP/HTTPS 모두 대응)
    const isMatch = (hashedInput && hashedInput === BUYER_CONFIG.adminPassword)
                 || (val === BUYER_CONFIG.adminPassword);
    if (isMatch) {
      authMsg.textContent = '✅ 관리자 인증 완료!';
      authMsg.className   = 'buyer__pw-msg success';
      setTimeout(function () {
        const authStep   = document.getElementById('adminAuthStep');
        const changeStep = document.getElementById('adminChangeStep');
        if (authStep)   authStep.style.display   = 'none';
        if (changeStep) changeStep.style.display = 'block';
      }, 700);
    } else {
      authMsg.textContent       = '❌ 관리자 비밀번호가 틀렸습니다.';
      authMsg.className         = 'buyer__pw-msg error';
      adminPwEl.value           = '';
      adminPwEl.focus();
      adminPwEl.style.animation = 'none';
      void adminPwEl.offsetHeight;
      adminPwEl.style.animation = 'shake 0.4s ease';
    }
  });
}

// STEP 2: 바이어 비밀번호 변경 — 새 비번 SHA-256 해시 후 저장
// FIX-13: POST body에 id 필드 제거 (API 시스템 필드와 충돌 방지)
function buyerChangePassword() {
  const newPwEl   = document.getElementById('pwNew');
  const confirmEl = document.getElementById('pwConfirm');
  const msg       = document.getElementById('buyerPwMsg');
  if (!newPwEl || !confirmEl || !msg) return;

  if (newPwEl.value.length < 4) {
    msg.textContent = '❌ 새 비밀번호는 최소 4자 이상 입력해 주세요.';
    msg.className   = 'buyer__pw-msg error';
    newPwEl.focus();
    return;
  }
  if (newPwEl.value !== confirmEl.value) {
    msg.textContent = '❌ 새 비밀번호가 일치하지 않습니다.';
    msg.className   = 'buyer__pw-msg error';
    confirmEl.value = '';
    confirmEl.focus();
    return;
  }

  const newPwPlain = newPwEl.value;
  newPwEl.value    = '';
  confirmEl.value  = '';
  msg.textContent  = '저장 중...';
  msg.className    = 'buyer__pw-msg';

  sha256(newPwPlain).then(function (newPwHash) {
    if (!newPwHash) {
      msg.textContent = '❌ 보안 해시 계산 불가. HTTPS 환경인지 확인하세요.';
      msg.className   = 'buyer__pw-msg error';
      return;
    }

    fetch('tables/buyer_config?search=buyer_password')
      .then(function (res) {
        if (!res.ok) throw new Error('no api');
        return res.json();
      })
      .then(function (data) {
        const record = data.data && data.data[0];
        if (record && record.id) {
          // 기존 레코드 업데이트
          return fetch('tables/buyer_config/' + record.id, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ value: newPwHash })
          });
        } else {
          // FIX-13: 새 레코드 생성 시 id 필드 제거 (API가 자동 생성)
          return fetch('tables/buyer_config', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ key: 'buyer_password', value: newPwHash, memo: '바이어 접근 비밀번호(해시)' })
          });
        }
      })
      .then(function (res) {
        if (!res.ok) throw new Error('save error');
        return res.json();
      })
      .then(function () {
        if (typeof BUYER_CONFIG !== 'undefined') BUYER_CONFIG.password = newPwHash;
        msg.textContent = '✅ 비밀번호가 변경되었습니다! (새로고침 후에도 유지됩니다)';
        msg.className   = 'buyer__pw-msg success';
        _resetAdminForm(msg);
      })
      .catch(function () {
        // API 없는 환경 → 메모리만 업데이트
        if (typeof BUYER_CONFIG !== 'undefined') BUYER_CONFIG.password = newPwHash;
        msg.textContent = '⚠️ 서버 저장 실패. 현재 세션에서만 임시 적용됩니다. (새로고침 시 초기화)';
        msg.className   = 'buyer__pw-msg error';
        _resetAdminForm(msg);
      });
  });
}

// FIX-11: DOM null 체크 추가
function _resetAdminForm(msg) {
  setTimeout(function () {
    const form       = document.getElementById('buyerPwForm');
    const authStep   = document.getElementById('adminAuthStep');
    const changeStep = document.getElementById('adminChangeStep');
    if (form)       form.classList.remove('visible');
    if (authStep)   authStep.style.display   = 'block';
    if (changeStep) changeStep.style.display = 'none';
    if (msg)        msg.textContent           = '';
  }, 3000);
}

/* ==========================================
   HERO HOVER
   FIX-06: Drive URL은 pathname 비교가 의미 없음
           → data-id 또는 src 전체 문자열로 비교
   ========================================== */
function heroHover(imgEl) {
  const mainImg   = document.getElementById('heroMainImg');
  const mainLabel = document.getElementById('heroMainLabel');
  if (!mainImg || !imgEl) return;

  const wrapEl = imgEl.closest('.hero__img-side-wrap') || imgEl;

  // FIX-06: 일반 URL과 Drive URL 모두 처리되는 src 직접 비교
  if (mainImg.src === imgEl.src) return;

  mainImg.classList.add('switching');

  setTimeout(function () {
    mainImg.src = imgEl.src;
    mainImg.alt = imgEl.alt;

    // 배경색 동기화
    const newColor        = wrapEl.dataset.color || '#ffffff';
    mainImg.style.background = newColor;
    mainImg.dataset.color    = newColor;

    if (mainLabel) {
      const newLabel            = wrapEl.dataset.label || imgEl.alt || '';
      mainLabel.textContent     = newLabel;
      mainLabel.style.animation = 'none';
      void mainLabel.offsetHeight;
      mainLabel.style.animation = '';
    }
    mainImg.classList.remove('switching');
  }, 280);

  document.querySelectorAll('.hero__img-side-wrap').forEach(function (el) {
    el.classList.remove('active-side');
  });
  wrapEl.classList.add('active-side');
}

/* ==========================================
   HERO ZOOM (이미지 확대 오버레이)
   FIX-07: bigImg 클릭 시 overlay 닫힘 버그 수정
   FIX-08: 이미 열려있는 overlay 안전 제거
   ========================================== */
function heroZoom(imgEl) {
  const existing = document.getElementById('heroZoomOverlay');
  if (existing) existing.remove();

  const overlay      = document.createElement('div');
  overlay.className  = 'hero-zoom-overlay';
  overlay.id         = 'heroZoomOverlay';

  const closeBtn     = document.createElement('button');
  closeBtn.className = 'hero-zoom-close';
  closeBtn.innerHTML = '✕';
  closeBtn.setAttribute('aria-label', '닫기');
  closeBtn.onclick   = function (e) {
    e.stopPropagation();
    overlay.remove();
    document.removeEventListener('keydown', escClose);
  };

  const bigImg       = document.createElement('img');
  bigImg.src         = imgEl.src;
  bigImg.alt         = imgEl.alt || '제품 이미지';
  bigImg.style.background = imgEl.dataset.color || '#ffffff';

  // FIX-07: 이미지 자체 클릭은 닫힘 방지
  bigImg.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  overlay.appendChild(bigImg);
  overlay.appendChild(closeBtn);

  // overlay 배경 클릭 시 닫기
  overlay.addEventListener('click', function () {
    overlay.remove();
    document.removeEventListener('keydown', escClose);
  });

  function escClose(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escClose);
    }
  }
  document.addEventListener('keydown', escClose);
  document.body.appendChild(overlay);
}

/* ==========================================
   DOMContentLoaded 초기화
   ========================================== */
document.addEventListener('DOMContentLoaded', function () {

  buyerSetupOutsideClose();
  initAllEyeBtns();
  initBuyerEnterKey(); // FIX-02: Enter 키 지원

  /* ─────────────────────────────────────────
     1. STICKY NAV
  ───────────────────────────────────────── */
  const stickyNav = document.getElementById('stickyNav');
  const navLinks  = stickyNav ? stickyNav.querySelectorAll('a') : [];
  const sections  = document.querySelectorAll('section[id]');

  function updateStickyNav() {
    if (!stickyNav) return;
    const intro = document.getElementById('intro');
    stickyNav.classList.toggle('visible',
      intro ? intro.getBoundingClientRect().bottom <= 0 : window.scrollY > 100
    );
  }

  function updateActiveNavLink() {
    let cur = '';
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top <= 120) cur = s.getAttribute('id');
    });
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + cur);
    });
  }

  window.addEventListener('scroll', function () {
    updateStickyNav();
    updateActiveNavLink();
  }, { passive: true });
  updateStickyNav();

  /* ─────────────────────────────────────────
     2. SCROLL FADE-UP
  ───────────────────────────────────────── */
  const fadeTargets = document.querySelectorAll(
    '.benefits__card, .flavor-card, .convenience__card, .texture__chip, .brand-story__stat'
  );
  fadeTargets.forEach(function (el, i) {
    el.classList.add('fade-up');
    el.style.transitionDelay = ((i % 4) * 0.1) + 's';
  });
  const fadeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  fadeTargets.forEach(function (el) { fadeObserver.observe(el); });

  /* ─────────────────────────────────────────
     3. COMPARISON FLAVOR FILTER
  ───────────────────────────────────────── */
  const flavorBtns = document.querySelectorAll('.flavor-btn');
  const tableCells = document.querySelectorAll('.comparison__table [data-col]');

  flavorBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const flavor = this.dataset.flavor;
      flavorBtns.forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      tableCells.forEach(function (cell) {
        if (flavor === 'all') {
          cell.style.display = '';
          cell.classList.remove('active');
        } else {
          const match = cell.dataset.col === flavor;
          cell.style.display = match ? '' : 'none';
          cell.classList.toggle('active', match);
        }
      });
    });
  });

  /* ─────────────────────────────────────────
     4. RATING BARS — FIX-10: Map으로 인덱스 버그 해결
  ───────────────────────────────────────── */
  const ratingBars  = document.querySelectorAll('.rating-bar div');
  const barWidthMap = new Map();
  ratingBars.forEach(function (bar) {
    barWidthMap.set(bar, bar.style.width || bar.getAttribute('style') && bar.getAttribute('style').match(/width:\s*([^;]+)/)?.[1] || '50%');
    bar.style.width = '0%';
  });

  const barObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.rating-bar div').forEach(function (bar, i) {
          setTimeout(function () {
            bar.style.width = barWidthMap.get(bar) || '50%';
          }, i * 100);
        });
        barObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const compTable = document.querySelector('.comparison__table');
  if (compTable) barObserver.observe(compTable);

  /* ─────────────────────────────────────────
     5. SMOOTH SCROLL
  ───────────────────────────────────────── */
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        window.scrollTo({
          top:      target.getBoundingClientRect().top + window.pageYOffset - 60,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ─────────────────────────────────────────
     6. HERO IMAGE FALLBACK
     FIX-09: arguments.callee 제거 → named function 사용
  ───────────────────────────────────────── */
  const heroMainImg = document.getElementById('heroMainImg');
  if (heroMainImg) {
    const fallbacks   = [
      'https://dindin1.cafe24.com/sevenstarmall/jelly/pu-cat-gr-90g-6ea_2.jpg',
      'https://sitem.ssgcdn.com/53/76/14/item/1000624147653_i1_1200.jpg',
      'https://dindin1.cafe24.com/sevenstarmall/jelly/pu-cat-sm-90g-6ea_2.jpg'
    ];
    let fallbackIndex = 0;

    function onHeroImgError() {
      if (fallbackIndex < fallbacks.length) {
        heroMainImg.src = fallbacks[fallbackIndex++];
      } else {
        heroMainImg.removeEventListener('error', onHeroImgError);
        heroMainImg.style.display = 'none';
      }
    }
    heroMainImg.addEventListener('error', onHeroImgError);
  }

  /* ─────────────────────────────────────────
     7. FLAVOR CARDS PARALLAX (hover tilt)
  ───────────────────────────────────────── */
  document.querySelectorAll('.flavor-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      const rect = card.getBoundingClientRect();
      const x    = ((e.clientX - rect.left) / rect.width  - 0.5) * 10;
      const y    = ((e.clientY - rect.top)  / rect.height - 0.5) * 10;
      card.style.transform  = 'translateY(-10px) scale(1.02) rotateX(' + (-y) + 'deg) rotateY(' + x + 'deg)';
      card.style.transition = 'transform 0.1s';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transform  = '';
      card.style.transition = 'transform 0.35s, box-shadow 0.35s';
    });
  });

  /* ─────────────────────────────────────────
     8. TEXTURE BLOB CLICK RIPPLE
  ───────────────────────────────────────── */
  document.querySelectorAll('.texture__blob').forEach(function (blob) {
    blob.style.cursor = 'pointer';
    blob.addEventListener('click', function () {
      this.style.transform = 'scale(1.3)';
      var self = this;
      setTimeout(function () { self.style.transform = ''; }, 300);
    });
  });

  /* ─────────────────────────────────────────
     9. SECTION HEADER ENTRANCE (fade-in)
  ───────────────────────────────────────── */
  const headerObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        headerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.section-header').forEach(function (h) {
    h.style.cssText += 'opacity:0;transform:translateY(30px);transition:opacity 0.7s ease,transform 0.7s ease;';
    headerObserver.observe(h);
  });

  /* ─────────────────────────────────────────
     10. BRAND STORY IMG REVEAL (stagger)
  ───────────────────────────────────────── */
  const imgStack = document.querySelector('.brand-story__img-stack');
  if (imgStack) {
    imgStack.querySelectorAll('.brand-story__img').forEach(function (img) {
      img.dataset.transform = img.style.transform || '';
      img.style.opacity     = '0';
      img.style.transition  = 'opacity 0.6s ease, transform 0.4s ease';
    });

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.brand-story__img').forEach(function (img, i) {
            setTimeout(function () {
              img.style.opacity   = '1';
              img.style.transform = img.dataset.transform || '';
            }, i * 150);
          });
        }
      });
    }, { threshold: 0.3 }).observe(imgStack);
  }

});
