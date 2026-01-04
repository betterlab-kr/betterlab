/**
 * 게시글 썸네일 이미지 생성 스크립트
 * Gemini API (Nano Banana Pro) 사용
 */

import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appiCVibf1BnLxKOL';

// 게시글 목록 및 이미지 프롬프트 (한국 배경, 한국인 명시)
const posts = [
  {
    id: 'recqT8IUXAbPZGIIy',
    title: '2026년 중소기업 정책자금 신규 지원 안내',
    prompt: 'Korean business professionals in a modern Seoul office discussing government funding documents. Korean businessmen and businesswomen in formal attire reviewing policy papers. Blue and white corporate color scheme with Korean won symbols. Professional Korean corporate photography style, 16:9 aspect ratio.',
    filename: '2026-policy-fund-overview.jpg'
  },
  {
    id: 'rec77OCoor42r9ZOo',
    title: '소상공인 희망리턴패키지 지원사업 공고',
    prompt: 'A hopeful Korean small business owner reopening their shop in a Korean traditional market or shopping district. Middle-aged Korean entrepreneur with warm smile, showing new beginning. Korean street signs visible. Warm orange and blue tones. Authentic Korean small business environment, 16:9 aspect ratio.',
    filename: '2026-hope-return-package.jpg'
  },
  {
    id: 'recGwPtnUgpafs5D7',
    title: '2026년 비수도권 균형발전 특별 지원금 안내',
    prompt: 'Aerial view of Korean regional cities like Busan, Daegu, or Gwangju showing urban development. Korean cityscape outside Seoul with modern buildings and traditional elements. Green spaces and sustainable development. Korean regional development theme, 16:9 aspect ratio.',
    filename: '2026-non-capital-region-support.jpg'
  },
  {
    id: 'reckBiYWJJXIMlTE2',
    title: '2026년 K-뷰티 수출지원 프로그램 참가기업 모집',
    prompt: 'Korean cosmetics products with K-Beauty branding in elegant display. Korean beauty products packaging with Hangul text, being prepared for international export. Pink, gold, and white luxury aesthetic. Korean beauty industry professional setting, 16:9 aspect ratio.',
    filename: '2026-kbeauty-support.jpg'
  },
  {
    id: 'recDMVb6Jt1awrILP',
    title: 'AX(AI 전환) 스프린트 트랙 지원사업 안내',
    prompt: 'Korean tech professionals working on AI transformation in a modern Korean tech company office. Young Korean developers and engineers collaborating on digital screens showing AI interfaces. Futuristic Korean tech workspace with purple and cyan lighting, 16:9 aspect ratio.',
    filename: '2026-ax-sprint-track.jpg'
  },
  {
    id: 'recVBJ7qP8AEsAPUP',
    title: '소상공인 특별경영안정자금 긴급 지원 안내',
    prompt: 'Korean government official helping a Korean small business owner with emergency funding paperwork. Supportive scene in Korean administrative office. Korean characters on documents. Calm blue and green colors conveying security and relief. Korean government support theme, 16:9 aspect ratio.',
    filename: '2026-small-business-voucher.jpg'
  }
];

async function generateImage(prompt) {
  // Nano Banana Pro 모델 사용
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Generate a professional, photorealistic thumbnail image. IMPORTANT: All people must be Korean/Asian, all text must be in Korean (Hangul), setting must be in South Korea. ${prompt}`
        }]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE']
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
  
  throw new Error('No image in response: ' + JSON.stringify(data));
}

async function saveImageLocally(base64Data, filename) {
  const buffer = Buffer.from(base64Data, 'base64');
  const filepath = path.join('images', 'board', filename);
  
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
  console.log('게시글 썸네일 이미지 생성 (Nano Banana Pro)');
  console.log('='.repeat(60));
  console.log();

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`[${i + 1}/${posts.length}] ${post.title}`);
    
    try {
      console.log('  Generating image...');
      const image = await generateImage(post.prompt);
      console.log(`  Generated: ${image.mimeType}`);
      
      await saveImageLocally(image.base64, post.filename);
      
      const thumbnailUrl = `images/board/${post.filename}`;
      await updateAirtable(post.id, thumbnailUrl);
      console.log(`  Airtable updated: ${thumbnailUrl}`);
      
      console.log('  ✅ Complete');
      console.log();
      
      if (i < posts.length - 1) {
        console.log('  Waiting 5 seconds...');
        await new Promise(r => setTimeout(r, 5000));
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
