/* =============================================
   BUYER ONLY — 설정 파일 (보안 강화 버전)

   🔐 비밀번호는 SHA-256 해시로 저장됩니다.
      평문 비밀번호가 코드에 노출되지 않습니다.

   🛡️ adminPassword  = 운영자(나)의 비번 해시
                        → 사이트에서 바이어 비번 변경 시 사용

   🛒 password        = 바이어에게 알려주는 비번 해시
                        → 자료실 입장 시 사용

   ✅ 비밀번호 변경 방법:
      아래 sha256() 함수를 콘솔에서 직접 호출하거나,
      https://emn178.github.io/online-tools/sha256.html 에서
      해시값을 생성 후 교체하세요.

   ⚠️  보안 주의:
      이 파일을 GitHub 등 공개 저장소에 올릴 때는
      평문 비밀번호를 절대 주석에 남기지 마세요.
   ============================================= */

const BUYER_CONFIG = {

  // 🛒 바이어 접근 비밀번호 (SHA-256 해시값)
  password: 'ae19736443e641c762e83296a0ce230e6798446a2d01b8a04a5ad5538d84677a',

  // 🛡️ 운영자 비밀번호 (SHA-256 해시값)
  adminPassword: '5b300789ac5ba4a9f5403342fba939e1c5a118be60e0600792159478147df9c2',

  // ✅ 구글 드라이브 제품 이미지 파일 ID
  images: [
    { id: '1oVfRONiLNw0J-4Z8eESWquaIvYwkbFyI', label: 'Shine Muscat', icon: '🍇' },
    { id: '1BFhEtee0sHDghfzs2esMOpw7U_IhY__d', label: 'Peach',        icon: '🍑' },
    { id: '1Nqgem8urRAmmvKMQl7LkDcsL_Z_UYUHp', label: 'Grape',        icon: '🍇' },
    { id: '1Q2LWbYSdJICzCw8ga7GdZmQUI2WPHZEI', label: 'Lime Cola',    icon: '🥤' },
  ],

  // ✅ 성분표 구글 시트 ID
  ingredients: [
    { id: '1PuouPaTWPv_uW8Yuij2auQaITHJsVgja', label: 'Ingredients & Nutrition', icon: '📊' },
  ],

};

/* =============================================
   🔐 SHA-256 해시 유틸리티
   SubtleCrypto API 사용 (모던 브라우저 기본 내장)
   HTTPS 또는 localhost 환경에서만 동작합니다.
   ============================================= */
async function sha256(str) {
  if (window.crypto && window.crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }
  // HTTP 환경 폴백: 평문 반환 (tryVerify에서 평문도 함께 비교)
  return str;
}
