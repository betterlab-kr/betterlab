/**
 * 게시글 썸네일 이미지 생성 스크립트
 * Gemini API를 사용하여 이미지 생성 후 R2 업로드 및 Airtable 업데이트
 */

import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appiCVibf1BnLxKOL';
const R2_PUBLIC_URL = 'https://pub-1872e954c9da49929650d78642a05e08.r2.dev';
const WORKER_URL = 'https://betterlab-analytics.skai8588.workers.dev';

// 게시글 목록 및 이미지 프롬프트
const posts = [
  {
    id: 'recqT8IUXAbPZGIIy',
    title: '2026년 중소기업 정책자금 신규 지원 안내',
    prompt: 'Professional business infographic showing government funding support for small and medium enterprises. Modern blue and white color scheme with Korean won currency symbols, upward growth arrows, and business buildings. Clean corporate style, 16:9 aspect ratio.',
    filename: '2026-policy-fund-overview.jpg'
  },
  {
    id: 'rec77OCoor42r9ZOo',
    title: '소상공인 희망리턴패키지 지원사업 공고',
    prompt: 'Inspirational business restart concept illustration. A small business owner with hope and new beginning symbolism. Warm orange and blue colors, showing transformation from struggle to success. Korean small business theme, professional style, 16:9 aspect ratio.',
    filename: '2026-hope-return-package.jpg'
  },
  {
    id: 'recGwPtnUgpafs5D7',
    title: '2026년 비수도권 균형발전 특별 지원금 안내',
    prompt: 'Map of South Korea highlighting regional development outside Seoul metropolitan area. Modern infographic style showing balanced growth across provinces. Green and blue color scheme representing sustainability and development. Professional government announcement style, 16:9 aspect ratio.',
    filename: '2026-non-capital-region-support.jpg'
  },
  {
    id: 'reckBiYWJJXIMlTE2',
    title: '2026년 K-뷰티 수출지원 프로그램 참가기업 모집',
    prompt: 'Elegant K-Beauty export concept with Korean cosmetics products and global shipping imagery. Pink, gold, and white color palette. Shows Korean beauty products with world map and export arrows. Luxurious yet professional marketing style, 16:9 aspect ratio.',
    filename: '2026-kbeauty-support.jpg'
  },
  {
    id: 'recDMVb6Jt1awrILP',
    title: 'AX(AI 전환) 스프린트 트랙 지원사업 안내',
    prompt: 'Futuristic AI transformation concept for businesses. Neural network visualization, digital transformation icons, and sprint/speed elements. Purple, cyan, and dark blue tech color scheme. Modern technology innovation theme, 16:9 aspect ratio.',
    filename: '2026-ax-sprint-track.jpg'
  },
  {
    id: 'recVBJ7qP8AEsAPUP',
    title: '소상공인 특별경영안정자금 긴급 지원 안내',
    prompt: 'Emergency business support concept showing financial stability for small business owners. Shield protection symbol with Korean won, supportive hands, and stability imagery. Calm blue and green colors conveying security and relief. Professional government support announcement style, 16:9 aspect ratio.',
    filename: '2026-small-business-voucher.jpg'
  }
];

async function generateImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Generate a professional thumbnail image: ${prompt}`
        }]
      }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT']
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  // 이미지 데이터 추출
  if (data.candidates && data.candidates[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType
        };
      }
    }
  }
  
  throw new Error('No image in response');
}

async function saveImageLocally(base64Data, filename) {
  const buffer = Buffer.from(base64Data, 'base64');
  const filepath = path.join('images', 'board', filename);
  
  // 디렉토리 확인
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filepath, buffer);
  console.log(`  Saved locally: ${filepath}`);
  return filepath;
}

async function updateAirtable(recordId, thumbnailUrl) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/board2/${recordId}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        thumbnailUrl: thumbnailUrl
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function main() {
  console.log('='.repeat(60));
  console.log('게시글 썸네일 이미지 생성 시작');
  console.log('='.repeat(60));
  console.log();

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`[${i + 1}/${posts.length}] ${post.title}`);
    
    try {
      // 1. 이미지 생성
      console.log('  Generating image...');
      const image = await generateImage(post.prompt);
      console.log(`  Generated: ${image.mimeType}`);
      
      // 2. 로컬 저장
      await saveImageLocally(image.base64, post.filename);
      
      // 3. Airtable 업데이트 (로컬 경로로)
      const thumbnailUrl = `images/board/${post.filename}`;
      await updateAirtable(post.id, thumbnailUrl);
      console.log(`  Airtable updated: ${thumbnailUrl}`);
      
      console.log('  ✅ Complete');
      console.log();
      
      // Rate limit 방지
      if (i < posts.length - 1) {
        console.log('  Waiting 3 seconds...');
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      console.log();
    }
  }

  console.log('='.repeat(60));
  console.log('완료');
  console.log('='.repeat(60));
}

main().catch(console.error);
