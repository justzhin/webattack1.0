module.exports = {
    userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
    ],
    
    referers: [
        'https://www.google.com/',
        'https://www.facebook.com/',
        'https://www.youtube.com/',
        'https://www.twitter.com/',
        'https://www.reddit.com/',
        'https://www.linkedin.com/',
        'https://www.instagram.com/',
        'https://www.tiktok.com/',
        'https://www.pinterest.com/'
    ],
    
    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    },
    
    getRandomReferer() {
        return this.referers[Math.floor(Math.random() * this.referers.length)];
    },
    
    getRandomLanguage() {
        const languages = ['en-US,en;q=0.9', 'id-ID,id;q=0.9', 'es-ES,es;q=0.9', 'fr-FR,fr;q=0.9'];
        return languages[Math.floor(Math.random() * languages.length)];
    },
    
    getRandomAccept() {
        const accepts = [
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        ];
        return accepts[Math.floor(Math.random() * accepts.length)];
    },
    
    generateRandomIP() {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    },
    
    generateXForwardedFor() {
        const ips = [];
        for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
            ips.push(this.generateRandomIP());
        }
        return ips.join(', ');
    }
};
