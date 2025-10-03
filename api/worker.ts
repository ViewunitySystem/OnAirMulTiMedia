export interface Env {
  GITHUB_TOKEN: string;         // Fine‑grained PAT (Repo:Content + Pull Requests)
  GITHUB_REPO: string;          // e.g. "ViewunitySystem/OnAirMulTiMedia"
  OPENAI_API_KEY?: string;      // optional – via serverseitigem Proxy
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
