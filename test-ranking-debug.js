/**
 * 블로그 순위 추적 디버깅 테스트
 */

async function testRanking() {
    const keyword = '블로그 글쓰기';
    const targetUrl = 'https://blog.naver.com/prologue/PrologueList.naver?blogId=rss_mondo';

    console.log('🔍 순위 추적 테스트 시작');
    console.log(`키워드: ${keyword}`);
    console.log(`대상 URL: ${targetUrl}\n`);

    try {
        // 1. 통합검색 HTML 가져오기
        const searchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
        console.log(`검색 URL: ${searchUrl}\n`);

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const html = await response.text();
        console.log(`✅ HTML 가져오기 성공 (${html.length} bytes)\n`);

        // 2. 블로그 링크 추출
        const blogPattern = /https?:\/\/blog\.naver\.com\/[^"'<>\s]+/g;
        const matches = html.match(blogPattern) || [];
        const uniqueLinks = [...new Set(matches.map(link => link.split('?')[0]))];

        console.log(`📋 발견된 블로그 링크 수: ${uniqueLinks.length}개`);
        console.log('\n상위 20개 링크:');
        uniqueLinks.slice(0, 20).forEach((link, idx) => {
            console.log(`  ${idx + 1}. ${link}`);
        });

        // 3. URL 정규화 및 매칭
        function normalizeUrl(url) {
            return url
                .replace(/https?:\/\//g, '')
                .replace(/www\./g, '')
                .split('?')[0]
                .toLowerCase();
        }

        const normalizedTarget = normalizeUrl(targetUrl);
        console.log(`\n🎯 찾는 URL (정규화): ${normalizedTarget}`);

        let found = false;
        for (let i = 0; i < uniqueLinks.length; i++) {
            const normalizedLink = normalizeUrl(uniqueLinks[i]);

            if (normalizedTarget.includes(normalizedLink) || normalizedLink.includes(normalizedTarget)) {
                console.log(`\n✅ 매칭 성공!`);
                console.log(`순위: ${i + 1}위`);
                console.log(`링크: ${uniqueLinks[i]}`);
                found = true;
                break;
            }
        }

        if (!found) {
            console.log('\n❌ 순위 없음 (100위 내 없음)');
            console.log('\n💡 가능한 원인:');
            console.log('  1. 실제로 100위 밖');
            console.log('  2. URL이 정확하지 않음');
            console.log('  3. HTML 구조 변경으로 링크 추출 실패');
        }

    } catch (error) {
        console.error('\n❌ 에러 발생:', error.message);
    }
}

testRanking();
