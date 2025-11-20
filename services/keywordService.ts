
import type { KeywordData, SearchSource, BlogPostData, KeywordMetrics, GeneratedTopic, BlogStrategyReportData, RecommendedKeyword, SustainableTopicCategory, GoogleSerpData, PaaItem, SerpStrategyReportData, WeatherData } from '../types';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// API 키 가져오기 헬퍼 함수
const getApiKey = (): string => {
    // 1. 사용자가 설정한 개인 API 키 확인 (localStorage)
    const userApiKey = localStorage.getItem('gemini_api_key');
    if (userApiKey && userApiKey.trim()) {
        return userApiKey.trim();
    }

    // 2. 기본 환경변수 API 키 사용
    const defaultApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (defaultApiKey && defaultApiKey.trim()) {
        return defaultApiKey.trim();
    }

    throw new Error('API 키가 설정되지 않았습니다. 설정에서 Gemini API 키를 입력해주세요.');
};

// Claude API 키 가져오기
const getClaudeApiKey = (): string | null => {
    const userApiKey = localStorage.getItem('claude_api_key');
    if (userApiKey && userApiKey.trim()) {
        return userApiKey.trim();
    }
    return null;
};

// ChatGPT API 키 가져오기
const getChatGPTApiKey = (): string | null => {
    const userApiKey = localStorage.getItem('chatgpt_api_key');
    if (userApiKey && userApiKey.trim()) {
        return userApiKey.trim();
    }
    return null;
};

// NOTE: To combat the inherent unreliability of public CORS proxies, this service employs a highly resilient, multi-strategy approach.
// 1. Diverse Strategies: It uses a list of proxies that work differently (e.g., direct pass-through vs. JSON-wrapped content), increasing the chance that at least one method will bypass blocking or server issues.
// 2. Increased Timeout: A generous 15-second timeout accommodates slower proxies.
// 3. Intelligent Retry: Network errors on a proxy are retried once automatically.
// 4. Smart Fallback: If a proxy fails consistently, the service automatically moves to the next strategy in the list.

interface Proxy {
    name: string;
    buildUrl: (url: string) => string;
    parseResponse: (response: Response) => Promise<string>;
}

const PROXIES: Proxy[] = [
    {
        name: 'corsproxy.io',
        buildUrl: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        parseResponse: (response) => response.text(),
    },
    {
        name: 'allorigins.win (JSON)',
        buildUrl: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        async parseResponse(response: Response) {
            const data = await response.json();
            if (data && data.contents) {
                return data.contents;
            }
            throw new Error('allorigins.win: Invalid JSON response structure.');
        },
    },
    {
        name: 'thingproxy.freeboard.io',
        buildUrl: (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
        parseResponse: (response) => response.text(),
    },
];

const MAX_RETRIES_PER_PROXY = 2; // 1 initial attempt + 1 retry
const RETRY_DELAY_MS = 1000;
const FETCH_TIMEOUT_MS = 15000;

/**
 * Extracts and parses a JSON object from a string that may contain markdown and other text.
 * It intelligently finds the end of the JSON structure by balancing brackets.
 * @param text The raw string from the AI response.
 * @returns The parsed JSON object.
 * @throws An error if JSON cannot be found or parsed.
 */
function extractJsonFromText(text: string): any {
    if (!text || typeof text !== 'string') {
        throw new Error('AI 응답이 비어있거나 올바르지 않습니다.');
    }
    let jsonString = text.trim();

    // Attempt to find JSON within markdown code blocks first
    const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        jsonString = markdownMatch[1].trim();
    }

    const startIndex = jsonString.search(/[[{]/);
    if (startIndex === -1) {
        throw new Error('AI 응답에서 유효한 JSON을 찾을 수 없습니다.');
    }

    const startChar = jsonString[startIndex];
    const endChar = startChar === '[' ? ']' : '}';
    let openCount = 0;
    let endIndex = -1;

    // Find the matching closing bracket/brace, ignoring those inside strings
    let inString = false;
    let escapeChar = false;
    for (let i = startIndex; i < jsonString.length; i++) {
        const char = jsonString[i];

        if (escapeChar) {
            escapeChar = false;
            continue;
        }
        if (char === '\\') {
            escapeChar = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
        }

        if (!inString) {
            if (char === startChar) {
                openCount++;
            } else if (char === endChar) {
                openCount--;
            }
        }

        if (openCount === 0) {
            endIndex = i;
            break;
        }
    }
    
    // Fallback to old logic if bracket matching fails for some reason
    if (endIndex === -1) {
        const lastBrace = jsonString.lastIndexOf('}');
        const lastBracket = jsonString.lastIndexOf(']');
        endIndex = Math.max(lastBrace, lastBracket);
    }
    
    if (endIndex === -1) {
        throw new Error('AI 응답에서 유효한 JSON의 끝을 찾을 수 없습니다.');
    }

    const potentialJson = jsonString.substring(startIndex, endIndex + 1);

    try {
        return JSON.parse(potentialJson);
    } catch (error) {
        console.error("JSON 파싱 실패. 원본 텍스트:", text);
        console.error("추출된 JSON 문자열:", potentialJson);
        if (error instanceof Error) {
            throw new Error(`AI가 반환한 데이터의 형식이 잘못되었습니다. 오류: ${error.message}`);
        }
        throw new Error('AI가 반환한 데이터의 형식이 잘못되었습니다.');
    }
}


const fetchWithTimeout = async (resource: RequestInfo, options: RequestInit & { timeout?: number } = {}): Promise<Response> => {
    const { timeout = FETCH_TIMEOUT_MS } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Timeout'), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
};

const fetchWithProxies = async (targetUrl: string, responseParser: (text: string) => any) => {
    let lastKnownError: Error | null = null;
     for (const proxy of PROXIES) {
        const proxyUrl = proxy.buildUrl(targetUrl);
        
        for (let attempt = 1; attempt <= MAX_RETRIES_PER_PROXY; attempt++) {
            try {
                const response = await fetchWithTimeout(proxyUrl, { timeout: FETCH_TIMEOUT_MS });
                if (!response.ok) {
                    lastKnownError = new Error(`HTTP 오류! 상태: ${response.status}.`);
                    break;
                }
                
                const rawContent = await proxy.parseResponse(response);
                if (!rawContent) {
                    lastKnownError = new Error('프록시에서 빈 콘텐츠를 반환했습니다.');
                    continue;
                }
                return responseParser(rawContent);

            } catch (error) {
                if (error instanceof Error) {
                   lastKnownError = error;
                } else {
                   lastKnownError = new Error("알 수 없는 요청 오류가 발생했습니다.");
                }
                if (attempt < MAX_RETRIES_PER_PROXY) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                }
            }
        }
    }
    
    // If we're here, all proxies and retries have failed.
     if (lastKnownError instanceof Error) {
        if (lastKnownError?.message.includes('Timeout')) {
            throw new Error('요청 시간이 초과되었습니다. 네트워크 연결이 느리거나 모든 프록시 서버가 응답하지 않습니다.');
        }
        if (lastKnownError instanceof TypeError && lastKnownError.message.includes('fetch')) {
            throw new Error('네트워크 요청에 실패했습니다. 모든 프록시 서버에 연결할 수 없습니다. 인터넷 연결, 브라우저의 광고 차단기(AdBlocker) 또는 보안 설정을 확인하거나 잠시 후 다시 시도해 주세요.');
        }
        throw new Error(`모든 프록시 서버에서 데이터를 가져오는 데 실패했습니다. 마지막 오류: ${lastKnownError?.message || '알 수 없는 오류'}. 잠시 후 다시 시도해 주세요.`);
    }
    throw new Error(`데이터를 가져오지 못했습니다.`);
};

export const generateRelatedKeywords = async (keyword: string): Promise<GoogleSerpData> => {
    if (!keyword.trim()) {
        throw new Error("키워드가 비어있습니다.");
    }

    // 키워드 길이 제한 (너무 긴 키워드 방지)
    const trimmedKeyword = keyword.trim().slice(0, 100);

    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
    당신은 Google 검색을 활용하여 실시간 정보를 분석하는 최고의 SEO 전문가이자 콘텐츠 전략가입니다.
    당신의 임무는 키워드 "${trimmedKeyword}"에 대한 Google 검색을 **데스크톱 버전**으로 **실시간 수행**하고, 그 결과에서 아래 데이터를 정확하게 추출 및 분석하는 것입니다.

    [매우 중요한 지시사항]
    - **데스크톱 검색 수행**: 반드시 데스크톱 환경의 Google 검색 결과를 기준으로 분석해야 합니다. 모바일 버전이 아닙니다.
    - **데스크톱 User-Agent 사용**: 데스크톱 브라우저(Chrome, Firefox 등)의 User-Agent를 사용하여 검색하세요.
    - **실시간 검색 수행**: 반드시 Google 검색 도구를 사용하여 **현재 시점의 최신 정보**를 가져와야 합니다.
    - **최신 정보 우선**: 특히 '다른 사람들이 함께 찾는 질문(PAA)' 항목은 오늘 날짜 또는 최근 24시간 이내의 뉴스 기사, 보도자료 등 가장 최신 정보를 기반으로 답변을 구성해야 합니다. 과거 정보는 절대 포함해서는 안 됩니다.
    - **철저한 관련성 검증**: 추출하는 모든 데이터는 반드시 입력 키워드 "${trimmedKeyword}"와 직접적으로 관련이 있어야 합니다.

    [추출 및 분석할 데이터]
    1.  **'관련 검색어'(Related Searches)**: 검색 결과 페이지 하단에 표시되는 목록에서 **가장 관련성 높은 순서대로 정확히 10개**를 추출합니다.
    2.  **'다른 사람들이 함께 찾는 질문'(People Also Ask)**: 검색 결과 중간에 표시되는 질문 목록에서 **가장 중요하고 관련성 높은 순서대로 정확히 5개**를 추출하여 아래 항목을 분석합니다.
        - **answer**: 질문에 대한 가장 최신 정보를 바탕으로 한, 간결하고 명확한 요약 답변.
        - **content_gap_analysis**: **(가장 중요)** 현재 검색 결과들이 이 질문에 대해 '무엇을 놓치고 있는지' 분석합니다. 사용자의 숨겨진 의도, 더 깊이 있는 정보에 대한 니즈, 해결되지 않은 문제점 등을 구체적으로 지적하고, 어떤 콘텐츠를 만들어야 경쟁에서 이길 수 있는지 '공략 포인트'를 제시합니다.

    [출력 형식]
    - 다른 텍스트, 설명, 서론 없이 오직 아래 JSON 형식에 맞춰 **JSON 코드 블록 하나만으로** 응답해 주세요.
    - 만약 특정 섹션을 찾을 수 없다면, 해당 키에 빈 배열을 반환하세요.

    \`\`\`json
    {
      "related_searches": ["추출된 관련 검색어 1", "추출된 관련 검색어 2", "추출된 관련 검색어 3", "추출된 관련 검색어 4", "추출된 관련 검색어 5", "추출된 관련 검색어 6", "추출된 관련 검색어 7", "추출된 관련 검색어 8", "추출된 관련 검색어 9", "추출된 관련 검색어 10"],
      "people_also_ask": [
        {
          "question": "추출된 질문 1",
          "answer": "가장 최신 정보를 기반으로 요약된 답변 1",
          "content_gap_analysis": "현재 검색 결과는 A라는 사실만 알려줍니다. 하지만 사용자는 A가 자신의 B에 어떤 영향을 미치는지 구체적인 예시와 해결책을 원합니다. 이 부분을 공략해야 합니다."
        },
        {
          "question": "추출된 질문 2",
          "answer": "가장 최신 정보를 기반으로 요약된 답변 2",
          "content_gap_analysis": "대부분의 글이 원론적인 설명에 그칩니다. 사용자는 따라하기 쉬운 단계별 가이드나 실제 적용 후기를 찾고 있습니다. 체크리스트나 실제 사례를 포함한 콘텐츠가 필요합니다."
        },
        {
          "question": "추출된 질문 3",
          "answer": "가장 최신 정보를 기반으로 요약된 답변 3",
          "content_gap_analysis": "관련 법규나 정책의 변경 사항이 제대로 반영되지 않은 정보가 많습니다. 가장 최신 기준으로 변경된 내용을 명확히 비교하고 설명하는 콘텐츠가 경쟁 우위를 가질 것입니다."
        },
        {
          "question": "추출된 질문 4",
          "answer": "가장 최신 정보를 기반으로 요약된 답변 4",
          "content_gap_analysis": "긍정적인 측면만 부각하는 글들이 대부분입니다. 사용자는 잠재적인 단점이나 리스크, 주의사항에 대한 현실적인 정보를 원하고 있습니다."
        },
        {
          "question": "추출된 질문 5",
          "answer": "가장 최신 정보를 기반으로 요약된 답변 5",
          "content_gap_analysis": "전문 용어가 너무 많아 초보자가 이해하기 어렵습니다. 어려운 개념을 비유나 쉬운 사례를 들어 설명해주는 콘텐츠가 높은 평가를 받을 것입니다."
        }
      ]
    }
    \`\`\`
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Related Keywords - AI 원본 응답:', text);

    if (!text) {
        throw new Error('AI가 빈 응답을 반환했습니다. 다시 시도해주세요.');
    }

    let keywords;
    try {
        // Try direct JSON parsing first (for structured output)
        keywords = JSON.parse(text);
        console.log('Related Keywords - 직접 JSON 파싱 성공');
    } catch (jsonError) {
        console.log('Related Keywords - 직접 JSON 파싱 실패, extractJsonFromText 사용');
        // Fallback to extractJsonFromText for markdown code blocks
        keywords = extractJsonFromText(text);
    }

    console.log('Related Keywords - 파싱된 데이터:', keywords);

    // Enhanced validation but keep it simple
    if (!keywords || typeof keywords !== 'object') {
        console.error('Related Keywords - 객체가 아님:', keywords);
        throw new Error('AI가 잘못된 형식의 데이터를 반환했습니다. 다른 키워드로 시도해주세요.');
    }

    if (!keywords.related_searches || !keywords.people_also_ask) {
        console.error('Related Keywords - 필수 속성 누락:', keywords);
        throw new Error('AI가 잘못된 형식의 데이터를 반환했습니다. 다른 키워드로 시도해주세요.');
    }

    if (!Array.isArray(keywords.related_searches) || !Array.isArray(keywords.people_also_ask)) {
        console.error('Related Keywords - 배열이 아님:', {
            related_searches: keywords.related_searches,
            people_also_ask: keywords.people_also_ask
        });
        throw new Error('AI가 잘못된 형식의 데이터를 반환했습니다. 다른 키워드로 시도해주세요.');
    }

    // Type validation and cleaning
    const citationRegex = /\[\d+(, ?\d+)*\]/g;

    const cleanedPaas = keywords.people_also_ask.map((paa: any, index: number) => {
        // Provide fallback values if properties are missing
        return {
            question: (paa?.question || `질문 ${index + 1}`).replace(citationRegex, '').trim(),
            answer: (paa?.answer || '답변을 찾을 수 없습니다.').replace(citationRegex, '').trim(),
            content_gap_analysis: (paa?.content_gap_analysis || '분석 정보가 없습니다.').replace(citationRegex, '').trim(),
        };
    }).slice(0, 5);

    const cleanedRelatedSearches = keywords.related_searches.map((search: string) =>
        (search || '').replace(citationRegex, '').trim()
    );

    return {
        related_searches: cleanedRelatedSearches,
        people_also_ask: cleanedPaas,
    };

  } catch (error) {
    console.error("AI 연관검색어 분석 중 오류 발생:", error);
    
    if (error instanceof Error) {
        // API 응답 문제
        if (error.message.includes('비어있습니다') || error.message.includes('trim')) {
            throw new Error('AI가 비어있는 응답을 반환했습니다. 다시 시도해주세요.');
        }
        
        // JSON 파싱 문제
        if (error.message.includes('JSON')) {
            throw new Error('AI가 잘못된 형식의 데이터를 반환했습니다. 다른 키워드로 시도해주세요.');
        }
        
        // 토큰 제한
        if (error.message.includes('exceeded') || error.message.includes('limit')) {
            throw new Error('키워드가 너무 깁니다. 더 짧은 키워드로 시도해주세요.');
        }
        
        // 기타 오류
        throw new Error(`AI 연관검색어 분석 중 오류가 발생했습니다: ${error.message}`);
    } else {
        throw new Error('AI 연관검색어 분석 중 알 수 없는 오류가 발생했습니다.');
    }
  }
};


const fetchSingleTermKeywords = async (term: string, source: SearchSource): Promise<string[]> => {
    const config = (source: SearchSource) => {
        if (source === 'naver') {
            return {
                url: `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(term)}&con=1&frm=nx&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4&q_enc=UTF-8&st=100`,
                parser: (data: any) => {
                    if (!data || !Array.isArray(data.items)) {
                        if (data && data.items === null) return []; 
                        throw new Error("Naver API로부터 예상치 못한 형식의 응답을 받았습니다: 'items' 배열이 없습니다.");
                    }
                    const keywords: string[] = [];
                    for (const itemGroup of data.items) {
                        if (Array.isArray(itemGroup)) {
                            for (const item of itemGroup) {
                                if (Array.isArray(item) && typeof item[0] === 'string') {
                                    keywords.push(item[0]);
                                }
                            }
                        }
                    }
                    return keywords;
                }
            };
        }
        // Default to Google
        return {
            url: `https://suggestqueries.google.com/complete/search?client=chrome&hl=ko&q=${encodeURIComponent(term)}`,
            parser: (data: any) => {
                if (!Array.isArray(data) || !Array.isArray(data[1])) {
                    throw new Error("Google Suggest API로부터 예상치 못한 형식의 응답을 받았습니다.");
                }
                return data[1] || [];
            }
        };
    };

    const { url: targetUrl, parser } = config(source);
    const data = await fetchWithProxies(targetUrl, JSON.parse);
    return parser(data);
};

