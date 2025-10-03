export interface Env {
  GITHUB_TOKEN: string;         // Fine‑grained PAT (Repo:Content + Pull Requests)
  GITHUB_REPO: string;          // e.g. "ViewunitySystem/OnAirMulTiMedia"
  OPENAI_API_KEY?: string;      // optional – via serverseitigem Proxy
  // Matrix.org-Style Serverfarm
  PUBLIC_ROOMS: KVNamespace;    // Öffentliche Räume ohne Account
  MEDIA_CONTENT: KVNamespace;   // Medien-Inhalte (Info, Sports, Technik, Science, etc.)
  USER_SESSIONS: KVNamespace;   // User-Sessions für erweiterte Features
}

import { Octokit } from 'octokit';

const schema = {
  type:'object',
  required:['title','description','target','code'],
  properties:{
    title:{type:'string',minLength:3,maxLength:120},
    description:{type:'string',minLength:5,maxLength:2000},
    target:{type:'string',pattern:"^(modules/user/|webui/components/|apps/user/)"},
    code:{type:'string',minLength:5,maxLength:200000}
  }
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null,{headers:cors()});

    // Matrix.org-Style Serverfarm Endpunkte
    if (url.pathname === '/rooms' && req.method === 'GET') {
      return await getPublicRooms(env);
    }

    if (url.pathname.startsWith('/rooms/') && req.method === 'GET') {
      const roomId = url.pathname.split('/')[2];
      return await getRoomContent(env, roomId);
    }

    if (url.pathname === '/media/search' && req.method === 'GET') {
      const query = url.searchParams.get('q') || '';
      const category = url.searchParams.get('category') || 'all';
      return await searchMediaContent(env, query, category);
    }

    if (url.pathname === '/media/categories' && req.method === 'GET') {
      return await getMediaCategories(env);
    }

    if (url.pathname.startsWith('/media/') && req.method === 'GET') {
      const mediaId = url.pathname.split('/')[2];
      return await getMediaItem(env, mediaId);
    }

    if (url.pathname === '/ai/draft' && req.method === 'POST') {
      const b = await req.json();
      
      // AI-Stub für OAMTM-spezifische Features
      const code = generateAIDraft(b.title, b.desc, b.target);
      return json({ code });
    }

    if (url.pathname === '/submit' && req.method === 'POST') {
      const body = await req.json();
      const valid = validate(body, schema);
      if (!valid.ok) return json({ ok:false, error: valid.error }, 400);

      const octo = new Octokit({ auth: env.GITHUB_TOKEN });
      const branch = `user-contribs/${Date.now()}-${slug(body.title)}`;
      const [owner, repo] = env.GITHUB_REPO.split('/');

      try {
        // 1) Hole default branch sha
        const { data: repoInfo } = await octo.rest.repos.get({ owner, repo });
        const base = repoInfo.default_branch;
        const { data: baseRef } = await octo.rest.git.getRef({ owner, repo, ref:`heads/${base}` });

        // 2) Erstelle Branch
        await octo.rest.git.createRef({ owner, repo, ref:`refs/heads/${branch}`, sha: baseRef.object.sha });

        // 3) Schreibe Datei (target + safe filename)
        const path = `${body.target}${slug(body.title)}.js`;
        const content = b64(body.code);
        await octo.rest.repos.createOrUpdateFileContents({ 
          owner, repo, path, 
          message:`feat(user): ${body.title}`, 
          content, branch 
        });

        // 4) Audit‑Event
        const auditPath = `audit/user/${Date.now()}-${slug(body.title)}.json`;
        const auditData = {
          ts: new Date().toISOString(),
          user: 'anonymous',
          action: 'submit',
          title: body.title,
          target: body.target,
          codeLength: body.code.length
        };
        await octo.rest.repos.createOrUpdateFileContents({ 
          owner, repo, 
          path: auditPath, 
          message:`audit(user): ${body.title}`, 
          content: b64(JSON.stringify(auditData)), 
          branch 
        });

        // 5) Pull Request
        const { data: pr } = await octo.rest.pulls.create({ 
          owner, repo, 
          head: branch, 
          base, 
          title:`User: ${body.title}`, 
          body: body.description 
        });
        
        return json({ ok:true, pr: pr.number, url: pr.html_url });
      } catch (error) {
        return json({ ok:false, error: error.message }, 500);
      }
    }

    return new Response('Not found',{status:404,headers:cors()});
  }
}

