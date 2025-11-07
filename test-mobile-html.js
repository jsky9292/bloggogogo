/**
 * 모바일 HTML 구조 확인
 */

async function checkMobileHTML() {
    const keyword = '블로그 글쓰기';

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        };

        const searchUrl = `https://m.search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
        const response = await fetch(searchUrl, { headers });
        const html = await response.text();

        console.log('HTML 길이:', html.length);
        console.log('\n=== blog.naver.com 포함된 부분 샘플 ===\n');

        // blog.naver.com 포함된 부분만 추출
        const lines = html.split('\n');
        let count = 0;
        for (const line of lines) {
            if (line.includes('blog.naver.com') && count < 10) {
                console.log(line.substring(0, 200));
                count++;
            }
        }

        // 다양한 패턴으로 시도
        console.log('\n=== 패턴 테스트 ===\n');

        const patterns = [
            /https?:\/\/blog\.naver\.com\/[^"'<>\s]+/g,
            /blog\.naver\.com\/[^"'<>\s]+/g,
            /"url":"https?:\/\/blog\.naver\.com[^"]+/g,
            /'url':'https?:\/\/blog\.naver\.com[^']+/g
        ];

        patterns.forEach((pattern, idx) => {
            const matches = html.match(pattern);
            console.log(`패턴 ${idx + 1}: ${matches ? matches.length : 0}개 발견`);
            if (matches && matches.length > 0) {
                console.log('  샘플:', matches.slice(0, 3));
            }
        });

    } catch (error) {
        console.error('에러:', error.message);
    }
}

checkMobileHTML();