export const fetchRelatedKeywords = async (keyword: string, source: SearchSource): Promise<KeywordData[]> => {
    if (!keyword.trim()) {
        throw new Error("키워드가 비어있습니다.");
    }
    
    if (source === 'naver') {
        const POSTFIXES = ["", "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
        const searchTerms = POSTFIXES.map(p => `${keyword} ${p}`.trim());

        const settlements = await Promise.allSettled(
            searchTerms.map(term => fetchSingleTermKeywords(term, 'naver'))
        );
        
        const successfulResults: string[][] = [];
        settlements.forEach(result => {
            if (result.status === 'fulfilled') {
                successfulResults.push(result.value);
            }
        });
        
        if (successfulResults.length === 0) {
           throw new Error(`'${keyword}'에 대한 Naver 자동완성검색어 조회에 실패했습니다. 모든 요청이 거부되었습니다.`);
        }

        const allSuggestions = new Set<string>();
        successfulResults.forEach(suggestions => {
            suggestions.forEach(kw => allSuggestions.add(kw.replace(/<[^>]*>/g, '')));
        });
        
        const finalSuggestions = Array.from(allSuggestions).slice(0, 20);
        return finalSuggestions.map((kw, index) => ({ id: index + 1, keyword: kw }));
    }

    // Google Search Logic
    const suggestions = await fetchSingleTermKeywords(keyword, 'google');
    const finalSuggestions = suggestions.slice(0, 20);
    return finalSuggestions.map((kw, index) => ({ id: index + 1, keyword: kw }));
};


export const fetchNaverBlogPosts = async (keyword: string): Promise<BlogPostData[]> => {
    if (!keyword.trim()) {
        throw new Error("키워드가 비어있습니다.");
    }
    const targetUrl = `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(keyword)}`;

    console.log('Fetching Naver blog posts for:', keyword);
    console.log('Target URL:', targetUrl);

    const htmlContent = await fetchWithProxies(targetUrl, (text) => text);

    console.log('HTML content received, length:', htmlContent.length);

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 네이버 블로그 검색 결과에서 실제 포스트 제목 추출 (대문이나 블로그명 제외)
    let titleElements: Element[] = [];

    // 방법 1: 네이버 블로그 검색 결과의 정확한 구조 타겟팅
    // 블로그 검색 결과는 .api_ani_send > .fds-comps-right-image-content-container 구조를 가짐
    const blogItems = Array.from(doc.querySelectorAll('.api_ani_send, .blog_block, .view_wrap'));
    console.log('Found blog items:', blogItems.length);

    if (blogItems.length > 0) {
        for (const item of blogItems) {
            // 각 블로그 아이템에서 포스트 제목 찾기
            // 우선순위 1: .total_tit 클래스 (포스트 제목 전용)
            let titleLink = item.querySelector('a.total_tit, a.api_txt_lines.total_tit');

            // 우선순위 2: .title_link 중에서 유저 정보가 아닌 것
            if (!titleLink) {
                titleLink = item.querySelector('.title_link:not(.user_info):not(.sub_txt)');
            }

            // 우선순위 3: data-cr-area 속성 활용
            if (!titleLink) {
                titleLink = item.querySelector('a[data-cr-area*="tit"]:not([data-cr-area*="blog"]):not([data-cr-area*="sub"])');
            }

            // 찾은 링크 검증
            if (titleLink) {
                const text = titleLink.textContent?.trim() || '';
                const href = (titleLink as HTMLAnchorElement).href || '';

                // URL이 실제 블로그 포스트인지 확인 (블로그 메인 페이지가 아닌)
                const isMainPage = href.match(/blog\.naver\.com\/[^\/]+\/?$/);
                const hasPostId = href.match(/blog\.naver\.com\/[^\/]+\/\d+/);

                // 블로그 대문이나 블로그명이 아닌 실제 포스트 제목인지 확인
                if (text.length > 10 &&
                    text.length < 150 &&
                    !isMainPage &&  // 블로그 메인 페이지 URL 제외
                    hasPostId &&    // 포스트 ID가 있는 URL만 포함
                    !text.includes('님의 블로그') &&
                    !text.includes('님의 이글루스') &&
                    !text.includes('네이버 블로그') &&
                    !text.match(/^[가-힣]+님?$/) && // "홍길동" 같은 이름만 있는 경우 제외
                    !text.match(/^https?:\/\//) &&   // URL로 시작하는 텍스트 제외
                    !text.match(/^blog\./) &&         // blog.로 시작하는 텍스트 제외
                    !text.includes('.com') &&         // 도메인이 포함된 텍스트 제외
                    !text.includes('.co.kr') &&       // 도메인이 포함된 텍스트 제외
                    !text.includes('#') &&
                    !text.includes('...')) {
                    titleElements.push(titleLink);
                }
            }
        }
    }

    // 방법 2: 직접 선택자 (백업)
    if (titleElements.length === 0) {
        // 네이버가 사용하는 정확한 클래스명들
        const selectors = [
            'a.total_tit',
            'a.api_txt_lines.total_tit',
            '.fds-comps-right-image-title a',
            '.title_area > a.title_link',
            'a[data-cr-area="blg*t"]'
        ];

        for (const selector of selectors) {
            titleElements = Array.from(doc.querySelectorAll(selector));
            if (titleElements.length > 0) {
                console.log(`Found with selector ${selector}:`, titleElements.length);
                break;
            }
        }
    }

    // 방법 3: 휴리스틱 필터링 (최후의 수단)
    if (titleElements.length === 0) {
        const allBlogLinks = Array.from(doc.querySelectorAll('a[href*="blog.naver.com"]'));

        // 텍스트 길이와 패턴으로 필터링
        const candidates = allBlogLinks
            .map(link => {
                const text = link.textContent?.trim() || '';
                const href = (link as HTMLAnchorElement).href || '';
                const parent = link.parentElement;
                const grandParent = parent?.parentElement;

                // URL 검증
                const isMainPage = href.match(/blog\.naver\.com\/[^\/]+\/?$/);
                const hasPostId = href.match(/blog\.naver\.com\/[^\/]+\/\d+/);

                // 점수 기반 평가
                let score = 0;

                // 긍정 점수
                if (text.length > 15 && text.length < 120) score += 2;
                if (hasPostId) score += 5;  // 포스트 ID가 있으면 높은 점수
                if (link.className.includes('tit')) score += 3;
                if (parent?.className.includes('tit')) score += 2;
                if (!text.includes('님')) score += 1;
                if (!text.includes('...')) score += 1;
                if (text.includes('?') || text.includes('!')) score += 1; // 질문이나 느낌표가 있으면 제목일 가능성 높음

                // 부정 점수
                if (isMainPage) score -= 10;  // 블로그 메인 페이지면 낮은 점수
                if (link.className.includes('user')) score -= 5;
                if (link.className.includes('sub')) score -= 3;
                if (parent?.className.includes('user')) score -= 5;
                if (parent?.className.includes('sub')) score -= 3;
                if (text.match(/^[가-힣]{2,5}$/)) score -= 10; // 짧은 이름
                if (text.includes('블로그')) score -= 3;
                if (text.match(/^https?:\/\//)) score -= 10; // URL로 시작
                if (text.includes('.com') || text.includes('.co.kr')) score -= 10; // 도메인 포함
                if (text.match(/^blog\./)) score -= 10; // blog.로 시작

                return { link, text, score, href };
            })
            .filter(item => item.score > 0 && item.href.includes('/') && !item.href.endsWith('.com/'))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        titleElements = candidates.map(item => item.link);
        console.log('Found with heuristic filtering:', titleElements.length);
    }

    // 디버깅: 결과 확인
    if (titleElements.length === 0) {
        console.log('No blog post titles found. Checking page structure...');

        // 모든 링크 확인
        const allLinks = Array.from(doc.querySelectorAll('a'));
        const blogLinks = allLinks.filter(a => (a as HTMLAnchorElement).href?.includes('blog'));

        console.log('Total links:', allLinks.length);
        console.log('Blog links:', blogLinks.length);

        // 긴 텍스트를 가진 링크들 확인
        const longTextLinks = blogLinks
            .filter(a => (a.textContent?.trim().length || 0) > 30)
            .slice(0, 5);

        console.log('Long text blog links:', longTextLinks.map(a => ({
            class: a.className,
            parent: a.parentElement?.className,
            text: a.textContent?.trim().substring(0, 60),
            href: (a as HTMLAnchorElement).href?.substring(0, 50)
        })));
    }

    // 중복 제거 및 상위 10개만 선택
    const uniqueUrls = new Set<string>();
    const results: BlogPostData[] = [];

    for (const element of titleElements) {
        if (results.length >= 10) break;

        const titleElement = element as HTMLAnchorElement;
        const title = titleElement.innerText?.trim() || titleElement.textContent?.trim() || '';
        const url = titleElement.href;

        if (title && url && url.startsWith('http') && !uniqueUrls.has(url)) {
            uniqueUrls.add(url);
            results.push({
                id: results.length + 1,
                title,
                url
            });
        }
    }

    console.log('Final results count:', results.length);
    console.log('First 3 results:', results.slice(0, 3));

    // 결과가 없으면 에러 메시지 개선
    if (results.length === 0) {
        console.error('Failed to find blog posts. HTML sample:', htmlContent.substring(0, 1000));
        console.error('네이버 블로그 크롤링 실패 - 페이지 구조가 변경되었을 수 있습니다.');

        // 더미 데이터 반환으로 기능 중단 방지
        return [
            { id: 1, title: `"${keyword}" 관련 블로그 포스트 제목을 가져올 수 없습니다.`, url: '#' },
            { id: 2, title: '네이버 블로그 크롤링 기능이 일시적으로 제한되었습니다.', url: '#' },
            { id: 3, title: '다른 키워드로 다시 시도해주세요.', url: '#' }
        ];
    }

    return results;
};

export const analyzeKeywordCompetition = async (keyword: string): Promise<KeywordMetrics> => {
    if (!keyword.trim()) {
        throw new Error("키워드가 비어있습니다.");
    }
    
    // 롭테일 키워드 처리: 100자 이상이면 자름
    const processedKeyword = keyword.length > 100 ? keyword.substring(0, 100) : keyword;

    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const today = new Date();
    const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    const prompt = `
당신은 Google 검색을 활용하여 실시간 정보를 분석하는 최고의 SEO 전문가입니다.

**분석 기준일: ${formattedDate}**
분석할 키워드: "${processedKeyword}"

**중요: 반드시 데스크톱 버전의 Google 검색을 사용하여** 다음 항목에 대한 최신 정보를 조사하고 분석해 주세요:
- 검색 관심도 및 최근 1년간의 검색 트렌드
- 경쟁 강도 (상위 페이지의 권위, 콘텐츠 포화도 등)
- **총 검색 결과 수 (문서 노출 수)**
- **해당 키워드의 현재 소비 현황 (커뮤니티, 뉴스, 소셜 미디어 등) 및 관련 최신 이슈**
- 주요 사용자 의도 (정보성, 상업성 등)

위 분석을 바탕으로, 아래 JSON 형식에 맞춰 **JSON 코드 블록 하나만으로** 응답해 주세요. 모든 텍스트는 **매우 상세하고 구체적으로**, 전문가적인 관점에서 작성하고, 기회/위협/이슈 요인은 **찾을 수 있는 모든 중요한 내용을** 불릿 포인트(-)로 상세히 설명해 주세요. **절대 인용 코드를 포함하지 말고**, 다른 설명은 추가하지 마세요.

- opportunityScore: 성공 가능성을 0~100점으로 평가.
- searchVolumeEstimate: 검색량 수준을 **'검색 관심도 지수'**로 0~100점 평가.
- competitionScore: 경쟁 강도를 **'경쟁 난이도 지수'**로 0~100점 평가 (높을수록 경쟁이 치열).
- competitionLevel: '낮음', '보통', '높음', '매우 높음' 중 하나로 평가.
- documentCount: Google 검색 시 노출되는 총 문서 수 (대략적인 숫자).
- opportunityScore가 80 미만일 경우, **반드시** strategy 필드에 아래 내용을 포함한 SEO 공략 전략을 제안해 주세요. 80 이상일 경우 strategy 필드는 생략합니다.
  - expandedKeywords: 공략 가능한 확장 키워드 3~5개를 배열로 제안.
  - blogTopics: 위 확장 키워드를 활용한, 구체적인 블로그 포스팅 제목 5개와 각 제목에 대한 상세한 공략법(핵심 내용, 구성 방식)을 배열로 제안.

{
  "opportunityScore": 0,
  "searchVolumeEstimate": 0,
  "competitionScore": 0,
  "competitionLevel": "보통",
  "documentCount": 0,
  "analysis": {
    "title": "분석 제목 (핵심 내용을 포함하여 구체적으로)",
    "reason": "점수 산정 핵심 이유 (상세한 설명)",
    "opportunity": "- 상세한 기회 요인 1\\n- 상세한 기회 요인 2\\n- 상세한 기회 요인 3",
    "threat": "- 상세한 위협 요인 1\\n- 상세한 위협 요인 2\\n- 상세한 위협 요인 3",
    "consumptionAndIssues": "- 현재 소비 현황 및 최신 이슈 상세 분석 1\\n- 현재 소비 현황 및 최신 이슈 상세 분석 2",
    "conclusion": "최종 결론 및 실행 전략 (구체적인 실행 방안을 포함하여 3-4문장으로 상세히 요약)"
  },
  "strategy": {
    "expandedKeywords": ["확장 키워드 1", "확장 키워드 2"],
    "blogTopics": [
      {
        "title": "블로그 제목 1",
        "description": "제목 1에 대한 상세 공략법(독자 타겟, 핵심 내용, 글의 구조 등)을 2-3문장으로 요약"
      },
      {
        "title": "블로그 제목 2",
        "description": "제목 2에 대한 상세 공략법 요약"
      }
    ]
  }
}
`.trim();

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Keyword Competition - AI 원본 응답:', text);

        let jsonResponse;
        try {
            // Try direct JSON parsing first (for structured output)
            jsonResponse = JSON.parse(text);
            console.log('Keyword Competition - 직접 JSON 파싱 성공');
        } catch (jsonError) {
            console.log('Keyword Competition - 직접 JSON 파싱 실패, extractJsonFromText 사용');
            // Fallback to extractJsonFromText for markdown code blocks
            jsonResponse = extractJsonFromText(text);
        }

        console.log('Keyword Competition - 파싱된 데이터:', jsonResponse);
        
        // --- Data validation ---
        if (
            typeof jsonResponse.opportunityScore !== 'number' ||
            typeof jsonResponse.searchVolumeEstimate !== 'number' ||
            typeof jsonResponse.competitionScore !== 'number' ||
            typeof jsonResponse.competitionLevel !== 'string' ||
            typeof jsonResponse.documentCount !== 'number' ||
            typeof jsonResponse.analysis !== 'object' ||
            typeof jsonResponse.analysis.title !== 'string' ||
            typeof jsonResponse.analysis.reason !== 'string' ||
            typeof jsonResponse.analysis.opportunity !== 'string' ||
            typeof jsonResponse.analysis.threat !== 'string' ||
            typeof jsonResponse.analysis.consumptionAndIssues !== 'string' ||
            typeof jsonResponse.analysis.conclusion !== 'string' ||
            (jsonResponse.strategy && (
                !Array.isArray(jsonResponse.strategy.expandedKeywords) ||
                !Array.isArray(jsonResponse.strategy.blogTopics)
            ))
        ) {
            throw new Error('AI로부터 유효하지 않은 형식의 응답을 받았습니다.');
        }

        // --- Clean citation codes ---
        const citationRegex = /\[\d+(, ?\d+)*\]/g;
        const cleanAnalysis = {
            title: jsonResponse.analysis.title.replace(citationRegex, '').trim(),
            reason: jsonResponse.analysis.reason.replace(citationRegex, '').trim(),
            opportunity: jsonResponse.analysis.opportunity.replace(citationRegex, '').trim(),
            threat: jsonResponse.analysis.threat.replace(citationRegex, '').trim(),
            consumptionAndIssues: jsonResponse.analysis.consumptionAndIssues.replace(citationRegex, '').trim(),
            conclusion: jsonResponse.analysis.conclusion.replace(citationRegex, '').trim(),
        };

        const keywordLength = processedKeyword.length;
        const wordCount = processedKeyword.split(/\s+/).filter(Boolean).length;
        
        return {
            keyword: processedKeyword,
            ...jsonResponse,
            analysis: cleanAnalysis,
            keywordLength,
            wordCount
        };

    } catch (error) {
         if (error instanceof Error) {
            console.error("Gemini API 호출 중 오류 발생:", error);
            
            // 롭테일 키워드 경우 특별 메시지
            if (keyword.length > 50) {
                throw new Error(`키워드가 너무 깁니다. 50자 이내로 줄여서 다시 시도해주세요. (현재: ${keyword.length}자)`);
            }
            
            if (error.message.includes('JSON')) {
                 throw new Error(`AI 모델이 비정상적인 데이터를 반환했습니다. 더 짧은 키워드로 다시 시도해주세요.`);
            }
            
            if (error.message.includes('timeout') || error.message.includes('DEADLINE')) {
                throw new Error(`분석 시간이 초과했습니다. 더 짧은 키워드로 시도해주세요.`);
            }
            
            throw new Error(`키워드 경쟁력 분석 중 오류가 발생했습니다. 더 짧은 키워드로 시도해주세요.`);
        } else {
            console.error("알 수 없는 오류 발생:", error);
            throw new Error('키워드 경쟁력 분석 중 알 수 없는 오류가 발생했습니다.');
        }
    }
};

export const executePromptAsCompetitionAnalysis = async (prompt: string): Promise<KeywordMetrics> => {
    if (!prompt.trim()) {
        throw new Error("프롬프트가 비어있습니다.");
    }

    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    const wrapperPrompt = `
    당신은 AI 어시스턴트이며, 사용자의 프롬프트를 실행하고 그 결과를 구조화된 SEO 분석 보고서 형식으로 변환하는 임무를 받았습니다.

    사용자의 요청은 다음과 같습니다:
    ---
    ${prompt}
    ---

    먼저, 사용자의 요청을 조용히 실행하여 주요 콘텐츠를 생성합니다.
    둘째, 그 결과를 바탕으로 다음 JSON 구조를 채워주세요.

    [JSON 채우기 지침]
    - keyword: 사용자의 프롬프트에서 핵심 주제를 나타내는 짧고 관련성 있는 키워드(2-5 단어)를 추출하거나 생성하세요.
    - analysis.title: 생성된 콘텐츠에 대한 간결하고 설명적인 제목을 만드세요.
    - analysis.conclusion: 이것이 가장 중요한 필드입니다. 사용자의 원래 프롬프트에 대한 완전하고 상세한 결과를 여기에 배치하세요. 해당되는 경우 마크다운(예: 글머리 기호 '-' 또는 번호 매기기 목록)으로 명확하게 서식을 지정하세요.
    - analysis.reason: 사용자의 원래 요청을 간략하게 요약하세요.
    - analysis.opportunity: 생성된 콘텐츠를 기반으로 사용자를 위한 2-3가지 핵심 기회 또는 실행 가능한 인사이트를 나열하세요.
    - analysis.threat: 해당되는 경우, 도전 과제나 고려 사항을 나열하세요. 그렇지 않다면 "특별한 위협 요인은 없습니다."라고 명시하세요.
    - analysis.consumptionAndIssues: 사용자가 생성된 정보를 어떻게 적용하거나 사용할 수 있는지 간략하게 설명하세요.
    - 모든 숫자 점수(opportunityScore, searchVolumeEstimate, competitionScore, documentCount)는 0으로 설정하세요.
    - competitionLevel을 "N/A"로 설정하세요.
    - 'strategy' 필드는 포함하지 마세요.
    - [1], [2]와 같은 인용 코드는 포함하지 마세요.

    오직 단일 JSON 코드 블록으로만 응답하세요.

    출력 구조 예시:
    {
      "keyword": "롱테일 키워드 발굴",
      "opportunityScore": 0,
      "searchVolumeEstimate": 0,
      "competitionScore": 0,
      "competitionLevel": "N/A",
      "documentCount": 0,
      "analysis": {
        "title": "'캠핑' 관련 롱테일 키워드 30개 분석",
        "reason": "사용자는 '캠핑'과 관련된 월간 검색량 1,000~5,000회의 롱테일 키워드 30개와 관련 분석을 요청했습니다.",
        "opportunity": "- 경쟁이 낮은 세부 키워드를 공략하여 특정 타겟층을 유입시킬 수 있습니다.\\n- 질문형 키워드를 활용하여 정보성 콘텐츠로 신뢰를 구축할 수 있습니다.",
        "threat": "특별한 위협 요인은 없습니다.",
        "consumptionAndIssues": "이 키워드 리스트를 기반으로 월간 콘텐츠 캘린더를 작성하고, 우선순위가 높은 키워드부터 블로그 포스팅을 시작할 수 있습니다.",
        "conclusion": "1. 캠핑 장비 추천 (검색 의도: 탐색형, 경쟁 강도: 중, ...)\\n2. 초보 캠핑 준비물 리스트 (검색 의도: 정보형, 경쟁 강도: 하, ...)\\n(이하 30개 키워드 목록)..."
      }
    }
    `.trim();

    try {
        const result = await model.generateContent(wrapperPrompt);
        const response = await result.response;
        const text = response.text();

        const jsonResponse = extractJsonFromText(text);
        
        if (!jsonResponse.keyword || !jsonResponse.analysis || !jsonResponse.analysis.conclusion) {
            throw new Error('AI로부터 유효하지 않은 형식의 응답을 받았습니다.');
        }

        const safeKeyword = String(jsonResponse.keyword || '');
        const cleanAnalysis = {
            title: String(jsonResponse.analysis.title || ''),
            reason: String(jsonResponse.analysis.reason || ''),
            opportunity: String(jsonResponse.analysis.opportunity || ''),
            threat: String(jsonResponse.analysis.threat || ''),
            consumptionAndIssues: String(jsonResponse.analysis.consumptionAndIssues || ''),
            conclusion: String(jsonResponse.analysis.conclusion || ''),
        };
        
        const keywordLength = safeKeyword.length;
        const wordCount = safeKeyword.split(/\s+/).filter(Boolean).length;
        
        return {
            keyword: safeKeyword,
            opportunityScore: jsonResponse.opportunityScore || 0,
            searchVolumeEstimate: jsonResponse.searchVolumeEstimate || 0,
            competitionScore: jsonResponse.competitionScore || 0,
            competitionLevel: jsonResponse.competitionLevel || "N/A",
            documentCount: jsonResponse.documentCount || 0,
            analysis: cleanAnalysis,
            keywordLength,
            wordCount
        };

    } catch (error) {
         if (error instanceof Error) {
            console.error("프롬프트 실행 중 Gemini API 호출 실패:", error);
            if (error.message.includes('JSON')) {
                 throw new Error(`AI 모델이 프롬프트 결과를 처리하는 중 비정상적인 데이터를 반환했습니다. 다시 시도해주세요.`);
            }
            throw new Error(`프롬프트 실행 중 AI 모델과 통신하는 데 실패했습니다. 오류: ${error.message}`);
        } else {
            console.error("프롬프트 실행 중 알 수 없는 오류 발생:", error);
            throw new Error('프롬프트 실행 중 알 수 없는 오류가 발생했습니다.');
        }
    }
};


const callGenerativeModelForTopics = async (prompt: string): Promise<GeneratedTopic[]> => {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const responseSchema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: {
            type: SchemaType.STRING,
            description: '클릭률이 높은 블로그 포스팅 제목'
          },
          thumbnailCopy: {
            type: SchemaType.STRING,
            description: '블로그 썸네일에 사용할 짧고 자극적인 문구'
          },
          strategy: {
            type: SchemaType.STRING,
            description: '이 제목과 썸네일이 왜 효과적인지, 어떤 내용을 어떤 방식으로 담아야 상위 노출이 가능한지에 대한 구체적인 공략법'
          }
        },
        required: ['title', 'thumbnailCopy', 'strategy']
      }
    };

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });
        const response = await result.response;
        const text = response.text();

        console.log('Blog Topics - AI 원본 응답:', text);

        let parsed;
        try {
            // Try direct JSON parsing first (for structured output)
            parsed = JSON.parse(text);
            console.log('Blog Topics - 직접 JSON 파싱 성공');
        } catch (jsonError) {
            console.log('Blog Topics - 직접 JSON 파싱 실패, extractJsonFromText 사용');
            // Fallback to extractJsonFromText for markdown code blocks
            parsed = extractJsonFromText(text);
        }

        console.log('Blog Topics - 파싱된 데이터:', parsed);
        console.log('Blog Topics - 데이터 타입:', typeof parsed);
        console.log('Blog Topics - 배열인가?:', Array.isArray(parsed));

        if (!Array.isArray(parsed)) {
            console.error('Blog Topics - 배열이 아닌 데이터:', parsed);
            throw new Error('AI 응답이 배열 형식이 아닙니다.');
        }

        return parsed.map((item, index) => {
            if (!item.title || !item.thumbnailCopy || !item.strategy) {
                console.error(`Blog Topics - 항목 ${index + 1}에 필수 속성이 누락됨:`, item);
                throw new Error(`AI 응답의 ${index + 1}번째 항목에 필수 속성이 누락되었습니다.`);
            }
            return {
                id: index + 1,
                title: item.title,
                thumbnailCopy: item.thumbnailCopy,
                strategy: item.strategy,
            };
        });

    } catch (error) {
         if (error instanceof Error) {
            console.error("Gemini API 호출 중 오류 발생:", error);
            if (error.message.includes('JSON')) {
                 throw new Error(`AI 모델이 비정상적인 데이터를 반환했습니다. 다른 키워드로 다시 시도해주세요.`);
            }
            throw new Error(`블로그 주제 생성 중 AI 모델과 통신하는 데 실패했습니다. 오류: ${error.message}`);
        } else {
            console.error("알 수 없는 오류 발생:", error);
            throw new Error('블로그 주제 생성 중 알 수 없는 오류가 발생했습니다.');
        }
    }
};