function generateAIDraft(title: string, desc: string, target: string): string {
  const templates = {
    'modules/user/': `// ${title}
// ${desc}

class UserModule {
  constructor() {
    this.name = '${title}';
    this.version = '1.0.0';
  }

  init() {
    console.log('User Module ${title} initialized');
    // TODO: Implementiere deine Logik hier
  }

  render() {
    return \`
      <div class="user-module">
        <h3>\${this.name}</h3>
        <p>Version: \${this.version}</p>
        <!-- Deine UI hier -->
      </div>
    \`;
  }
}

// Export für OAMTM Integration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserModule;
} else if (typeof window !== 'undefined') {
  window.UserModule = UserModule;
}`,

    'webui/components/': `// ${title} - Web Component
// ${desc}

class ${title.replace(/[^a-zA-Z0-9]/g, '')}Component extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = \`
      <style>
        :host {
          display: block;
          font-family: system-ui;
        }
        .component {
          padding: 16px;
          border: 1px solid #ccc;
          border-radius: 8px;
        }
      </style>
      <div class="component">
        <h3>${title}</h3>
        <p>${desc}</p>
        <!-- Deine Komponente hier -->
      </div>
    \`;
  }
}

// Registriere das Custom Element
customElements.define('${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-component', ${title.replace(/[^a-zA-Z0-9]/g, '')}Component);`,

    'apps/user/': `// ${title} - User App
// ${desc}

class UserApp {
  constructor() {
    this.name = '${title}';
    this.description = '${desc}';
    this.version = '1.0.0';
  }

  async init() {
    console.log('Initializing ${title}...');
    // App-Initialisierung
  }

  render() {
    return \`
      <div class="user-app" data-app="\${this.name}">
        <header>
          <h1>\${this.name}</h1>
          <p>\${this.description}</p>
        </header>
        <main>
          <!-- Deine App-Logik hier -->
        </main>
      </div>
    \`;
  }

  // OAMTM Integration
  getManifest() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      type: 'user-app',
      permissions: ['read', 'write']
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserApp;
} else if (typeof window !== 'undefined') {
  window.UserApp = UserApp;
}`
  };

  return templates[target] || `// ${title}
// ${desc}

console.log('Feature: ${title}');
// TODO: Implementiere deine Logik hier`;
}

// Matrix.org-Style Serverfarm Funktionen
async function getPublicRooms(env: Env): Promise<Response> {
  try {
    // Öffentliche Räume ohne Account-Zugang
    const rooms = [
      {
        id: 'info-global',
        name: '🌍 Global Information',
        description: 'Weltweite Nachrichten, Politik, Wirtschaft',
        category: 'info',
        memberCount: 0,
        public: true,
        topics: ['news', 'politics', 'economy', 'world']
      },
      {
        id: 'sports-world',
        name: '⚽ Sports World',
        description: 'Alle Sportarten, Ergebnisse, Highlights',
        category: 'sports',
        memberCount: 0,
        public: true,
        topics: ['football', 'basketball', 'tennis', 'olympics']
      },
      {
        id: 'tech-innovation',
        name: '🚀 Technology & Innovation',
        description: 'Neueste Tech-Trends, AI, Programmierung',
        category: 'technology',
        memberCount: 0,
        public: true,
        topics: ['ai', 'programming', 'gadgets', 'innovation']
      },
      {
        id: 'science-discovery',
        name: '🔬 Science & Discovery',
        description: 'Wissenschaft, Forschung, Entdeckungen',
        category: 'science',
        memberCount: 0,
        public: true,
        topics: ['physics', 'biology', 'space', 'research']
      },
      {
        id: 'nature-earth',
        name: '🌱 Nature & Earth',
        description: 'Umwelt, Klima, Natur, Nachhaltigkeit',
        category: 'nature',
        memberCount: 0,
        public: true,
        topics: ['climate', 'environment', 'sustainability', 'nature']
      },
      {
        id: 'culture-arts',
        name: '🎨 Culture & Arts',
        description: 'Kunst, Musik, Literatur, Kultur',
        category: 'culture',
        memberCount: 0,
        public: true,
        topics: ['art', 'music', 'literature', 'culture']
      }
    ];

    return json({ 
      success: true, 
      rooms,
      total: rooms.length,
      publicAccess: true,
      message: 'Öffentliche Räume - Kein Account erforderlich'
    });
  } catch (error) {
    return json({ success: false, error: error.message }, 500);
  }
}

