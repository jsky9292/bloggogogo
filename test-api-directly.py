# -*- coding: utf-8 -*-
import sys
sys.path.insert(0, 'D:\\bloggogogo\\server')

import requests
import re
import urllib.parse

keyword = '블로그 글쓰기'
target_url = 'https://blog.naver.com/jj_700930/223990966104'

print(f'키워드: {keyword}')
print(f'대상 URL: {target_url}\n')

# URL 정규화
def normalize_url(url):
    return url.replace('https://', '').replace('http://', '').replace('www.', '').split('?')[0].lower()

normalized_target = normalize_url(target_url)

# 모바일 User-Agent
headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
}

# 1. 통합검색
main_search_url = f"https://m.search.naver.com/search.naver?query={urllib.parse.quote(keyword)}"
print(f'통합검색 URL: {main_search_url}')

response = requests.get(main_search_url, headers=headers, timeout=10)
main_html = response.text

blog_pattern = r'https?://blog\.naver\.com/[^"\'<>\s]+'
main_matches = re.findall(blog_pattern, main_html)

main_links = []
seen = set()
for link in main_matches:
    if link:
        clean_link = link.split('?')[0]
        if clean_link not in seen:
            if '/PostView.naver' in link or '/PostList.naver' in link:
                seen.add(clean_link)
                main_links.append(clean_link)
            elif '/' in clean_link[len('https://blog.naver.com/'):]:
                seen.add(clean_link)
                main_links.append(clean_link)

print(f'\n추출된 링크 수: {len(main_links)}개')
print('\n상위 10개 링크:')
for i, link in enumerate(main_links[:10]):
    print(f'{i+1}. {link}')

# 순위 찾기
print(f'\n찾는 URL (정규화): {normalized_target}')

smartblock_rank = None
main_blog_rank = None

for i, link in enumerate(main_links[:30]):
    normalized_link = normalize_url(link)
    if normalized_target in normalized_link or normalized_link in normalized_target:
        if i < 10:
            smartblock_rank = i + 1
            print(f'\n✅ 스마트블록 {smartblock_rank}위 발견!')
        else:
            main_blog_rank = i - 9
            print(f'\n✅ 블로그 영역 {main_blog_rank}위 발견!')
        print(f'매칭된 링크: {link}')
        break

if not smartblock_rank and not main_blog_rank:
    print('\n❌ 통합검색에서 순위 없음')

# 2. 블로그 탭
blog_tab_url = f"https://m.search.naver.com/search.naver?where=post&query={urllib.parse.quote(keyword)}"
print(f'\n\n블로그 탭 URL: {blog_tab_url}')

response = requests.get(blog_tab_url, headers=headers, timeout=10)
blog_html = response.text

blog_matches = re.findall(blog_pattern, blog_html)

blog_links = []
seen = set()
for link in blog_matches:
    if link:
        clean_link = link.split('?')[0]
        if clean_link not in seen:
            if '/PostView.naver' in link or '/PostList.naver' in link:
                seen.add(clean_link)
                blog_links.append(clean_link)
            elif '/' in clean_link[len('https://blog.naver.com/'):]:
                seen.add(clean_link)
                blog_links.append(clean_link)

print(f'\n추출된 링크 수: {len(blog_links)}개')

blog_tab_rank = None
for i, link in enumerate(blog_links[:100]):
    normalized_link = normalize_url(link)
    if normalized_target in normalized_link or normalized_link in normalized_target:
        blog_tab_rank = i + 1
        print(f'\n✅ 블로그 탭 {blog_tab_rank}위 발견!')
        print(f'매칭된 링크: {link}')
        break

if not blog_tab_rank:
    print('\n❌ 블로그 탭에서 순위 없음')

print('\n\n=== 최종 결과 ===')
print(f'통합검색-스마트블록: {smartblock_rank if smartblock_rank else "순위 없음"}')
print(f'통합검색-블로그: {main_blog_rank if main_blog_rank else "순위 없음"}')
print(f'블로그 탭: {blog_tab_rank if blog_tab_rank else "순위 없음"}')