export const generateTopicsFromMainKeyword = async (keyword: string): Promise<GeneratedTopic[]> => {
    if (!keyword.trim()) {
        throw new Error("키워드가 비어있습니다.");
    }

    const prompt = `
당신은 검색 상위 노출과 높은 CTR(클릭률)을 유도하는 블로그 콘텐츠 제작 전문가입니다.

**🚨 엄격한 규칙 - 반드시 준수:**
1. **제목에 절대로 연도를 표기하지 마세요** (예: 2025년, 2024년 등 금지)
2. "최신", "요즘", "현재" 같은 시간 표현은 사용 가능하지만 구체적인 연도는 절대 금지
3. 제목에 숫자를 사용하는 경우, 순위나 개수(TOP 10, 5가지 등)는 피하고 구체적인 정보 제공에 집중

사용자가 검색할 키워드는 "${keyword}" 입니다.
이 키워드로 검색했을 때, 사용자의 시선을 사로잡아 클릭을 유도할 수 있는, 창의적이고 매력적인 블로그 제목, 그에 맞는 짧은 썸네일 문구, 그리고 각 주제에 대한 구체적인 공략법(어떤 내용을 어떤 방식으로 담아야 하는지)을 10개 제안해주세요.
특히, 제안하는 주제 중 일부는 최신 트렌드나 뉴스를 반영하여 시의성 높은 콘텐츠가 될 수 있도록 해주세요.
응답은 반드시 JSON 형식이어야 하며, 다른 설명 없이 JSON 코드 블록 하나만으로 응답해주세요.
`.trim();

    return callGenerativeModelForTopics(prompt);
};

export const generateTopicsFromAllKeywords = async (mainKeyword: string, relatedKeywords: string[]): Promise<GeneratedTopic[]> => {
    if (!mainKeyword.trim()) {
        throw new Error("메인 키워드가 비어있습니다.");
    }

    const prompt = `
당신은 검색 상위 노출과 높은 CTR(클릭률)을 유도하는 블로그 콘텐츠 제작 전문가입니다.

**🚨 엄격한 규칙 - 반드시 준수:**
1. **제목에 절대로 연도를 표기하지 마세요** (예: 2025년, 2024년 등 금지)
2. "최신", "요즘", "현재" 같은 시간 표현은 사용 가능하지만 구체적인 연도는 절대 금지
3. 제목에 숫자를 사용하는 경우, 순위나 개수(TOP 10, 5가지 등)는 피하고 구체적인 정보 제공에 집중

메인 키워드는 "${mainKeyword}" 이고, 이와 관련된 자동완성검색어는 [${relatedKeywords.join(', ')}] 입니다.
이 키워드 조합들을 종합적으로 분석하여, 사용자의 다양한 검색 의도를 충족시키고 클릭을 유도할 수 있는, 창의적이고 매력적인 블로그 제목, 그에 맞는 짧은 썸네일 문구, 그리고 각 주제에 대한 구체적인 공략법(어떤 내용을 어떤 방식으로 담아야 하는지)을 10개 제안해주세요.
특히, 제안하는 주제 중 일부는 최신 트렌드나 뉴스를 반영하여 시의성 높은 콘텐츠가 될 수 있도록 해주세요.
응답은 반드시 JSON 형식이어야 하며, 다른 설명 없이 JSON 코드 블록 하나만으로 응답해주세요.
`.trim();

    return callGenerativeModelForTopics(prompt);
};

export const generateBlogStrategy = async (keyword: string, posts: BlogPostData[]): Promise<BlogStrategyReportData> => {
    if (!keyword.trim()) throw new Error("분석할 키워드가 없습니다.");
    if (!posts || posts.length === 0) throw new Error("분석할 블로그 포스트 데이터가 없습니다.");

    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const topTitles = posts.map((p, i) => `${i + 1}. ${p.title}`).join('\n');

    const prompt = `
당신은 10년차 SEO 전문가이자, 사용자의 클릭을 유도하는 콘텐츠 마케팅 전문가입니다.

다음은 '${keyword}' 키워드로 검색했을 때 상위 10개에 노출된 블로그 포스팅 제목 목록입니다.

[상위 10개 블로그 제목]
${topTitles}

[지시사항]
1.  **상위 제목 분석**: 특히 상위 1~3위 제목에 집중하여, 이들의 **구조적 특징**, **감성적 특징 및 소구점**, 그리고 **공통적으로 포함된 핵심 단어**를 분석해 주세요. 분석 내용은 전문가적이고 매우 구체적이어야 합니다.
2.  **새로운 전략 제안**: 위 분석을 바탕으로, 기존 상위 포스팅들을 이기고 검색 결과 1위를 차지할 수 있는, 훨씬 더 매력적이고 클릭률이 높은 **블로그 제목, 썸네일 문구, 그리고 구체적인 공략법**을 10개 제안해 주세요.

아래 JSON 형식에 맞춰 **JSON 코드 블록 하나만으로** 응답해 주세요. 다른 설명은 절대 추가하지 마세요.
`.trim();

    const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
            analysis: {
                type: SchemaType.OBJECT,
                properties: {
                    structure: { type: SchemaType.STRING, description: "상위 제목들의 구조적 특징 분석 (예: 숫자 활용, 질문형, 특정 패턴 등)" },
                    characteristics: { type: SchemaType.STRING, description: "독자의 어떤 감정이나 니즈를 자극하는지에 대한 분석 (예: 호기심 자극, 정보 제공 약속, 문제 해결 제시 등)" },
                    commonKeywords: { type: SchemaType.STRING, description: "공통적으로 발견되는 핵심 단어 및 그 이유 분석" }
                },
                required: ['structure', 'characteristics', 'commonKeywords']
            },
            suggestions: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        title: { type: SchemaType.STRING, description: "새로운 블로그 제목" },
                        thumbnailCopy: { type: SchemaType.STRING, description: "썸네일에 사용할 짧고 강력한 문구" },
                        strategy: { type: SchemaType.STRING, description: "이 제목과 썸네일이 왜 효과적인지, 어떤 내용을 어떤 방식으로 담아야 상위 노출이 가능한지에 대한 구체적인 공략법" }
                    },
                    required: ['title', 'thumbnailCopy', 'strategy']
                }
            }
        },
        required: ['analysis', 'suggestions']
    };

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });
        const response = await result.response;
        const text = response.text();

        console.log('Blog Strategy - AI 원본 응답:', text);

        let parsed;
        try {
            // Try direct JSON parsing first (for structured output)
            parsed = JSON.parse(text);
            console.log('Blog Strategy - 직접 JSON 파싱 성공');
        } catch (jsonError) {
            console.log('Blog Strategy - 직접 JSON 파싱 실패, extractJsonFromText 사용');
            // Fallback to extractJsonFromText for markdown code blocks
            parsed = extractJsonFromText(text);
        }

        console.log('Blog Strategy - 파싱된 데이터:', parsed);

        // Validate parsed data structure
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('AI 응답이 객체 형식이 아닙니다.');
        }

        if (!parsed.analysis || typeof parsed.analysis !== 'object') {
            throw new Error('AI 응답에 analysis 객체가 없습니다.');
        }

        if (!Array.isArray(parsed.suggestions)) {
            console.error('Blog Strategy - suggestions가 배열이 아님:', parsed.suggestions);
            throw new Error('AI 응답의 suggestions가 배열 형식이 아닙니다.');
        }

        parsed.suggestions = parsed.suggestions.map((item: any, index: number) => ({ ...item, id: index + 1 }));

        return parsed as BlogStrategyReportData;

    } catch (error) {
        if (error instanceof Error) {
            console.error("Gemini API 호출 중 오류 발생:", error);
            if (error.message.includes('JSON')) {
                 throw new Error(`AI 모델이 비정상적인 데이터를 반환했습니다. 다른 키워드로 다시 시도해주세요.`);
            }
            throw new Error(`블로그 공략법 생성 중 AI 모델과 통신하는 데 실패했습니다. 오류: ${error.message}`);
        } else {
            console.error("알 수 없는 오류 발생:", error);
            throw new Error('블로그 공략법 생성 중 알 수 없는 오류가 발생했습니다.');
        }
    }
};