async function getRoomContent(env: Env, roomId: string): Promise<Response> {
  try {
    // Simuliere Raum-Inhalte basierend auf Raum-ID
    const roomContent = {
      'info-global': {
        id: 'info-global',
        name: '🌍 Global Information',
        messages: [
          {
            id: 'msg-1',
            sender: 'NewsBot',
            timestamp: new Date().toISOString(),
            content: 'Breaking: Neue Entwicklungen in der internationalen Politik',
            type: 'text',
            public: true
          },
          {
            id: 'msg-2',
            sender: 'EconomyBot',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            content: 'Wirtschaftsbericht: Aktuelle Marktentwicklungen',
            type: 'text',
            public: true
          }
        ],
        media: [
          {
            id: 'media-1',
            title: 'Weltnachrichten Update',
            type: 'video',
            url: 'https://example.com/news-update.mp4',
            duration: '5:30',
            public: true
          }
        ]
      },
      'sports-world': {
        id: 'sports-world',
        name: '⚽ Sports World',
        messages: [
          {
            id: 'msg-3',
            sender: 'SportsBot',
            timestamp: new Date().toISOString(),
            content: 'Live: Champions League Ergebnisse',
            type: 'text',
            public: true
          }
        ],
        media: [
          {
            id: 'media-2',
            title: 'Top 10 Goals der Woche',
            type: 'video',
            url: 'https://example.com/goals.mp4',
            duration: '3:45',
            public: true
          }
        ]
      }
    };

    const content = roomContent[roomId] || {
      id: roomId,
      name: 'Unknown Room',
      messages: [],
      media: [],
      error: 'Raum nicht gefunden'
    };

    return json({ 
      success: true, 
      room: content,
      publicAccess: true
    });
  } catch (error) {
    return json({ success: false, error: error.message }, 500);
  }
}

async function searchMediaContent(env: Env, query: string, category: string): Promise<Response> {
  try {
    // Simuliere Medien-Suche
    const mediaResults = [
      {
        id: 'media-search-1',
        title: `Suchergebnis für "${query}"`,
        category: category,
        type: 'video',
        url: 'https://example.com/search-result.mp4',
        duration: '2:15',
        description: `Relevanter Inhalt zu ${query} in Kategorie ${category}`,
        public: true,
        downloadUrl: `https://example.com/download/${query}.mp4`
      }
    ];

    return json({ 
      success: true, 
      query,
      category,
      results: mediaResults,
      total: mediaResults.length,
      publicAccess: true,
      message: 'Öffentliche Medien - Download möglich ohne Account'
    });
  } catch (error) {
    return json({ success: false, error: error.message }, 500);
  }
}

async function getMediaCategories(env: Env): Promise<Response> {
  try {
    const categories = [
      { id: 'info', name: 'Information', icon: '🌍', count: 150 },
      { id: 'sports', name: 'Sports', icon: '⚽', count: 89 },
      { id: 'technology', name: 'Technology', icon: '🚀', count: 203 },
      { id: 'science', name: 'Science', icon: '🔬', count: 67 },
      { id: 'nature', name: 'Nature', icon: '🌱', count: 45 },
      { id: 'culture', name: 'Culture', icon: '🎨', count: 78 }
    ];

    return json({ 
      success: true, 
      categories,
      total: categories.reduce((sum, cat) => sum + cat.count, 0),
      publicAccess: true
    });
  } catch (error) {
    return json({ success: false, error: error.message }, 500);
  }
}

async function getMediaItem(env: Env, mediaId: string): Promise<Response> {
  try {
    const mediaItem = {
      id: mediaId,
      title: 'Media Item',
      description: 'Beschreibung des Medien-Inhalts',
      type: 'video',
      url: `https://example.com/media/${mediaId}.mp4`,
      duration: '5:30',
      category: 'info',
      public: true,
      downloadUrl: `https://example.com/download/${mediaId}.mp4`,
      streamUrl: `https://example.com/stream/${mediaId}.m3u8`
    };

    return json({ 
      success: true, 
      media: mediaItem,
      publicAccess: true,
      message: 'Öffentlicher Zugang - Download und Stream verfügbar'
    });
  } catch (error) {
    return json({ success: false, error: error.message }, 500);
  }
}

function json(d:any, status=200){return new Response(JSON.stringify(d),{status,headers:{'content-type':'application/json',...cors()}})}
function cors(){return { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'content-type' }}
function b64(s:string){return btoa(unescape(encodeURIComponent(s)))}
function slug(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}
function validate(obj:any, schema:any){
  try{ // minimal
    if (!obj.title || obj.title.length<3) throw 'title';
    if (!obj.description || obj.description.length<5) throw 'description';
    if (!/^modules\/user\//.test(obj.target) && !/^webui\/components\//.test(obj.target) && !/^apps\/user\//.test(obj.target)) throw 'target';
    if (!obj.code || obj.code.length<5) throw 'code';
    return { ok:true };
  }catch(e){ return { ok:false, error:`invalid ${e}` } }
}
