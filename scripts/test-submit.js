// 폼 제출 플로우 테스트 스크립트
const WORKER_URL = 'https://betterlab-analytics.skai8588.workers.dev/submit';

async function testSubmit() {
  const testData = {
    airtableFields: {
      '기업명': '플로우테스트기업',
      '사업자번호': '999-99-99999',
      '대표자명': '테스트담당자',
      '연락처': '010-9999-8888',
      '이메일': 'flowtest@example.com',
      '지역': '서울',
      '업종': 'IT/소프트웨어',
      '설립연도': '2024년',
      '직전년도매출': '1억 미만',
      '통화가능시간': '오전 (09:00~12:00)',
      '필요자금규모': '1억 ~ 3억',
      '자금종류': '창업자금, 운전자금',
      '문의사항': '플로우 테스트 문의입니다.'
    },
    emailFrom: '더나은기업연구소 <noreply@mail.policy-fund.online>',
    customerEmail: 'flowtest@example.com',
    customerSubject: '[더나은기업연구소] 무료진단 신청이 접수되었습니다',
    customerHtml: '<p>고객 이메일 테스트</p>',
    staffEmails: ['skai9@naver.com', 'mkt@polarad.co.kr'],
    staffSubject: '[신규무료진단] 플로우테스트기업 - 무료진단 신청',
    staffHtml: '<p>담당자 이메일 테스트</p>'
  };

  console.log('🚀 테스트 시작...');
  console.log('📤 요청 데이터:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('\n📥 응답 결과:');
    console.log(JSON.stringify(result, null, 2));

    // 결과 분석
    console.log('\n📊 결과 분석:');
    console.log('  - Airtable:', result.airtable?.success ? '✅ 성공' : '❌ 실패', result.airtable?.error || '');
    console.log('  - 고객 이메일:', result.email?.customer?.success ? '✅ 성공' : '❌ 실패', result.email?.customer?.error || '');
    console.log('  - 담당자 이메일:', result.email?.staff?.success ? '✅ 성공' : '❌ 실패', result.email?.staff?.error || '');
    console.log('  - Telegram:', result.telegram?.success ? '✅ 성공' : '❌ 실패', result.telegram?.error || '');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

testSubmit();