export const generateSerpStrategy = async (keyword: string, serpData: GoogleSerpData): Promise<SerpStrategyReportData> => {
    if (!keyword.trim()) throw new Error("분석할 키워드가 없습니다.");
    if (!serpData) throw new Error("분석할 SERP 데이터가 없습니다.");

    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const today = new Date();
    const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    const relatedSearchesText = serpData.related_searches.length > 0 ? serpData.related_searches.join(', ') : 'N/A';
    const paaText = serpData.people_also_ask.length > 0
        ? serpData.people_also_ask.map(p => `
          - 질문: ${p.question}
          - 콘텐츠 갭 (공략 포인트): ${p.content_gap_analysis}`).join('')
        : 'N/A';

    const prompt = `
당신은 15년차 SEO 전략가이자 콘텐츠 마케팅의 대가입니다. 당신의 임무는 경쟁자들이 놓치고 있는 '콘텐츠 갭'을 정확히 파고들어 검색 결과 1위를 차지하는 완벽한 전략을 수립하는 것입니다.

**분석 기준일: ${formattedDate}**

주어진 검색 키워드와 실제 Google 검색 결과 페이지(SERP) 데이터를 깊이 있게 분석하여, 사용자의 숨겨진 의도를 파악하고 경쟁을 압도할 콘텐츠 전략을 수립해야 합니다.

[분석 데이터]
- 검색 키워드: "${keyword}"
- 관련 검색어 (사용자들이 다음에 검색할 가능성이 높은 키워드): ${relatedSearchesText}
- 다른 사람들이 함께 찾는 질문 (PAA) 및 콘텐츠 갭 분석:
${paaText}

[매우 중요한 지시사항]
1.  **사용자 의도 및 콘텐츠 갭 분석**: 위 데이터를 종합하여, 사용자들이 '${keyword}'를 검색하는 진짜 이유와, 특히 PAA의 '콘텐츠 갭 (공략 포인트)'에서 드러난 **기존 콘텐츠들의 결정적인 약점**이 무엇인지 1~2문장으로 명확하게 정의해 주세요.
2.  **필러 포스트 제안**: 분석한 사용자 의도와 **콘텐츠 갭을 완벽하게 해결**하고, 관련 검색어와 PAA 질문 대부분을 포괄할 수 있는 **하나의 종합적인 '필러 포스트(Pillar Post)' 주제**를 제안해 주세요.
3.  **세부 블로그 주제 제안**: **(가장 중요)** 제안하는 10개의 블로그 주제는 반드시 위에서 분석된 **'콘텐츠 갭 (공략 포인트)'을 직접적으로 해결하는 내용**이어야 합니다. 각 주제가 어떤 갭을 어떻게 메우는지 명확히 드러나도록 구체적인 제목, 썸네일 문구, 공략법을 제안해 주세요.

아래 JSON 형식에 맞춰 **JSON 코드 블록 하나만으로** 응답해 주세요. 다른 설명은 절대 추가하지 마세요.
`.trim();

    const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
            analysis: {
                type: SchemaType.OBJECT,
                properties: {
                    userIntent: { type: SchemaType.STRING, description: "데이터 기반으로 분석한 핵심 사용자 의도 및 콘텐츠 갭 요약 (1-2 문장)" },
                    pillarPostSuggestion: { type: SchemaType.STRING, description: "모든 주제와 콘텐츠 갭을 아우를 수 있는 필러 포스트 주제 제안" },
                },
                required: ['userIntent', 'pillarPostSuggestion']
            },
            suggestions: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        title: { type: SchemaType.STRING, description: "콘텐츠 갭을 해결하는 새로운 블로그 제목" },
                        thumbnailCopy: { type: SchemaType.STRING, description: "썸네일에 사용할 짧고 강력한 문구" },
                        strategy: { type: SchemaType.STRING, description: "이 제목과 썸네일이 왜 효과적인지, 어떤 '콘텐츠 갭'을 어떻게 해결하는지에 대한 구체적인 공략법" }
                    },
                    required: ['title', 'thumbnailCopy', 'strategy']
                }
            }
        },
        required: ['analysis', 'suggestions']
    };

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });
        const response = await result.response;
        const text = response.text();

        console.log('SERP Strategy - AI 원본 응답:', text);

        let parsed;
        try {
            // Try direct JSON parsing first (for structured output)
            parsed = JSON.parse(text);
            console.log('SERP Strategy - 직접 JSON 파싱 성공');
        } catch (jsonError) {
            console.log('SERP Strategy - 직접 JSON 파싱 실패, extractJsonFromText 사용');
            // Fallback to extractJsonFromText for markdown code blocks
            parsed = extractJsonFromText(text);
        }

        console.log('SERP Strategy - 파싱된 데이터:', parsed);

        // Validate parsed data structure
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('AI 응답이 객체 형식이 아닙니다.');
        }

        if (!parsed.analysis || typeof parsed.analysis !== 'object') {
            throw new Error('AI 응답에 analysis 객체가 없습니다.');
        }

        if (!Array.isArray(parsed.suggestions)) {
            console.error('SERP Strategy - suggestions가 배열이 아님:', parsed.suggestions);
            throw new Error('AI 응답의 suggestions가 배열 형식이 아닙니다.');
        }

        parsed.suggestions = parsed.suggestions.map((item: any, index: number) => ({ ...item, id: index + 1 }));

        return parsed as SerpStrategyReportData;

    } catch (error) {
        if (error instanceof Error) {
            console.error("Gemini API 호출 중 오류 발생:", error);
            if (error.message.includes('JSON')) {
                 throw new Error(`AI 모델이 비정상적인 데이터를 반환했습니다. 다른 키워드로 다시 시도해주세요.`);
            }
            throw new Error(`SERP 전략 생성 중 AI 모델과 통신하는 데 실패했습니다. 오류: ${error.message}`);
        } else {
            console.error("알 수 없는 오류 발생:", error);
            throw new Error('SERP 전략 생성 중 알 수 없는 오류가 발생했습니다.');
        }
    }
};


export const fetchRecommendedKeywords = async (): Promise<RecommendedKeyword[]> => {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    const today = new Date();
    const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    const prompt = `
    [페르소나 설정]
    - 당신은 대한민국 최고의 실시간 트렌드 분석가이자 SEO 전략가입니다.
    - 당신의 가장 중요한 임무는 '과거의 트렌드'가 아닌, '바로 오늘'의 가장 뜨거운 이슈를 발굴하는 것입니다.

    [매우 중요한 지시사항]
    - **분석 기준일: ${formattedDate}**
    - 모든 분석과 키워드 제안은 **반드시 오늘(${formattedDate}) 날짜를 기준으로, 최근 24시간 이내에 발생했거나 오늘부터 효력이 발생하는 가장 새로운 정보**에 근거해야 합니다. 절대 며칠 전의 이슈를 재활용해서는 안 됩니다.

    [작업 목표]
    **데스크톱 버전의 Google 검색**을 활용하여, 위 지시사항에 따라 검색량은 폭증하고 있으나 아직 양질의 콘텐츠가 부족한(경쟁 강도 낮음) 키워드 **총 10개**를 발굴하고, 아래 JSON 형식에 맞춰 완벽한 블로그 공략법을 제안하세요.

    [조건]
    1.  **정책/제도 키워드 (정확히 5개)**: **오늘(${formattedDate})부터 실제 시행되거나, 오늘 발표된 새로운 정책/제도** 관련 키워드여야 합니다.
    2.  **일반 최신 이슈 키워드 (정확히 5개)**: 정책/제도 외의 분야에서 **바로 오늘 가장 새롭게 떠오른 사회, 문화, 기술 등의 이슈** 관련 키워드여야 합니다.
    3.  **'선정 이유(reason)' 항목 작성 시**: 왜 이 키워드가 **'바로 오늘'** 중요한지, 시의성을 반드시 명확하게 설명해야 합니다.

    [JSON 출력 형식]
    - 아래 항목을 포함하여, 다른 설명 없이 JSON 코드 블록 하나만으로 응답하세요.

    [
      {
        "keyword": "발굴한 전략 키워드 1",
        "reason": "오늘(${formattedDate}) 이 키워드가 왜 중요한지에 대한 시의성 중심의 설명.",
        "title": "블로그 제목 1",
        "thumbnailCopy": "썸네일 문구 1",
        "strategy": "공략법 1"
      },
      {
        "keyword": "발굴한 전략 키워드 2",
        "reason": "선정 이유 2",
        "title": "블로그 제목 2",
        "thumbnailCopy": "썸네일 문구 2",
        "strategy": "공략법 2"
      }
    ]
    `.trim();

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const parsed = extractJsonFromText(text);

        if (!Array.isArray(parsed)) {
            throw new Error('AI 응답이 배열 형식이 아닙니다.');
        }
        
        const citationRegex = /\[\d+(, ?\d+)*\]/g;

        return parsed.map((item, index) => {
            if (typeof item !== 'object' || item === null) return null;
            
            return {
                id: index + 1,
                keyword: (item.keyword || '').replace(citationRegex, '').trim(),
                reason: (item.reason || '').replace(citationRegex, '').trim(),
                title: (item.title || '').replace(citationRegex, '').trim(),
                thumbnailCopy: (item.thumbnailCopy || '').replace(citationRegex, '').trim(),
                strategy: (item.strategy || '').replace(citationRegex, '').trim(),
            };
        }).filter((item): item is RecommendedKeyword => item !== null);


    } catch (error) {
         if (error instanceof Error) {
            console.error("Gemini API 호출 중 오류 발생:", error);
            if (error.message.includes('JSON')) {
                 throw new Error(`AI 모델이 비정상적인 데이터를 반환했습니다. 다시 시도해주세요.`);
            }
            throw new Error(`전략 키워드 분석 중 AI 모델과 통신하는 데 실패했습니다. 오류: ${error.message}`);
        } else {
            console.error("알 수 없는 오류 발생:", error);
            throw new Error('전략 키워드 분석 중 알 수 없는 오류가 발생했습니다.');
        }
    }
};

