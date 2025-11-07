/**
 * 모바일 크롤링 테스트 - 순위 확인
 */

async function testMobileRanking() {
    const keyword = '블로그 글쓰기';
    const targetUrl = 'https://blog.naver.com/prologue/PrologueList.naver?blogId=rss_mondo';

    console.log('🔍 모바일 크롤링 테스트 시작');
    console.log(`키워드: ${keyword}`);
    console.log(`대상 URL: ${targetUrl}\n`);

    try {
        // 모바일 User-Agent
        const headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        };

        // 1. 통합검색 (모바일)
        const searchUrl = `https://m.search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
        console.log(`검색 URL: ${searchUrl}\n`);

        const response = await fetch(searchUrl, { headers });
        const html = await response.text();
        console.log(`✅ HTML 가져오기 성공 (${html.length} bytes)\n`);

        // 2. 블로그 링크 추출
        const blogPattern = /https?:\/\/blog\.naver\.com\/[^"'<>\s]+/g;
        const matches = html.match(blogPattern) || [];
        const uniqueLinks = [...new Set(matches.map(link => link.split('?')[0]))];

        // PostView/PostList만 필터링
        const filteredLinks = uniqueLinks.filter(link =>
            link.includes('/PostView.naver') ||
            link.includes('/PostList.naver') ||
            link.split('/').length >= 5
        );

        console.log(`📋 발견된 블로그 링크 수: ${filteredLinks.length}개`);
        console.log('\n상위 30개 링크:');
        filteredLinks.slice(0, 30).forEach((link, idx) => {
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
        for (let i = 0; i < filteredLinks.length; i++) {
            const normalizedLink = normalizeUrl(filteredLinks[i]);

            if (normalizedTarget.includes(normalizedLink) || normalizedLink.includes(normalizedTarget)) {
                console.log(`\n✅ 매칭 성공!`);
                console.log(`순위: ${i + 1}위`);
                console.log(`링크: ${filteredLinks[i]}`);
                found = true;
                break;
            }
        }

        if (!found) {
            console.log('\n❌ 순위 없음 (100위 내 없음)');
        }

        console.log('\n\n🌐 실제 API 테스트 시작...\n');

        // 4. 실제 백엔드 API 호출
        const apiUrl = 'https://keyword-insight-api.onrender.com/check_blog_ranking';
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                keyword: keyword,
                targetUrl: targetUrl
            })
        });

        const result = await apiResponse.json();

        if (result.success) {
            console.log('✅ API 호출 성공!\n');
            console.log('📊 순위 결과:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`통합검색-스마트블록: ${result.smartblock.found ? result.smartblock.rank + '위' : '순위 없음'}`);
            console.log(`통합검색-블로그: ${result.mainBlog.found ? result.mainBlog.rank + '위' : '순위 없음'}`);
            console.log(`블로그 탭: ${result.blogTab.found ? result.blogTab.rank + '위' : '순위 없음'}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        } else {
            console.log('❌ API 오류:', result.error);
        }

    } catch (error) {
        console.error('\n❌ 에러 발생:', error.message);
    }
}

testMobileRanking();
