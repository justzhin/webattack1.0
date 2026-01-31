// Database user-agent lengkap
const userAgents = [
    // Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    
    // MacOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
    
    // Linux
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0',
    
    // Mobile
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
    
    // Bots (disguised)
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Twitterbot/1.0'
];

const referers = [
    'https://www.google.com/',
    'https://www.facebook.com/',
    'https://www.youtube.com/',
    'https://www.twitter.com/',
    'https://www.reddit.com/',
    'https://www.linkedin.com/',
    'https://www.instagram.com/',
    'https://www.tiktok.com/',
    'https://www.pinterest.com/',
    'https://www.quora.com/'
];

const languages = [
    'en-US,en;q=0.9',
    'id-ID,id;q=0.9,en;q=0.8',
    'es-ES,es;q=0.9',
    'fr-FR,fr;q=0.9',
    'de-DE,de;q=0.9',
    'ja-JP,ja;q=0.9',
    'ko-KR,ko;q=0.9',
    'zh-CN,zh;q=0.9',
    'ru-RU,ru;q=0.9'
];

const acceptHeaders = [
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
];

function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function getRandomReferer() {
    return referers[Math.floor(Math.random() * referers.length)];
}

function getRandomLanguage() {
    return languages[Math.floor(Math.random() * languages.length)];
}

function getRandomAccept() {
    return acceptHeaders[Math.floor(Math.random() * acceptHeaders.length)];
}

function generateRandomIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function generateXForwardedFor() {
    const ips = [];
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
        ips.push(generateRandomIP());
    }
    return ips.join(', ');
}

module.exports = {
    getRandomUserAgent,
    getRandomReferer,
    getRandomLanguage,
    getRandomAccept,
    generateRandomIP,
    generateXForwardedFor,
    userAgents,
    referers
};