export const generateSustainableTopics = async (keyword: string): Promise<SustainableTopicCategory[]> => {
    if (!keyword.trim()) {
        throw new Error("주제를 생성할 키워드가 비어있습니다.");
    }
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const today = new Date();
    const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    let prompt = `
당신은 15년차 SEO 전략가이자 콘텐츠 마케팅 전문가입니다. 당신의 임무는 일시적인 이슈성 키워드를 지속 가능한 콘텐츠 자산으로 바꾸는 것입니다.

**분석 기준일: ${formattedDate}**
사용자가 입력한 키워드: "${keyword}"

아래의 '이슈성 키워드를 지속적으로 유지하기 위한 방법론'과 '결과 예시'를 **완벽하게 숙지하고**, 그에 따라 위 키워드를 분석하여 블로그 주제 아이디어를 생성해 주세요. 결과는 반드시 '결과물 출력방식'과 '결과 예시'의 형식을 따라야 합니다.

---

# 이슈성 키워드를 지속적으로 유지하기 위한 방법론

이슈성 키워드는 사람들이 특정 사건이나 주제에 관심을 가지는 시기에 검색이 집중되며, 시간이 지남에 따라 검색량이 감소하는 특성이 있습니다. 이를 극복하고 **지속 가능한 관심**을 유지하기 위해서는 "주체"와 "검색 패턴"을 중심으로 전략적으로 접근해야 합니다. 아래는 이를 효과적으로 실행하기 위한 최종적인 방법론입니다.

---

## 1. **주체는 "관심과 감정이 연결된 대상"**

사람들이 검색을 할 때 중요한 것은 그 이슈와 연결된 **구체적인 대상**입니다. 이 대상은 사람들의 감정과 실질적 관심을 유발하는 주체여야 합니다.

### 실행 방안:
1. **개인적 주체 식별**: 사람들이 개인적으로 연관성을 느낄 수 있는 키워드를 설계합니다.
   - 예: 단순히 "폭설"이 아니라 "서울 폭설 대처법", "내 차를 위한 폭설 대비 방법"처럼 구체적인 상황과 연결.

2. **사회적 주체 확장**: 해당 이슈가 사회 전체에 미치는 영향을 강조합니다.
   - 예: "기후 변화와 폭설 빈도의 연관성", "도시 설계와 폭설 취약성 분석".

3. **구조적 질문 활용**:
   - 왜 이 일이 발생했는가? (원인)
   - 누가 영향을 받는가? (대상)
   - 어디에서 영향을 미치는가? (지역 및 환경)

---

## 2. **사람들의 검색 패턴 이해**

검색은 일반적으로 두 가지 경로로 이루어집니다: **즉각적인 호기심 충족**과 **구체적인 문제 해결**. 이 두 가지를 중심으로 키워드를 설계해야 합니다.

### 검색 패턴 분석:
1. **즉각적인 호기심**: "지금 무슨 일이야?"라는 질문에 대한 답을 찾기 위한 검색.
   - 관련 키워드: "OO 사건", "OO 뉴스", "OO 논란".

2. **구체적인 문제 해결**: "내가 지금 이 문제를 어떻게 해결하지?"라는 검색 니즈.
   - 관련 키워드: "OO 대처법", "OO 해결책", "OO 후기".

3. **장기적 관심 유도**: 사람들이 이슈가 지나간 후에도 검색할 수 있는 패턴을 만듭니다.
   - 예: "{YYYY+1}년 폭설 대응 전략", "다가오는 여름 기후 변화 예측".

---

## 3. **검색 패턴에 맞춘 지속 가능 키워드 설계**

사람들이 한 번 검색하고 끝내지 않도록 다음 요소들을 활용합니다:

### 1) **트렌드와 연결**
   - 사회적 이슈나 트렌드와 주제를 결합합니다.
   - 예: "{YYYY+1}년 폭설 트렌드", "다가오는 기후 변화와 우리의 미래".

### 2) **정보의 깊이 강화**
   - 단순 정보가 아닌, 다시 참고하고 싶은 유용한 콘텐츠로 유도합니다.
   - 예: "폭설의 원인과 기후 변화의 관계", "폭설 피해를 줄이는 도시 설계 방법".

### 3) **연관 키워드 확장**
   - 유사 검색어와 연계해 **중첩 검색어**를 만듭니다.
   - 예: "폭설 → 폭설 대처법 → 폭설 예보 확인 → 폭설 차량 준비".

---

## 4. **지속적으로 검색되도록 만드는 방법**

### 1) **사회적 논의와 연결**
   - 논란이나 토론 주제를 포함해 꾸준히 관심을 유도합니다.
   - 예: "도시 교통과 폭설 관리의 딜레마", "기후 변화 논란의 중심".

### 2) **사용자 참여 유도**
   - 사람들이 질문하거나 의견을 남기도록 유도합니다.
   - 예: "당신은 폭설 대처에 대해 어떻게 생각하시나요?", "다른 사람들의 폭설 경험은 어떨까요?".

### 3) **계절성과 반복성 활용**
   - 주기적으로 검색할 수 있는 이벤트와 연결합니다.
   - 예: "매년 초 겨울 폭설 대책", "여름철 폭염 대비 가이드".

---

## 5. **롱런 가능한 키워드 설계 전략**

### 핵심 전략:
1. **이슈의 구조적 분석**:
   - 단기적 관심에 머무르지 않고, 이슈의 근본 원인과 구조적 맥락을 파악합니다.
   - 예: "폭설의 사회적 영향과 기후 변화".

2. **반복 가능한 패턴 활용**:
   - 계절적, 주기적, 사회적 패턴과 연결.
   - 예: "{YYYY}년 겨울 폭설 예상", "다가오는 기후 변화의 미래".

3. **이슈 뒤에 숨겨진 메시지 강화**:
   - 단순 나열식 정보가 아닌, 장기적 시사점을 담습니다.
   - 예: "폭설이 주는 교훈: 지속 가능한 도시 설계의 필요성".

4. **매력적인 제목 설계**:
   - 의문과 탐구를 유도하는 방식으로 제목을 작성합니다.
   - 나쁜 예: "폭설 피해 뉴스".
   - 좋은 예: "서울은 왜 폭설에 취약할까?", "폭설 대처가 실패한 이유는?".

---

## 최종 결론

### 이슈성 키워드를 롱런하게 만드는 핵심 원칙:
1. **사람들의 관심과 감정이 연결된 주체를 찾아라.**
2. **즉각적인 호기심과 구체적인 문제 해결 패턴을 분석하라.**
3. **트렌드, 정보의 깊이, 연관 키워드를 활용해 지속 가능한 검색 환경을 조성하라.**
4. **장기적 시사점을 제공하고, 반복 검색 가능한 구조를 설계하라.**

### 결과물 출력방식
 -  "즉각적인 호기심 유발",  "구체적인 문제 해결",  "장기적인 관심 유도", "사회적 주제와 연결 " 등과 같은 용도별 카테고리로 분류하고 카테고리별 10개의 제목을 제안
- 제목별로 해당기사에 반드시 포함해야 할 (핵심키워드를 5개)
- 제목별로 seo요건에 맞춰 (구글검색 상위 노출을 위한 글쓰기 전략)을 포함합니다.

이 전략을 통해 이슈성 키워드를 단순 유행이 아닌 **지속 가능한 관심사**로 전환할 수 있습니다.

## ---결과 예시 ---

아래는 키워드 [반려동물]로 구성한 블로그 제목 제안입니다.
목표는 *지속적인 검색*, *트렌드 대응*, *문제 해결*, *사회적 연결성*을 고려해 설계했습니다.

---

## 1. 즉각적인 호기심 유발

### 사람들이 궁금해하고 바로 클릭할만한 주제

| 블로그 제목                           | 핵심 키워드                       | 구글 SEO 글쓰기 전략                      |
| -------------------------------- | ---------------------------- | ---------------------------------- |
| 반려동물 키우면 진짜 장수할까? 과학적 근거 총정리     | 반려동물, 장수, 건강효과, 심리치유, 과학적연구  | 질문형 제목 → 서두에 연구결과 제시 → 하단 관련 논문 인용 |
| 강아지보다 고양이가 더 오래 사는 이유            | 반려동물, 수명비교, 강아지, 고양이, 평균수명   | 검색패턴 활용 → 비교 포인트 강조 → 연관 검색어 삽입    |
| {YYYY+1} 반려동물 트렌드 TOP5, 이제 이런걸 키운다고? | 반려동물, 트렌드, 희귀펫, 인기반려동물, 키우기팁 | 리스트형 구성 → 최근 이슈 연결 → 사례 및 추천       |
| 반려동물 키울 때 몰라서 손해보는 지원금 총정리       | 반려동물, 지원금, 정부정책, 혜택, 펫보험     | 정보성 콘텐츠 → 최신 정보 업데이트 → 신청 방법 강조    |
| 고양이가 집사를 진짜 좋아할 때 보이는 행동 7가지     | 반려동물, 고양이, 애정표현, 행동특징, 습관    | 숫자형 리스트 → 사례와 사진 활용 → 검색최적화        |

---

## 2. 구체적인 문제 해결

### 사람들이 실생활에서 바로 찾을만한 키워드

| 블로그 제목                       | 핵심 키워드                    | 구글 SEO 글쓰기 전략                |
| ---------------------------- | ------------------------- | ---------------------------- |
| 강아지가 사료를 안 먹어요? 원인과 해결방법 총정리 | 반려동물, 강아지, 사료거부, 해결방법, 건강 | 원인별 구분 → 해결방법 서술 → 전문가 조언 첨부 |
| 반려동물 이사 스트레스 줄이는 5가지 방법      | 반려동물, 이사, 스트레스, 적응, 준비방법  | 상황별 대응법 → 체크리스트 제공 → 링크 삽입   |
| 강아지 입양 전 꼭 확인해야 할 체크리스트      | 반려동물, 강아지입양, 준비물, 비용, 절차  | 체크리스트 제공 → 다운로드 가능 → 후속글 연결  |
| 반려동물 여행 갈 때 필수 준비물 리스트       | 반려동물, 여행, 준비물, 펫호텔, 이동가방  | 리스트형 → 제품추천 → 경험리뷰           |
| 고양이 모래 추천! 상황별 베스트 5 비교      | 반려동물, 고양이, 모래추천, 제품비교, 가격 | 비교리뷰형 → 장단점 표기 → 가격정보 포함     |

---

## 3. 장기적인 관심 유도

### 시간이 지나도 계속 검색되는 키워드 설계

| 블로그 제목                       | 핵심 키워드                       | 구글 SEO 글쓰기 전략               |
| ---------------------------- | ---------------------------- | --------------------------- |
| 반려동물과 오래 사는 집의 공통점 5가지       | 반려동물, 장수비결, 생활습관, 건강관리, 실내환경 | 생활습관 제안 → 실천가이드 → 연결포스팅 유도  |
| 반려동물도 치매 걸린다? 증상과 예방법        | 반려동물, 치매, 증상, 예방법, 인지장애      | 증상 소개 → 예방법 설명 → 전문가 조언     |
| 1인가구 반려동물 키우기, 현실 가이드        | 반려동물, 1인가구, 키우기방법, 장단점, 비용   | 현실적 문제 제기 → 해결팁 제공 → 후속링크   |
| 반려동물 장례문화, 미리 알아두면 좋은 것들     | 반려동물, 장례, 추모, 절차, 비용         | 절차설명 → 비용가이드 → 장례업체 추천      |
| 반려동물 보험, 진짜 필요할까? 가입 전 체크리스트 | 반려동물, 보험, 필요성, 비교, 체크리스트     | 정보성 구성 → 보험사 비교 → 후속 콘텐츠 유도 |

---

## 4. 사회적 주제와 연결

### 사회적 가치, 이슈, 트렌드를 담은 콘텐츠

| 블로그 제목                     | 핵심 키워드                      | 구글 SEO 글쓰기 전략              |
| -------------------------- | --------------------------- | -------------------------- |
| 반려동물 유기, 당신이 모르는 진짜 이유     | 반려동물, 유기, 이유, 보호소, 사회문제     | 감정 유도 서두 → 데이터 제시 → 대안 제시  |
| 반려동물 출생신고제, 왜 필요한가?        | 반려동물, 출생신고, 법제화, 제도, 사회적 이슈 | 배경 설명 → 제도 현황 → 찬반 의견 정리   |
| 펫테크 시대, 반려동물 케어는 어떻게 달라질까? | 반려동물, 펫테크, 스마트기기, 미래트렌드, AI | 미래예측형 → 신제품 소개 → 사례연결      |
| 펫푸드 원산지 논란, 소비자가 꼭 알아야 할 것 | 반려동물, 펫푸드, 원산지, 논란, 정보      | 문제제기 → 안전기준 → 추천제품         |
| 반려동물 돌봄 노동, 누가 책임지나?       | 반려동물, 돌봄노동, 사회문제, 가사노동, 책임  | 사회적 관점 분석 → 전문가 의견 → 토론 유도 |

---

다른 설명 없이, **JSON 코드 블록 하나만으로** 응답해주세요.
`.trim();

    const currentYear = new Date().getFullYear();
    prompt = prompt.replace(/{YYYY}/g, String(currentYear));
    prompt = prompt.replace(/{YYYY\+1}/g, String(currentYear + 1));

    const responseSchema = {
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                category: { type: SchemaType.STRING },
                suggestions: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            title: { type: SchemaType.STRING },
                            keywords: {
                                type: SchemaType.ARRAY,
                                items: { type: SchemaType.STRING }
                            },
                            strategy: { type: SchemaType.STRING }
                        },
                        required: ['title', 'keywords', 'strategy']
                    }
                }
            },
            required: ['category', 'suggestions']
        }
    };

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let parsed;
        try {
            // Try direct JSON parsing first
            parsed = JSON.parse(text.trim());
        } catch (jsonError) {
            // Fallback to extractJsonFromText for markdown code blocks
            parsed = extractJsonFromText(text);
        }

        // 더 유연한 형식 검증
        if (!Array.isArray(parsed)) {
            console.warn('응답이 배열이 아님, 기본 카테고리 생성');
            // 기본 카테고리 생성
            return [
                {
                    category: '즉각적 호기심',
                    suggestions: [
                        {
                            title: `${keyword}의 놀라운 진실 5가지`,
                            keywords: [keyword, '진실', '사실', '비밀', '놀라운'],
                            strategy: '독자의 호기심을 자극하는 리스티클 형식으로 작성. 각 항목마다 구체적인 사례와 수치를 포함.'
                        },
                        {
                            title: `${keyword}, 당신이 몰랐던 이야기`,
                            keywords: [keyword, '숨겨진', '이야기', '비하인드', '실화'],
                            strategy: '스토리텔링 기법으로 독자를 몰입시키고, 감정적 연결고리를 형성하는 내러티브 구성.'
                        }
                    ]
                },
                {
                    category: '문제 해결',
                    suggestions: [
                        {
                            title: `${keyword} 완벽 가이드 2025`,
                            keywords: [keyword, '가이드', '방법', '해결', '2025'],
                            strategy: '단계별 설명과 실용적 팁으로 구성. 초보자도 쉽게 따라할 수 있도록 스크린샷과 예시 포함.'
                        },
                        {
                            title: `${keyword} 문제 해결 7가지 방법`,
                            keywords: [keyword, '문제', '해결', '방법', '팁'],
                            strategy: '실제 문제 상황과 해결 과정을 상세히 설명. 각 방법의 장단점과 적용 시나리오 제시.'
                        }
                    ]
                },
                {
                    category: '장기적 관심',
                    suggestions: [
                        {
                            title: `${keyword}의 미래 전망과 트렌드`,
                            keywords: [keyword, '미래', '전망', '트렌드', '예측'],
                            strategy: '데이터와 전문가 의견을 바탕으로 미래 예측. 시나리오별 분석과 준비 방법 제시.'
                        },
                        {
                            title: `${keyword} 마스터가 되는 법`,
                            keywords: [keyword, '마스터', '전문가', '성장', '학습'],
                            strategy: '장기적인 학습 로드맵 제시. 단계별 목표와 평가 기준, 추천 리소스 포함.'
                        }
                    ]
                },
                {
                    category: '사회적 연결',
                    suggestions: [
                        {
                            title: `${keyword}에 대한 사람들의 생각`,
                            keywords: [keyword, '의견', '리뷰', '경험', '후기'],
                            strategy: '다양한 관점과 경험을 수집하여 균형잡힌 시각 제시. 설문조사나 인터뷰 내용 포함.'
                        },
                        {
                            title: `${keyword} 커뮤니티 가이드`,
                            keywords: [keyword, '커뮤니티', '모임', '네트워크', '소통'],
                            strategy: '관련 커뮤니티와 네트워크 소개. 참여 방법과 활동 가이드라인 제공.'
                        }
                    ]
                }
            ];
        }

        // 유효한 카테고리만 필터링
        const validCategories = parsed.filter(p =>
            p &&
            typeof p === 'object' &&
            p.category &&
            Array.isArray(p.suggestions) &&
            p.suggestions.length > 0
        );

        if (validCategories.length === 0) {
            console.warn('유효한 카테고리가 없음, 기본 카테고리 생성');
            // 더 풍부한 기본 응답 반환
            return [
                {
                    category: '즉각적 호기심',
                    suggestions: [
                        {
                            title: `${keyword}의 놀라운 진실 5가지`,
                            keywords: [keyword, '진실', '사실', '비밀', '놀라운'],
                            strategy: '독자의 호기심을 자극하는 리스티클 형식으로 작성. 각 항목마다 구체적인 사례와 수치를 포함.'
                        }
                    ]
                },
                {
                    category: '문제 해결',
                    suggestions: [
                        {
                            title: `${keyword} 완벽 가이드`,
                            keywords: [keyword, '가이드', '방법', '해결'],
                            strategy: '단계별 설명과 실용적 팁으로 구성. 초보자도 쉽게 따라할 수 있도록 상세하게 설명.'
                        }
                    ]
                },
                {
                    category: '장기적 관심',
                    suggestions: [
                        {
                            title: `${keyword}의 미래 전망`,
                            keywords: [keyword, '미래', '전망', '트렌드'],
                            strategy: '데이터와 전문가 의견을 바탕으로 미래 예측. 독자가 준비할 수 있는 실용적 조언 제공.'
                        }
                    ]
                },
                {
                    category: '사회적 연결',
                    suggestions: [
                        {
                            title: `${keyword}에 대한 사람들의 생각`,
                            keywords: [keyword, '의견', '리뷰', '경험'],
                            strategy: '다양한 관점과 경험을 수집하여 균형잡힌 시각 제시.'
                        }
                    ]
                }
            ];
        }

        return validCategories as SustainableTopicCategory[];
    } catch (error) {
        if (error instanceof Error) {
            console.error("Gemini API 호출 중 오류 발생:", error);
            if (error.message.includes('JSON')) {
                throw new Error(`AI 모델이 비정상적인 데이터를 반환했습니다. 다른 키워드로 다시 시도해주세요.`);
            }
            throw new Error(`지속 가능 주제 생성 중 AI 모델과 통신하는 데 실패했습니다. 오류: ${error.message}`);
        } else {
            console.error("알 수 없는 오류 발생:", error);
            throw new Error('지속 가능 주제 생성 중 알 수 없는 오류가 발생했습니다.');
        }
    }
};

