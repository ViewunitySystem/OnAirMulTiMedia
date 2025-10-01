import * as fs from 'node:fs';
import * as path from 'node:path';

export default {
  enabled: (cfg:any)=>cfg.rules.firebaseHostingSync?.enabled,
  run: async (cfg:any)=>{
    const firebaseConfig = {
      hosting: [
        {
          site: "onairmultimedia",
          public: ".",
          ignore: [
            "**/.*",
            "**/node_modules/**",
            ".github/**",
            "scripts/**",
            "tests/**",
            "jscpd-report/**",
            ".selfheal-*.json"
          ],
          cleanUrls: true,
          trailingSlash: false,
          headers: [
            {
              source: "**",
              headers: [
                { key: "X-Frame-Options", value: "SAMEORIGIN" },
                { key: "Referrer-Policy", value: "no-referrer" },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-XSS-Protection", value: "1; mode=block" }
              ]
            },
            {
              source: "**/*.@(js|css|svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)",
              headers: [
                { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
              ]
            },
            {
              source: "**/*.html",
              headers: [
                { key: "Cache-Control", value: "public, max-age=3600" }
              ]
            }
          ],
          rewrites: [
            { source: "/api/**", function: "api" },
            { source: "/o22/**", destination: "/o22/index.html" },
            { source: "/o66/**", destination: "/o66/index.html" },
            { source: "**", destination: "/index.html" }
          ]
        }
      ]
    };

    // Prüfe ob firebase.json existiert und korrekt ist
    let needsUpdate = false;
    
    if (!fs.existsSync('firebase.json')) {
      needsUpdate = true;
    } else {
      try {
        const existing = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
        // Vergleiche kritische Konfigurationen
        if (!existing.hosting || !Array.isArray(existing.hosting)) {
          needsUpdate = true;
        } else {
          const mainSite = existing.hosting.find((h: any) => h.site === 'onairmultimedia');
          if (!mainSite || !mainSite.headers || !mainSite.rewrites) {
            needsUpdate = true;
          }
        }
      } catch (e) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      fs.writeFileSync('firebase.json', JSON.stringify(firebaseConfig, null, 2));
      return { changed: true };
    }

    return { changed: false };
  }
}