// Schema Markup 생성 함수
const generateSchemaMarkup = (title: string, description: string, keywords: string[], platform: 'naver' | 'google'): string => {
    const today = new Date().toISOString().split('T')[0];
    
    const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://www.example.com/${encodeURIComponent(title.replace(/\s+/g, '-').toLowerCase())}`
        },
        "headline": title,
        "description": description,
        "keywords": keywords.join(', '),
        "author": {
            "@type": "Person",
            "name": "SEO Expert"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Keyword Insight Pro",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.example.com/logo.png"
            }
        },
        "datePublished": today,
        "dateModified": today,
        "image": [
            "https://www.example.com/images/hero-image.jpg",
            "https://www.example.com/images/content-image-1.jpg",
            "https://www.example.com/images/content-image-2.jpg"
        ]
    };
    
    if (platform === 'google') {
        // Google은 JSON-LD 형식의 Schema Markup을 선호
        return `\n\n<!-- Schema Markup for SEO -->\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
    } else {
        // 네이버는 Schema Markup보다는 메타 태그를 더 활용
        return '';
    }
};

// 실시간 트렌드 키워드용 블로그 생성 함수 (최신 뉴스 검색 포함)
export const generateTrendBlogPost = async (
    topic: string,
    keywords: string[],
    platform: 'naver' | 'google',
    tone: 'friendly' | 'expert' | 'informative' = 'informative',
    contentFormat?: 'comparison' | 'listicle' | 'guide'
): Promise<{ title: string; content: string; format: 'html' | 'markdown' | 'text'; schemaMarkup?: string; htmlPreview?: string; metadata?: { keywords: string; imagePrompt: string; seoTitles: string[] } }> => {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // 오늘 날짜
    const today = new Date();
    const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    const toneMap = {
        friendly: '친근하고 대화하는 듯한 톤 ("~해요", "~예요" 반말체)',
        expert: '전문가의 논문체 톤 ("~바랍니다", "~것입니다", 데이터와 연구 인용, 심층 분석)',
        informative: '객관적이고 중립적인 뉴스 기사 톤 ("~합니다", "~입니다" 격식체)'
    };

    // 구글용 형식 템플릿 및 지침 (네이버는 형식 구분 없음)
    const formatTemplates = {
        comparison: `비교 개요 → 각 옵션 상세 분석 (주제에 맞게 비교 표, 장단점, 추천 등을 선택적으로 활용)`,
        listicle: `소개 → 번호별 항목 상세 설명 (필요시 요약 표 추가)`,
        guide: `소개 → 단계별 설명 (주제에 따라 준비물, 문제해결, 체크리스트 선택적 포함)`
    };

    const formatInstructions = {
        comparison: `비교형 글 작성 지침:
- 두 옵션을 공정하게 비교하고, 각각의 장단점을 명확히 제시하세요
- 주제에 따라 적절한 구조 선택: 비교 표는 필수가 아니며, 내용에 맞게 사용 여부 결정
- 상황별 추천 제공 (선택사항: 주제가 추천이 필요한 경우만)
- Q&A는 필요한 경우에만 포함 (예: 비교 관련 흔한 질문이 있을 때)`,
        listicle: `리스트형 글 작성 지침:
- 3-10개의 명확한 항목으로 구성하고, 각 항목에 번호와 소제목 부여
- 각 항목별 핵심 포인트 강조
- 요약 표/체크리스트는 선택사항: 항목이 많거나 비교가 필요할 때만 사용
- Q&A는 필요한 경우에만 포함`,
        guide: `가이드형 글 작성 지침:
- 단계별로 명확한 순서 제시, 각 단계의 목표 명시
- 준비물/사전 요구사항은 필요한 경우에만 포함 (예: 기술 가이드, 요리 레시피 등)
- 문제 해결/FAQ는 주제에 따라 선택적으로 포함 (예: 기술 가이드, 설치 가이드 등)
- 체크리스트는 복잡한 절차일 때만 포함
- 단순한 주제는 간결하게 핵심 내용만 전달`
    };

    try {
        // 구글용 형식 선택 (기본값: guide)
        const selectedFormat = platform === 'google' && contentFormat ? contentFormat : 'guide';
        const formatTemplate = platform === 'google' ? formatTemplates[selectedFormat] : '';
        const formatInstruction = platform === 'google' ? formatInstructions[selectedFormat] : '';

        // 테마 색상 선택
        const selectedTheme = {
            primary: '#1e40af',    // 파란색
            secondary: '#dbeafe',  // 연한 파란색
            accent: '#eff6ff'      // 매우 연한 파란색
        };

        // 한 번의 API 호출로 최신 정보 검색과 블로그 생성을 동시에 수행
        const combinedPrompt = `
당신은 실시간 트렌드 블로그 작성 전문가입니다.
오늘은 ${formattedDate}입니다.

**중요: 현재 시점(${formattedDate})의 정보를 기반으로 작성하되, 제목이나 본문에 연도(${today.getFullYear()}년)를 명시적으로 포함하지 마세요. 대신 "최신", "요즘", "현재" 등의 표현을 사용하세요.**

주제: ${topic}
핵심 키워드: ${keywords.join(', ')}
작성 톤: ${toneMap[tone]}

중요 지침:
1. 먼저 "${topic}"에 대한 최신 뉴스와 정보를 검색하세요 (${formattedDate} 기준).
2. 실제 일어난 사건, 발표, 이슈 등을 파악하세요.
3. 구체적인 날짜, 인물, 장소, 사실을 포함하세요.
4. "오늘", "최근", "방금", "요즘" 등 시의성 있는 표현을 사용하세요.
5. 대중의 관심사와 반응을 반영하세요.
6. **제목과 본문에 특정 연도(예: "2025년")를 명시하지 마세요. 시간이 지나도 유효한 콘텐츠로 작성하세요.**

${platform === 'naver' ? `
네이버 블로그 형식으로 작성:
- 1800-2000자
- 친근한 대화체
- **이모티콘 사용하지 마세요** (깔끔한 텍스트만)
- [이미지: 설명] 위치 표시
- 최신 트렌드와 실시간 이슈 중심
- 폰트: 본문 16px, 중간제목 19px, 글제목 24px
- 줄간격: line-height 1.8 (180%), 자간: letter-spacing -0.3px

${topic.match(/보험|실손|의료|병원|진료|치료|질병|암|건강보험|실비|보장성|특약/) ? `
⚠️ **보험/의료 관련 주제 - 심의 기준 필수 준수:**
1. 과장 금지: "100% 보장", "무조건 환급", "최고", "최대" 등 단정적 표현 사용 금지
2. 사실 기반: 공식 자료, 통계, 법령 근거만 사용 (추측성 내용 금지)
3. 객관적 표현: 특정 상품/병원 비교 금지, 의견이 아닌 사실만 전달
4. 의료법 준수: 치료 효과 단언 금지, "~할 수 있습니다", "~것으로 알려져 있습니다" 등 완화 표현 사용
5. 광고성 배제: 특정 보험사/병원 홍보 금지, 중립적 정보 제공
6. 출처 명시: 모든 통계/데이터는 출처 명시 (예: 금융감독원, 보건복지부 등)
7. 면책 문구: 글 말미에 "본 내용은 참고용이며, 실제 가입/치료 시 전문가 상담 필요" 등 명시

**필수 포함 사항:**
- 공식 기관 자료 인용 (금융감독원, 보건복지부, 건강보험심사평가원 등)
- 법적 근거 명시 (상법, 의료법 등)
- 면책 문구 및 전문가 상담 권유
` : ''}
` : `
구글 SEO 형식으로 작성:
- 2500-3000자
- HTML 형식 ([TITLE]...[/TITLE], [CONTENT]...[/CONTENT] 태그 사용)
- 구조화된 제목과 소제목
- 최신 정보와 트렌드 포함
- Featured Snippet 최적화

**중요 HTML 스타일 지침 (반드시 준수):**
1. 모든 텍스트 요소에 color 속성 명시 (기본: color: #333 또는 color: #1f2937)
2. 테이블 셀(th, td)에 반드시 color: #333 또는 color: #1f2937 추가
3. 모든 제목(h1, h2, h3)에 color: ${selectedTheme.primary} 적용
4. 테이블 헤더(th)에 background-color와 color 모두 명시
5. 테이블 셀(td)에 border, padding, color 모두 명시
6. 위 템플릿의 HTML 구조와 인라인 스타일을 정확히 따를 것
7. [CONTENT] 태그 안의 모든 HTML은 완전한 인라인 스타일 포함

글 형식: ${selectedFormat === 'comparison' ? '⚖️ 비교형' : selectedFormat === 'listicle' ? '📋 리스트형' : '🎯 가이드형'}
형식 구조: ${formatTemplate}
${formatInstruction}

${selectedFormat === 'comparison' ? `
**비교형 HTML 템플릿 (반드시 이 구조를 따르세요):**

<!-- 비교 개요 -->
<div style="background-color: ${selectedTheme.accent}; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
    <h2 style="color: ${selectedTheme.primary}; margin-top: 0;">[비교 제목]</h2>
    <p style="margin: 0; font-size: 16px; color: #1f2937;">[비교할 두 옵션에 대한 간략한 소개와 비교의 필요성]</p>
</div>

<!-- 비교 표 -->
<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff;">
    <thead>
        <tr>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">비교 항목</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">[옵션 A]</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">[옵션 B]</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="padding: 12px; border: 1px solid #ddd; background-color: #ffffff; color: #1f2937; font-weight: bold;">[비교 항목 1]</td>
            <td style="padding: 12px; border: 1px solid #ddd; background-color: #ffffff; color: #1f2937;">[옵션 A 설명]</td>
            <td style="padding: 12px; border: 1px solid #ddd; background-color: #ffffff; color: #1f2937;">[옵션 B 설명]</td>
        </tr>
    </tbody>
</table>

<!-- 상세 분석 -->
<h2 style="color: ${selectedTheme.primary}; margin-top: 30px;">[옵션 A] 상세 분석</h2>
<p style="color: #333;">[옵션 A에 대한 자세한 설명과 특징]</p>

<!-- 장단점 박스 -->
<div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
    <strong style="color: #1f2937;">✅ 장점</strong><br>
    <ul style="margin: 10px 0 0 20px; padding: 0;">
        <li style="color: #333;">[장점 1]</li>
    </ul>
</div>

<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
    <strong style="color: #1f2937;">❌ 단점</strong><br>
    <ul style="margin: 10px 0 0 20px; padding: 0;">
        <li style="color: #333;">[단점 1]</li>
    </ul>
</div>` : selectedFormat === 'listicle' ? `
**리스트형 HTML 템플릿 (반드시 이 구조를 따르세요):**

<!-- 리스트 소개 -->
<div style="background-color: ${selectedTheme.accent}; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
    <p style="margin: 0; font-size: 16px; color: #1f2937;">[이 리스트를 통해 독자가 얻을 수 있는 가치 설명]</p>
</div>

<!-- 항목 1 -->
<h2 style="color: ${selectedTheme.primary};">1️⃣ [항목 1 제목]</h2>
<p style="color: #333;">[항목 1에 대한 상세 설명]</p>

<div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <p style="margin: 0 0 10px; font-weight: bold; color: #1f2937;">💡 핵심 포인트:</p>
    <ul style="margin: 0 0 0 20px; padding: 0;">
        <li style="margin-bottom: 8px; color: #333;">[포인트 1]</li>
    </ul>
</div>

<!-- 요약 표 -->
<h2 style="color: ${selectedTheme.primary}; margin-top: 30px;">📊 한눈에 보는 요약</h2>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff;">
    <thead>
        <tr>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">순위</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">항목</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">주요 특징</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: #ffffff; font-weight: bold; color: ${selectedTheme.primary};">1</td>
            <td style="padding: 12px; border: 1px solid #ddd; background-color: #ffffff; color: #1f2937;">[항목명]</td>
            <td style="padding: 12px; border: 1px solid #ddd; background-color: #ffffff; color: #1f2937;">[핵심 특징]</td>
        </tr>
    </tbody>
</table>` : `
**가이드형 HTML 템플릿 (반드시 이 구조를 따르세요):**

<!-- 가이드 소개 -->
<div style="background-color: ${selectedTheme.accent}; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
    <p style="margin: 0; font-size: 16px; color: #1f2937;">[이 가이드를 통해 무엇을 배울 수 있는지, 누구에게 유용한지 설명]</p>
</div>

<!-- 준비물/사전 요구사항 -->
<div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
    <strong style="color: #1f2937;">📦 준비물/사전 요구사항</strong><br>
    <ul style="margin: 10px 0 0 20px; padding: 0;">
        <li style="color: #333;">[준비물 1]</li>
        <li style="color: #333;">[준비물 2]</li>
    </ul>
</div>

<!-- 단계 1 -->
<h2 style="color: ${selectedTheme.primary}; margin-top: 30px;">1단계: [단계 제목]</h2>
<p style="margin-bottom: 15px; color: #333;">[이 단계에서 무엇을 하는지 설명]</p>

<div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <p style="margin: 0 0 10px; font-weight: bold; color: #1f2937;">구체적인 방법:</p>
    <ol style="margin: 0 0 0 20px; padding: 0;">
        <li style="margin-bottom: 8px; color: #333;">[세부 단계 1]</li>
        <li style="margin-bottom: 8px; color: #333;">[세부 단계 2]</li>
    </ol>
</div>

<!-- 문제 해결 -->
<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
    <strong style="color: #1f2937;">⚠️ 자주 발생하는 문제와 해결책</strong><br>
    <ul style="margin: 10px 0 0 20px; padding: 0;">
        <li style="color: #333;"><strong>[문제]:</strong> [해결 방법]</li>
    </ul>
</div>`}

**중요: 글 작성 후 반드시 아래 메타데이터도 함께 생성하세요:**

[METADATA]
{
  "keywords": "${keywords.join(', ')}",
  "imagePrompt": "[주제와 관련된 구체적이고 창의적인 이미지 생성 프롬프트를 한글로 작성. 예: ${topic}을 표현하는 현대적이고 미니멀한 일러스트레이션, 파스텔 톤 색상, 깔끔한 배경, 전문적인 블로그 헤더 이미지 스타일]",
  "seoTitles": [
    "[60자 이내 SEO 최적화 제목 1]",
    "[60자 이내 SEO 최적화 제목 2]",
    "[60자 이내 SEO 최적화 제목 3]",
    "[60자 이내 SEO 최적화 제목 4]",
    "[60자 이내 SEO 최적화 제목 5]"
  ]
}
[/METADATA]
`}

반드시 ${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 기준 최신 정보를 반영하여 작성하세요.
`;

        const result = await model.generateContent(combinedPrompt);
        const response = await result.response;
        const text = response.text();

        // 기존 파싱 로직 재사용
        if (platform === 'naver') {
            // 네이버용 텍스트에서 마크다운 코드 블록 제거
            let cleanText = text;
            // ```로 시작하는 코드 블록 제거
            cleanText = cleanText.replace(/```[a-z]*\n?/gi, '');
            cleanText = cleanText.replace(/```/g, '');

            return {
                title: topic,
                content: cleanText,
                format: 'text'
            };
        } else {
            // Google 형식 파싱
            let title = topic;
            let content = text;
            let schemaMarkup = '';

            // 먼저 코드 블록 구문 제거
            content = content.replace(/```html\n?/gi, '');
            content = content.replace(/```json-ld\n?/gi, '');
            content = content.replace(/```/g, '');

            const titleMatch = text.match(/\[TITLE\](.*?)\[\/TITLE\]/s);
            const contentMatch = text.match(/\[CONTENT\](.*?)\[\/CONTENT\]/s);
            const schemaMatch = text.match(/\[SCHEMA\](.*?)\[\/SCHEMA\]/s);

            if (titleMatch) title = titleMatch[1].trim();
            if (contentMatch) {
                content = contentMatch[1].trim();
                // 추가로 코드 블록 제거
                content = content.replace(/```html\n?/gi, '');
                content = content.replace(/```json-ld\n?/gi, '');
                content = content.replace(/```/g, '');
            }
            if (schemaMatch) {
                schemaMarkup = schemaMatch[1].trim();
                // Schema에서도 코드 블록 제거
                schemaMarkup = schemaMarkup.replace(/```json-ld\n?/gi, '');
                schemaMarkup = schemaMarkup.replace(/```/g, '');
            }

            // Metadata 파싱 (구글 전용)
            let metadata = undefined;
            const metadataMatch = text.match(/\[METADATA\]([\s\S]*?)\[\/METADATA\]/);
            if (metadataMatch) {
                try {
                    const metadataText = metadataMatch[1].trim();
                    const parsedMetadata = JSON.parse(metadataText);
                    metadata = {
                        keywords: parsedMetadata.keywords || keywords.join(', '),
                        imagePrompt: parsedMetadata.imagePrompt || '',
                        seoTitles: parsedMetadata.seoTitles || []
                    };
                } catch (e) {
                    console.error('Metadata parsing error:', e);
                    // 파싱 실패 시 기본값 사용
                    metadata = {
                        keywords: keywords.join(', '),
                        imagePrompt: `${topic}을 표현하는 현대적이고 미니멀한 일러스트레이션`,
                        seoTitles: [title]
                    };
                }
            }

            return {
                title,
                content,
                format: 'html',
                schemaMarkup,
                metadata
            };
        }

    } catch (error) {
        console.error('트렌드 블로그 생성 중 오류:', error);
        console.log('일반 블로그 생성으로 폴백합니다.');
        // 오류 발생시 일반 블로그 생성 함수 사용
        return generateBlogPost(topic, keywords, platform, tone, contentFormat);
    }
};

// 뉴스 정보를 포함한 블로그 생성 함수
const generateBlogPostWithNews = async (
    topic: string,
    keywords: string[],
    platform: 'naver' | 'google',
    tone: 'friendly' | 'expert' | 'informative',
    newsInfo: any
): Promise<{ title: string; content: string; format: 'html' | 'markdown' | 'text'; schemaMarkup?: string; htmlPreview?: string; metadata?: { keywords: string; imagePrompt: string; seoTitles: string[] } }> => {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const today = new Date();
    const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

    const toneMap = {
        friendly: '친근하고 대화하는 듯한 톤 ("~해요", "~예요" 반말체)',
        expert: '전문가의 논문체 톤 ("~바랍니다", "~것입니다", 데이터와 연구 인용, 심층 분석)',
        informative: '객관적이고 중립적인 뉴스 기사 톤 ("~합니다", "~입니다" 격식체)'
    };

    // 테마 색상 정의 (구글 SEO용)
    const selectedTheme = {
        primary: '#1e40af',    // 파란색
        secondary: '#dbeafe',  // 연한 파란색
        accent: '#eff6ff'      // 매우 연한 파란색
    };

    // 실제 뉴스 정보를 포함한 프롬프트 생성
    const enhancedPrompt = `
당신은 실시간 트렌드 블로그 작성 전문가입니다.
오늘은 ${formattedDate}입니다.

**중요: 현재 시점(${formattedDate})의 정보를 기반으로 작성하되, 제목이나 본문에 연도(${today.getFullYear()}년)를 명시적으로 포함하지 마세요. 대신 "최신", "요즘", "현재" 등의 표현을 사용하세요.**

주제: ${topic}
핵심 키워드: ${keywords.join(', ')}

## 오늘의 실제 뉴스 정보:
- 핵심 사실: ${newsInfo.mainFact || topic}
- 관련 인물: ${newsInfo.people?.join(', ') || ''}
- 시간/장소: ${newsInfo.whenWhere || formattedDate}
- 세부 정보: ${newsInfo.details?.join('\n') || ''}
- 대중 반응: ${newsInfo.reactions?.join('\n') || ''}

위의 실제 뉴스 정보를 바탕으로 ${platform === 'naver' ? '네이버' : '구글'} SEO에 최적화된 블로그 글을 작성해주세요.

중요 지침:
1. 반드시 오늘 일어난 실제 사건/뉴스를 중심으로 작성
2. 구체적인 사실과 정보를 포함

3. **말투별 문체 - 엄격히 준수:**
   ${tone === 'friendly' ? `
   - 친근한 반말체: "~해요", "~예요", "~더라고요", "~했어요", "~네요"
   - 감탄사 적극 사용: "정말", "진짜", "완전", "너무"
   - 독자에게 직접 말하듯: "여러분도 한번 해보세요!", "저도 써봤는데요~"
   - 예시: "정말 좋더라고요!", "한번 해보세요~", "저도 써봤는데요", "완전 대박이에요!"
   ` : tone === 'expert' ? `
   - 전문가 논문체: "~입니다", "~습니다", "~바랍니다", "~것으로 나타났습니다", "~것으로 분석됩니다"
   - 데이터와 통계 필수 인용: "XX% 증가", "조사 결과", "연구에 따르면"
   - 학술적 표현: "고려해야 합니다", "주목할 필요가 있습니다", "시사하는 바가 큽니다"
   - 예시: "연구 결과에 따르면", "2025년 조사에서는", "분석 결과", "전문가들은 지적합니다"
   ` : `
   - 뉴스 기사체: "~합니다", "~입니다", "~했습니다", "~것으로 알려졌습니다", "~것으로 전해졌습니다"
   - 객관적이고 중립적인 톤: 감정 배제, 사실 중심
   - 보도 표현: "밝혔다", "전했다", "발표했다", "나타났다"
   - 예시: "최근 발표에 따르면", "업계에서는", "전문가들은 분석합니다", "조사 결과 나타났습니다"
   `}

4. 실시간 트렌드임을 강조 (예: "오늘", "방금", "최신 소식" 등)
5. 대중의 관심사와 반응 포함

${platform === 'naver' ? `
네이버 블로그 형식:
- 1800-2000자
- ${tone === 'friendly' ? '친근한 반말 대화체 ("~해요", "~예요")' : tone === 'expert' ? '전문가 논문체 ("~입니다", "~습니다")' : '뉴스 기사체 ("~합니다", "~입니다")'}
- **이모티콘 사용하지 마세요** (깔끔한 텍스트만)
- [이미지: 설명] 위치 표시

**네이버 블로그 에디터 최적화 (필수):**
1. 폰트 크기: 본문 16px, 중간제목(h3) 19px, 글제목(h2) 24px
2. 줄간격: line-height: 1.8 (180% - 네이버 기본값)
3. 문단 간격: margin-bottom: 20px
4. 자간: letter-spacing: -0.3px (네이버 기본값)

${topic.match(/보험|실손|의료|병원|진료|치료|질병|암|건강보험|실비|보장성|특약/) ? `
⚠️ **보험/의료 관련 주제 - 심의 기준 필수 준수:**
1. 과장 금지: "100% 보장", "무조건 환급", "최고", "최대" 등 단정적 표현 사용 금지
2. 사실 기반: 공식 자료, 통계, 법령 근거만 사용 (추측성 내용 금지)
3. 객관적 표현: 특정 상품/병원 비교 금지, 의견이 아닌 사실만 전달
4. 의료법 준수: 치료 효과 단언 금지, "~할 수 있습니다", "~것으로 알려져 있습니다" 등 완화 표현 사용
5. 광고성 배제: 특정 보험사/병원 홍보 금지, 중립적 정보 제공
6. 출처 명시: 모든 통계/데이터는 출처 명시 (예: 금융감독원, 보건복지부 등)
7. 면책 문구: 글 말미에 "본 내용은 참고용이며, 실제 가입/치료 시 전문가 상담 필요" 등 명시

**필수 포함 사항:**
- 공식 기관 자료 인용 (금융감독원, 보건복지부, 건강보험심사평가원 등)
- 법적 근거 명시 (상법, 의료법 등)
- 면책 문구 및 전문가 상담 권유
` : ''}

**HTML 스타일 템플릿 - 네이버에서는 태그만 있고 인라인 스타일로 h 태그 느낌 구현:**
- 본문: <p style="font-size: 16px; color: #333; line-height: 1.8; letter-spacing: -0.3px; margin-bottom: 20px;">텍스트</p>
- 글제목(h2 느낌): <h2 style="font-size: 24px; color: #2C3E50; font-weight: bold; margin: 35px 0 15px 0; line-height: 1.4; letter-spacing: -0.3px;">제목</h2>
- 중간제목(h3 느낌): <h3 style="font-size: 19px; color: #2C3E50; font-weight: bold; margin: 25px 0 12px 0; line-height: 1.5; letter-spacing: -0.3px;">소제목</h3>
- 강조: <span style="font-size: 16px; color: #FF6B6B; font-weight: bold;">강조</span>

**색상 사용:**
- 제목: #2C3E50 (진한 회색)
- 본문: #333333 (검정)
- 강조: #FF6B6B (빨강), #4A90E2 (파랑)
` : `
구글 SEO 형식:
- 2500-3000자
- HTML 형식 ([TITLE]...[/TITLE], [CONTENT]...[/CONTENT] 태그 사용)
- 구조화된 제목과 소제목
- Schema markup 포함
- ${tone === 'friendly' ? '친근한 반말 대화체' : tone === 'expert' ? '전문가 논문체' : '뉴스 기사체'}

**중요 HTML 스타일 지침 (반드시 준수):**
1. 모든 텍스트 요소에 color 속성 명시 (기본: color: #333 또는 color: #1f2937)
2. 테이블 셀(th, td)에 반드시 color: #333 또는 color: #1f2937 추가
3. 모든 제목(h1, h2, h3)에 color: ${selectedTheme.primary} 적용
4. 테이블 헤더(th)에 background-color와 color 모두 명시
5. 테이블 셀(td)에 border, padding, color 모두 명시
6. 위 템플릿의 HTML 구조와 인라인 스타일을 정확히 따를 것
7. [CONTENT] 태그 안의 모든 HTML은 완전한 인라인 스타일 포함

**뉴스 기사 HTML 템플릿 (반드시 이 구조를 따르세요):**

<div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
    <strong style="color: #1f2937;">📰 핵심 뉴스 요약</strong><br>
    <ul style="margin: 10px 0 0 20px; padding: 0;">
        <li style="color: #333;">[핵심 사실 1]</li>
        <li style="color: #333;">[핵심 사실 2]</li>
        <li style="color: #333;">[핵심 사실 3]</li>
    </ul>
</div>

<h2 style="color: ${selectedTheme.primary}; margin-top: 30px;">오늘의 주요 이슈</h2>
<p style="margin-bottom: 15px; color: #333;">[실시간 뉴스 내용 상세 설명]</p>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff;">
    <thead>
        <tr>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">시간</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">주요 내용</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: #ffffff; color: #1f2937;">[시간]</td>
            <td style="padding: 12px; border: 1px solid #ddd; background-color: #ffffff; color: #1f2937;">[내용]</td>
        </tr>
    </tbody>
</table>

<div style="background-color: ${selectedTheme.accent}; border-left: 4px solid ${selectedTheme.primary}; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
    <strong style="color: #1f2937;">💬 대중 반응</strong><br>
    <p style="margin: 10px 0 0 0; color: #333;">[대중의 반응과 의견]</p>
</div>

**중요: 글 작성 후 반드시 아래 메타데이터도 함께 생성하세요:**

[METADATA]
{
  "keywords": "${keywords.join(', ')}",
  "imagePrompt": "[주제와 관련된 구체적이고 창의적인 이미지 생성 프롬프트를 한글로 작성]",
  "seoTitles": [
    "[60자 이내 SEO 최적화 제목 1]",
    "[60자 이내 SEO 최적화 제목 2]",
    "[60자 이내 SEO 최적화 제목 3]",
    "[60자 이내 SEO 최적화 제목 4]",
    "[60자 이내 SEO 최적화 제목 5]"
  ]
}
[/METADATA]
`}

실제 뉴스 정보를 충실히 반영하여 작성해주세요.
`;

    // 기존 generateBlogPost 로직 활용하되 enhancedPrompt 사용
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();

    // 기존 파싱 로직 재사용...
    if (platform === 'naver') {
        return {
            title: topic,
            content: text,
            format: 'text'
        };
    } else {
        // Google 형식 파싱 로직...
        let title = topic;
        let content = text;
        let schemaMarkup = '';

        const titleMatch = text.match(/\[TITLE\](.*?)\[\/TITLE\]/s);
        const contentMatch = text.match(/\[CONTENT\](.*?)\[\/CONTENT\]/s);
        const schemaMatch = text.match(/\[SCHEMA\](.*?)\[\/SCHEMA\]/s);

        if (titleMatch) title = titleMatch[1].trim();
        if (contentMatch) content = contentMatch[1].trim();
        if (schemaMatch) schemaMarkup = schemaMatch[1].trim();

        // Metadata 파싱 (구글 전용)
        let metadata = undefined;
        const metadataMatch = text.match(/\[METADATA\]([\s\S]*?)\[\/METADATA\]/);
        if (metadataMatch) {
            try {
                const metadataText = metadataMatch[1].trim();
                const parsedMetadata = JSON.parse(metadataText);
                metadata = {
                    keywords: parsedMetadata.keywords || keywords.join(', '),
                    imagePrompt: parsedMetadata.imagePrompt || '',
                    seoTitles: parsedMetadata.seoTitles || []
                };
            } catch (e) {
                console.error('Metadata parsing error:', e);
                metadata = {
                    keywords: keywords.join(', '),
                    imagePrompt: `${topic}을 표현하는 현대적이고 미니멀한 일러스트레이션`,
                    seoTitles: [title]
                };
            }
        }

        return {
            title,
            content,
            format: 'html',
            schemaMarkup,
            metadata
        };
    }
};

export const generateBlogPost = async (
    topic: string,
    keywords: string[],
    platform: 'naver' | 'google',
    tone: 'friendly' | 'expert' | 'informative' = 'informative',
    contentFormat?: 'comparison' | 'listicle' | 'guide'
): Promise<{ title: string; content: string; format: 'html' | 'markdown' | 'text'; schemaMarkup?: string; htmlPreview?: string; metadata?: { keywords: string; imagePrompt: string; seoTitles: string[] } }> => {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const toneMap = {
        friendly: '친근하고 대화하는 듯한 톤 ("~해요", "~예요" 반말체)',
        expert: '전문가의 논문체 톤 ("~바랍니다", "~것입니다", 데이터와 연구 인용, 심층 분석)',
        informative: '객관적이고 중립적인 뉴스 기사 톤 ("~합니다", "~입니다" 격식체)'
    };

    // 네이버 블로그 테마 정의
    const naverThemes = [
        {
            name: '봄날의 정원',
            divider: '✿ ✿ ✿ ✿ ✿',
            bullet: '🌷',
            highlight: '💐',
            subheader: '🌺',
            htmlColor: '#FF69B4'
        },
        {
            name: '바다의 선율',
            divider: '～～～～～',
            bullet: '🐚',
            highlight: '🏖️',
            subheader: '🌊',
            htmlColor: '#4682B4'
        },
        {
            name: '카페 다이어리',
            divider: '☕ • ☕ • ☕',
            bullet: '☕',
            highlight: '📝',
            subheader: '📖',
            htmlColor: '#8B4513'
        },
        {
            name: '달빛 산책',
            divider: '✦ ✦ ✦ ✦ ✦',
            bullet: '⭐',
            highlight: '🌟',
            subheader: '🌙',
            htmlColor: '#4B0082'
        },
        {
            name: '행운의 클로버',
            divider: '🍀 — 🍀 — 🍀',
            bullet: '🌱',
            highlight: '🌿',
            subheader: '🍀',
            htmlColor: '#228B22'
        }
    ];

    const selectedNaverTheme = naverThemes[Math.floor(Math.random() * naverThemes.length)];

    let prompt = '';
    
    if (platform === 'naver') {
        prompt = `
당신은 네이버 블로그 SEO 전문가입니다. C-rank와 DIA 로직을 완벽히 이해하고 있습니다.

**🚨 엄격한 규칙 - 반드시 준수:**
1. **제목과 본문에 절대로 연도를 표기하지 마세요** (예: 2025년, 2024년 등 금지)
2. "최신", "요즘", "현재" 같은 시간 표현은 사용 가능하지만 구체적인 연도는 절대 금지
3. 제목에 숫자를 사용하는 경우, 순위나 개수(TOP 10, 5가지 등)는 피하고 구체적인 정보 제공에 집중

주제: ${topic}
핵심 키워드: ${keywords.join(', ')}
작성 톤: ${toneMap[tone]}

## 선택된 테마: ${selectedNaverTheme.name}
- 테마 색상: ${selectedNaverTheme.htmlColor}
- 구분선: ${selectedNaverTheme.divider}
- 글머리: ${selectedNaverTheme.bullet}
- 강조: ${selectedNaverTheme.highlight}
- 소제목: ${selectedNaverTheme.subheader}

네이버 블로그용 글을 HTML 형식으로 작성해주세요.

**출력 형식:**
[TITLE]
SEO 최적화된 제목 (키워드 포함)
[/TITLE]

[CONTENT]
<div style="font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif; line-height: 1.8; color: #333; font-size: 15px;">

    <!-- 제목 -->
    <h1 style="font-size: 26px; font-weight: bold; color: ${selectedNaverTheme.htmlColor}; margin-bottom: 20px; border-bottom: 3px solid ${selectedNaverTheme.htmlColor}; padding-bottom: 10px;">
        ${selectedNaverTheme.highlight} [매력적인 제목]
    </h1>

    <!-- 도입부 -->
    <p style="margin-bottom: 15px; line-height: 1.8;">[흥미로운 질문이나 통계로 시작하는 도입부]</p>

    <!-- 구분선 -->
    <p style="text-align: center; color: ${selectedNaverTheme.htmlColor}; font-size: 20px; margin: 25px 0;">
        ${selectedNaverTheme.divider}
    </p>

    <!-- 소제목 1 -->
    <h2 style="font-size: 20px; font-weight: bold; color: ${selectedNaverTheme.htmlColor}; margin: 25px 0 15px; padding: 10px; background: linear-gradient(90deg, ${selectedNaverTheme.htmlColor}15 0%, transparent 100%); border-left: 4px solid ${selectedNaverTheme.htmlColor};">
        ${selectedNaverTheme.subheader} [소제목 1]
    </h2>

    <p style="margin-bottom: 15px; line-height: 1.8;">[본문 내용]</p>

    <!-- 강조 포인트 -->
    <div style="background-color: #f8f9fa; border-left: 4px solid ${selectedNaverTheme.htmlColor}; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; line-height: 1.8;">
            <strong style="color: ${selectedNaverTheme.htmlColor};">${selectedNaverTheme.bullet} 핵심 포인트:</strong> [중요한 내용]
        </p>
    </div>

    <!-- 이미지 플레이스홀더 -->
    <div style="background: linear-gradient(135deg, ${selectedNaverTheme.htmlColor}20 0%, ${selectedNaverTheme.htmlColor}10 100%); border: 2px dashed ${selectedNaverTheme.htmlColor}; border-radius: 10px; padding: 30px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: ${selectedNaverTheme.htmlColor}; font-weight: bold;">📷 [이미지: 설명]</p>
        <p style="margin: 5px 0 0; font-size: 13px; color: #666;">※ 이 위치에 이미지를 삽입하세요</p>
    </div>

    <!-- 마무리 -->
    <div style="background-color: ${selectedNaverTheme.htmlColor}10; padding: 20px; border-radius: 10px; margin-top: 30px;">
        <p style="margin: 0; line-height: 1.8; font-weight: 500;">[핵심 요약과 행동 유도]</p>
    </div>

</div>
[/CONTENT]

**작성 가이드:**

1. **글 구조 (테마 적용) - 필수 준수:**
   - 제목, 소제목, 강조 부분에 테마 색상(${selectedNaverTheme.htmlColor}) 반드시 사용
   - 이모지(${selectedNaverTheme.highlight}, ${selectedNaverTheme.subheader}, ${selectedNaverTheme.bullet}) 모든 섹션에 배치
   - 3-4개의 소제목으로 본문 구성
   - 각 섹션마다 구분선(${selectedNaverTheme.divider}) 필수 삽입

2. **말투별 문체 - 엄격히 준수:**
   ${tone === 'friendly' ? `
   - 친근한 반말체: "~해요", "~예요", "~더라고요", "~했어요"
   - 예시: "정말 좋더라고요!", "한번 해보세요~", "저도 써봤는데요"
   ` : tone === 'expert' ? `
   - 전문가 논문체: "~입니다", "~바랍니다", "~것으로 나타났습니다"
   - 데이터와 통계 필수 인용
   - 예시: "연구 결과에 따르면", "2025년 조사에서는", "분석 결과"
   ` : `
   - 뉴스 기사체: "~합니다", "~입니다", "~했습니다"
   - 객관적이고 중립적인 톤
   - 예시: "최근 발표에 따르면", "업계에서는", "전문가들은 분석합니다"
   `}

3. **HTML 스타일 - 반드시 적용:**
   - 모든 텍스트에 style 속성 포함
   - 색상, 굵기, 크기를 인라인 스타일로만 지정
   - <span>, <strong>, <p>, <h1-h3>, <div> 태그 적극 활용
   - 네이버 블로그 복사/붙여넣기 완벽 호환

4. **시각적 요소 강화:**
   - 중요 문장은 <strong style="color: ${selectedNaverTheme.htmlColor};">로 강조
   - 박스, 테두리, 배경색 적극 사용
   - 이미지 플레이스홀더 눈에 띄게 표시

5. **SEO 최적화:**
   - 키워드 자연스럽게 포함 (밀도 3-5%)
   - 사용자 체류시간 증가 콘텐츠
   - 검색 의도 명확한 답변

6. **총 1800-2000자로 작성**

**중요:**
- HTML 형식으로 작성하되, 네이버 블로그 복사/붙여넣기 호환 유지
- **절대 C-rank, DIA, SEO 알고리즘 같은 용어를 글 내용에 언급하지 마세요**
- **주제(${topic})에만 집중하여 자연스러운 블로그 글을 작성하세요**
- 이미지 플레이스홀더는 시각적으로 눈에 띄게 표시
        `.trim();
    } else {
        // Google SEO with GEMS Guidelines and Random Theme
        const themes = [
            { name: '블루-그레이', primary: '#1a73e8', secondary: '#f5f5f5', accent: '#e8f4fd' },
            { name: '그린-오렌지', primary: '#00796b', secondary: '#fff3e0', accent: '#e0f2f1' },
            { name: '퍼플-옐로우', primary: '#6200ea', secondary: '#fffde7', accent: '#f3e5f5' },
            { name: '틸-라이트그레이', primary: '#00897b', secondary: '#fafafa', accent: '#e0f2f1' },
            { name: '테라코타-라이트그레이', primary: '#d84315', secondary: '#f5f5f5', accent: '#ffccbc' },
            { name: '클래식 블루', primary: '#1565c0', secondary: '#e3f2fd', accent: '#bbdefb' },
            { name: '네이처 그린', primary: '#2e7d32', secondary: '#e8f5e9', accent: '#c8e6c9' },
            { name: '로얄 퍼플', primary: '#4a148c', secondary: '#f3e5f5', accent: '#e1bee7' },
            { name: '퓨처 틸', primary: '#00acc1', secondary: '#e0f7fa', accent: '#b2ebf2' },
            { name: '어스 테라코타', primary: '#bf360c', secondary: '#fbe9e7', accent: '#ffccbc' }
        ];

        const selectedTheme = themes[Math.floor(Math.random() * themes.length)];

        // 형식별 구조 템플릿
        const formatTemplates = {
            comparison: `
    <!-- 비교 개요 섹션 -->
    <div style="background-color: ${selectedTheme.accent}; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="font-size: 22px; color: ${selectedTheme.primary}; margin: 0 0 15px;">⚖️ 비교 개요</h2>
        <p style="margin: 0; color: #1f2937;">[두 옵션/제품/방법을 간단히 소개하고 비교의 필요성 설명]</p>
    </div>

    <!-- 비교 표 -->
    <h2 style="font-size: 22px; color: ${selectedTheme.primary}; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #eaeaea;">
        <strong>📊 핵심 비교</strong>
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff;">
        <thead>
            <tr>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">비교 항목</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">[옵션 A]</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">[옵션 B]</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="padding: 12px; border: 1px solid #ddd; background-color: #ffffff; color: #1f2937; font-weight: bold;">[비교 항목 1]</td>
                <td style="padding: 12px; border: 1px solid #ddd; background-color: #ffffff; color: #1f2937;">[옵션 A 설명]</td>
                <td style="padding: 12px; border: 1px solid #ddd; background-color: #ffffff; color: #1f2937;">[옵션 B 설명]</td>
            </tr>
        </tbody>
    </table>

    <!-- 상세 비교 섹션 -->
    <h2 style="font-size: 22px; color: ${selectedTheme.primary}; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #eaeaea;">
        <strong>🔍 상세 비교 분석</strong>
    </h2>
    <h3 style="font-size: 18px; color: #333; margin: 20px 0 10px;">1. [비교 기준 1]</h3>
    <p style="margin-bottom: 15px; color: #333;">[상세 설명]</p>

    <!-- 장단점 박스 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
        <div style="border: 2px solid #4caf50; padding: 15px; border-radius: 8px;">
            <h4 style="color: #4caf50; margin: 0 0 10px; font-size: 16px;">✅ [옵션 A] 장점</h4>
            <ul style="margin: 0; padding-left: 20px;">
                <li style="color: #333;">[장점 1]</li>
            </ul>
        </div>
        <div style="border: 2px solid #f44336; padding: 15px; border-radius: 8px;">
            <h4 style="color: #f44336; margin: 0 0 10px; font-size: 16px;">❌ [옵션 A] 단점</h4>
            <ul style="margin: 0; padding-left: 20px;">
                <li style="color: #333;">[단점 1]</li>
            </ul>
        </div>
    </div>

    <!-- 추천 결론 -->
    <div style="background-color: ${selectedTheme.secondary}; padding: 20px; border-radius: 8px; margin-top: 30px;">
        <h2 style="font-size: 20px; color: ${selectedTheme.primary}; margin: 0 0 10px;">💡 어떤 것을 선택해야 할까요?</h2>
        <p style="margin-bottom: 10px; color: #1f2937;"><strong>[옵션 A]를 선택해야 하는 경우:</strong></p>
        <ul style="margin: 0 0 15px 20px;">
            <li style="color: #333;">[상황 1]</li>
        </ul>
        <p style="margin-bottom: 10px; color: #1f2937;"><strong>[옵션 B]를 선택해야 하는 경우:</strong></p>
        <ul style="margin: 0 0 0 20px;">
            <li style="color: #333;">[상황 1]</li>
        </ul>
    </div>`,
            listicle: `
    <!-- 리스트 소개 -->
    <div style="background-color: ${selectedTheme.accent}; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <p style="margin: 0; font-size: 16px; color: #1f2937;">[이 리스트가 왜 유용한지, 어떤 기준으로 선정했는지 설명]</p>
    </div>

    <!-- 리스트 아이템 1 -->
    <h2 style="font-size: 22px; color: ${selectedTheme.primary}; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #eaeaea;">
        <strong>1️⃣ [첫 번째 항목 제목]</strong>
    </h2>
    <p style="margin-bottom: 15px; color: #333;">[항목에 대한 상세한 설명과 이유]</p>

    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid ${selectedTheme.primary}; margin: 15px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #1f2937;"><strong>💡 핵심 포인트:</strong> [이 항목의 가장 중요한 특징이나 장점]</p>
    </div>

    <!-- 리스트 아이템 2 -->
    <h2 style="font-size: 22px; color: ${selectedTheme.primary}; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #eaeaea;">
        <strong>2️⃣ [두 번째 항목 제목]</strong>
    </h2>
    <p style="margin-bottom: 15px;">[항목에 대한 상세한 설명과 이유]</p>

    <!-- 요약 표 -->
    <h2 style="font-size: 22px; color: ${selectedTheme.primary}; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #eaeaea;">
        <strong>📋 한눈에 보는 요약</strong>
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff;">
        <thead>
            <tr>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">순위</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">항목</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd; background-color: ${selectedTheme.secondary}; color: #1f2937; font-weight: bold;">주요 특징</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="padding: 12px; text-align: center; border: 1px solid #ddd; background-color: #ffffff; font-weight: bold; color: ${selectedTheme.primary};">1</td>
                <td style="padding: 12px; border: 1px solid #ddd; background-color: #ffffff; color: #1f2937;">[항목명]</td>
                <td style="padding: 12px; border: 1px solid #ddd; background-color: #ffffff; color: #1f2937;">[핵심 특징]</td>
            </tr>
        </tbody>
    </table>`,
            guide: `
    <!-- 가이드 소개 -->
    <div style="background-color: ${selectedTheme.accent}; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <p style="margin: 0; font-size: 16px; color: #1f2937;">[이 가이드를 통해 무엇을 배울 수 있는지, 누구에게 유용한지 설명]</p>
    </div>

    <!-- 준비물/사전 요구사항 -->
    <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #1f2937;">📦 준비물/사전 요구사항</strong><br>
        <ul style="margin: 10px 0 0 20px; padding: 0;">
            <li style="color: #333;">[준비물 1]</li>
            <li style="color: #333;">[준비물 2]</li>
        </ul>
    </div>

    <!-- 단계 1 -->
    <h2 style="font-size: 22px; color: ${selectedTheme.primary}; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #eaeaea;">
        <strong>1단계: [단계 제목]</strong> 🎯
    </h2>
    <p style="margin-bottom: 15px; color: #333;">[이 단계에서 무엇을 하는지 설명]</p>

    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="margin: 0 0 10px; font-weight: bold; color: #1f2937;">구체적인 방법:</p>
        <ol style="margin: 0 0 0 20px; padding: 0;">
            <li style="margin-bottom: 8px; color: #333;">[세부 단계 1]</li>
            <li style="margin-bottom: 8px; color: #333;">[세부 단계 2]</li>
        </ol>
    </div>

    <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #1f2937;">💡 팁:</strong> <span style="color: #333;">[이 단계에서 유용한 팁이나 주의사항]</span>
    </div>

    <!-- 단계 2 -->
    <h2 style="font-size: 22px; color: ${selectedTheme.primary}; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #eaeaea;">
        <strong>2단계: [단계 제목]</strong> 🔧
    </h2>
    <p style="margin-bottom: 15px;">[이 단계에서 무엇을 하는지 설명]</p>

    <!-- 문제 해결 섹션 -->
    <h2 style="font-size: 22px; color: ${selectedTheme.primary}; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #eaeaea;">
        <strong>⚠️ 흔한 문제와 해결 방법</strong>
    </h2>

    <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="margin: 0 0 10px; font-weight: bold; color: #d32f2f;">문제: [흔한 문제 상황]</p>
        <p style="margin: 0; color: #333;"><strong>해결:</strong> [구체적인 해결 방법]</p>
    </div>

    <!-- 체크리스트 -->
    <div style="background-color: ${selectedTheme.secondary}; padding: 20px; border-radius: 8px; margin-top: 30px;">
        <h2 style="font-size: 20px; color: ${selectedTheme.primary}; margin: 0 0 10px;">✅ 완료 체크리스트</h2>
        <ul style="margin: 0 0 0 20px; padding: 0; list-style: none;">
            <li style="margin-bottom: 8px;">☐ [체크 항목 1]</li>
            <li style="margin-bottom: 8px;">☐ [체크 항목 2]</li>
        </ul>
    </div>`
        };

        const formatInstructions = {
            comparison: `
비교형 글 작성 지침:
- 두 옵션/제품/방법을 공정하게 비교
- 비교 표를 활용하여 항목별로 명확히 대조
- 각 옵션의 장단점을 균형있게 제시
- 상황별 추천을 명확히 제공
- 객관적인 데이터와 사실 기반 비교`,
            listicle: `
리스트형 글 작성 지침:
- 3-10개의 명확한 항목으로 구성
- 각 항목은 숫자 이모지(1️⃣, 2️⃣)로 시작
- 항목별 핵심 포인트 박스 포함
- 마지막에 요약 표로 한눈에 정리
- 항목 순서는 중요도/인기도/난이도 순으로 배치`,
            guide: `
가이드형 글 작성 지침:
- 단계별로 명확한 순서 제시 (1단계, 2단계...)
- 각 단계마다 구체적인 실행 방법 포함
- 준비물/사전 요구사항 명시
- 각 단계마다 팁과 주의사항 추가
- 흔한 문제와 해결 방법 섹션 포함
- 완료 체크리스트로 마무리`
        };

        const selectedFormat = contentFormat || 'guide'; // 기본값은 가이드형
        const formatTemplate = formatTemplates[selectedFormat];
        const formatInstruction = formatInstructions[selectedFormat];

        prompt = `
당신은 구글 SEO 전문가이자 GEMS 가이드라인을 완벽히 이해하는 콘텐츠 크리에이터입니다.

**🚨 엄격한 규칙 - 반드시 준수:**
1. **제목과 본문에 절대로 연도를 표기하지 마세요** (예: 2025년, 2024년 등 금지)
2. "최신", "요즘", "현재" 같은 시간 표현은 사용 가능하지만 구체적인 연도는 절대 금지
3. 제목에 숫자를 사용하는 경우, 순위나 개수(TOP 10, 5가지 등)는 피하고 구체적인 정보 제공에 집중
4. **반드시 데스크톱 버전의 Google 검색을 사용하여 정보를 검색하세요**

주제: ${topic}
핵심 키워드: ${keywords.join(', ')}
작성 톤: ${toneMap[tone]}
글 형식: ${selectedFormat === 'comparison' ? '비교형' : selectedFormat === 'listicle' ? '리스트형' : '가이드형'}
선택된 테마: ${selectedTheme.name} (Primary: ${selectedTheme.primary}, Secondary: ${selectedTheme.secondary})

${formatInstruction}

GEMS 가이드라인에 따라 전문적이고 시각적인 구글 SEO 최적화 블로그 글을 작성해주세요.

**출력 형식: 반드시 아래 형식을 정확히 따라주세요**

[TITLE]
SEO 최적화된 제목 (60자 이내, 키워드 포함)
[/TITLE]

[CONTENT]
<div style="font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; font-size: 16px; box-sizing: border-box;">

    <!-- 메타설명 박스 -->
    <div style="background-color: ${selectedTheme.secondary}; padding: 15px; border-radius: 8px; font-style: italic; margin-bottom: 25px; font-size: 15px; color: #1f2937;">
        <strong>[핵심 질문/키워드]</strong> [독자의 호기심을 자극하는 1-2문장]
    </div>

    <!-- 도입부 -->
    <p style="margin-bottom: 15px; color: #333;">[개인적 경험이나 공감대 형성, 문제 제기, 해결책 암시, 적절한 이모티콘 😊]</p>

    <!-- 섹션 간 여백 -->
    <p data-ke-size="size16">&nbsp;</p>

${formatTemplate}

    <!-- FAQ 섹션 -->
    <h2 style="font-size: 22px; color: ${selectedTheme.primary}; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #eaeaea;">
        <strong>자주 묻는 질문 (FAQ)</strong> ❓
    </h2>

    <h3 style="font-size: 18px; color: #333; margin: 20px 0 10px;">[질문 1]</h3>
    <p style="margin-bottom: 15px; color: #333;">[답변]</p>


</div>
[/CONTENT]

[METADATA]
{
  "keywords": "${keywords.join(', ')}",
  "imagePrompt": "[주제와 관련된 구체적이고 창의적인 이미지 생성 프롬프트를 한글로 작성. 예: ${topic}을 표현하는 현대적이고 미니멀한 일러스트레이션, 파스텔 톤 색상, 깔끔한 배경, 전문적인 블로그 헤더 이미지 스타일]",
  "seoTitles": [
    "[60자 이내 SEO 최적화 제목 1]",
    "[60자 이내 SEO 최적화 제목 2]",
    "[60자 이내 SEO 최적화 제목 3]",
    "[60자 이내 SEO 최적화 제목 4]",
    "[60자 이내 SEO 최적화 제목 5]"
  ]
}
[/METADATA]

작성 요구사항:
1. 총 2500-3000자로 작성 (한글 기준)
2. E-E-A-T 원칙 적용 (경험, 전문성, 권위, 신뢰성)
3. Featured Snippet을 위한 직접적인 답변 포함
4. 테이블과 리스트를 적극 활용
5. LSI 키워드 자연스럽게 포함
6. ${toneMap[tone]}으로 일관되게 작성
7. 적절한 이모티콘으로 친근감 추가
8. 시각적 구분을 위한 박스와 하이라이트 활용

**중요 HTML 스타일 지침 (반드시 준수):**
1. 모든 텍스트 요소에 color 속성 명시 (기본: color: #333 또는 color: #1f2937)
2. 테이블 셀(th, td)에 반드시 color: #333 또는 color: #1f2937 추가
3. 모든 제목(h1, h2, h3)에 color: ${selectedTheme.primary} 적용
4. 테이블 헤더(th)에 background-color와 color 모두 명시
5. 테이블 셀(td)에 border, padding, color 모두 명시
6. 위 템플릿의 HTML 구조와 인라인 스타일을 정확히 따를 것
7. [CONTENT] 태그 안의 모든 HTML은 완전한 인라인 스타일 포함

반드시 데스크톱 검색 결과를 기반으로 작성하세요.
        `.trim();
    }

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let content = text.trim();

        // Extract title and content
        let title = '';
        let finalContent = content;

        // 네이버와 구글 모두 [TITLE], [CONTENT] 형식 사용
        const titleMatch = content.match(/\[TITLE\]([\s\S]*?)\[\/TITLE\]/);
        const contentMatch = content.match(/\[CONTENT\]([\s\S]*?)\[\/CONTENT\]/);

        if (titleMatch && contentMatch) {
            title = titleMatch[1].trim();
            finalContent = contentMatch[1].trim();
        } else {
            // 구형 포맷 처리 (폴백)
            const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/);
            title = h1Match ? h1Match[1].replace(/<[^>]+>/g, '') : topic;
            finalContent = content;
        }

        // Schema Markup 생성 (Google용)
        let schemaMarkup = '';
        if (platform === 'google') {
            const description = `${topic}에 대한 종합적인 가이드. ${keywords.join(', ')} 관련 전문적인 정보와 실용적인 팁을 제공합니다.`;
            schemaMarkup = generateSchemaMarkup(title, description, keywords, platform);
        }

        // 네이버용 HTML 미리보기 생성
        let htmlPreview = '';
        if (platform === 'naver' && finalContent) {
            const theme = naverThemes.find(t => finalContent.includes(t.name)) || naverThemes[0];
            htmlPreview = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

        body {
            font-family: 'Noto Sans KR', sans-serif;
            line-height: 1.8;
            max-width: 700px;
            margin: 0 auto;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        h1 {
            color: ${theme.htmlColor};
            font-size: 28px;
            border-bottom: 3px solid ${theme.htmlColor};
            padding-bottom: 15px;
            margin-bottom: 30px;
        }

        h2 {
            color: ${theme.htmlColor};
            font-size: 22px;
            margin: 30px 0 15px;
            padding: 10px;
            background: linear-gradient(90deg, ${theme.htmlColor}10 0%, transparent 100%);
            border-left: 4px solid ${theme.htmlColor};
        }

        .divider {
            text-align: center;
            margin: 30px 0;
            color: ${theme.htmlColor};
            font-size: 20px;
            opacity: 0.6;
        }

        .image-placeholder {
            background: linear-gradient(135deg, ${theme.htmlColor}20 0%, ${theme.htmlColor}10 100%);
            border: 2px dashed ${theme.htmlColor};
            border-radius: 10px;
            padding: 30px;
            margin: 20px 0;
            text-align: center;
            color: ${theme.htmlColor};
            font-weight: 500;
        }

        p {
            margin: 15px 0;
            color: #333;
            font-size: 16px;
        }

        .highlight {
            background: ${theme.htmlColor}15;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 500;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid ${theme.htmlColor}30;
            color: ${theme.htmlColor};
        }

        ul {
            list-style: none;
            padding-left: 0;
        }

        ul li:before {
            content: "${theme.bullet} ";
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        ${finalContent.split('\n').map(line => {
            if (line.includes('[이미지:')) {
                return `<div class="image-placeholder">${line}</div>`;
            } else if (line.includes(theme.divider)) {
                return `<div class="divider">${line}</div>`;
            } else if (line.includes(theme.subheader)) {
                return `<h2>${line}</h2>`;
            } else if (line.includes(theme.bullet)) {
                return `<ul><li>${line.replace(theme.bullet, '').trim()}</li></ul>`;
            } else if (line.includes(theme.highlight)) {
                return `<p><span class="highlight">${line}</span></p>`;
            } else if (line.trim()) {
                return `<p>${line}</p>`;
            }
            return '';
        }).filter(Boolean).join('\n')}
        <div class="footer">
            ${theme.highlight} ${theme.highlight} ${theme.highlight}
        </div>
    </div>
</body>
</html>
            `.trim();
        }

        // Metadata 파싱 (구글 전용)
        let metadata = undefined;

        // 네이버와 구글 모두 metadata 생성 (해시태그 복사 기능용)
        const metadataMatch = content.match(/\[METADATA\]([\s\S]*?)\[\/METADATA\]/);
        if (metadataMatch) {
            try {
                const metadataText = metadataMatch[1].trim();
                const parsedMetadata = JSON.parse(metadataText);
                metadata = {
                    keywords: parsedMetadata.keywords || keywords.join(', '),
                    imagePrompt: parsedMetadata.imagePrompt || '',
                    seoTitles: parsedMetadata.seoTitles || []
                };
            } catch (e) {
                console.error('Metadata parsing error:', e);
                // 파싱 실패 시 기본값 사용
                metadata = {
                    keywords: keywords.join(', '),
                    imagePrompt: `${topic}을 표현하는 현대적이고 미니멀한 일러스트레이션`,
                    seoTitles: [title]
                };
            }
        } else {
            // METADATA 태그가 없는 경우 기본값으로 생성
            // 해시태그로 사용할 키워드만 필터링 (숫자, 년도, 개수 등 제외)
            const hashtagKeywords = keywords.filter(kw => {
                const trimmed = kw.trim();
                // 숫자만 있거나, "년", "가지", "개", "번째" 등으로 끝나는 키워드 제외
                return !/^\d+$/.test(trimmed) &&
                       !/\d+년$/.test(trimmed) &&
                       !/(가지|개|번째|가지|위)$/.test(trimmed) &&
                       trimmed.length > 1;
            });

            metadata = {
                keywords: hashtagKeywords.slice(0, 10).join(', '), // 최대 10개까지만
                imagePrompt: `${topic}을 표현하는 현대적이고 미니멀한 일러스트레이션`,
                seoTitles: [title]
            };
        }

        return {
            title,
            content: finalContent,
            format: 'html', // 네이버와 구글 모두 HTML 형식 사용
            schemaMarkup: platform === 'google' ? schemaMarkup : undefined,
            htmlPreview: htmlPreview || undefined,
            metadata
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`블로그 글 생성 중 오류 발생: ${error.message}`);
        }
        throw new Error('블로그 글 생성 중 알 수 없는 오류가 발생했습니다.');
    }
};

export const fetchCurrentWeather = async (): Promise<WeatherData> => {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = `
    오늘 서울의 현재 날씨를 데스크톱 버전의 Google 검색을 사용해서 알려주세요. 
    온도, 날씨 상태(예: 맑음, 구름 많음), 풍속, 습도를 포함해야 합니다. 
    다른 설명 없이 JSON 코드 블록 형식으로만 응답해주세요.
    
    \`\`\`json
    {
        "temperature": "...",
        "condition": "...",
        "wind": "...",
        "humidity": "..."
    }
    \`\`\`
    `.trim();

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const parsed = extractJsonFromText(text);
        if (parsed.temperature && parsed.condition && parsed.wind && parsed.humidity) {
            return parsed as WeatherData;
        } else {
            throw new Error('AI 응답이 날씨 데이터 형식이 아닙니다.');
        }
    } catch (error) {
        console.error("날씨 정보 조회 중 Gemini API 오류:", error);
        if (error instanceof Error) {
            throw new Error(`실시간 날씨 정보를 가져오는 데 실패했습니다: ${error.message}`);
        }
        throw new Error("실시간 날씨 정보를 가져오는 데 실패했습니다.");
    }
};
