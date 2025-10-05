import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://unpkg.com", "'unsafe-inline'"],
      scriptSrcElem: ["'self'", "https://unpkg.com", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"]
    }
  }
}));

app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// OpenAPI Documentation
const swaggerDocument = YAML.load(path.join(__dirname, 'api-docs.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// In-memory storage for demo (in production, use Redis/Database)
const uiVariants = [
  {
    id: 'shadcn',
    name: 'shadcn/ui',
    repo: 'https://github.com/shadcn-ui/ui',
    license: 'MIT',
    tagline: 'Minimal, zugänglich, Tailwind',
    preview: '/img/shadcn-preview.png',
    a11y: 'WCAG 2.1 AA compliant, keyboard navigation',
    features: ['Copy & Paste Components', 'Tailwind CSS', 'Radix Primitives', 'TypeScript'],
    category: 'modern',
    popularity: 95,
    lastUpdated: '2025-01-15'
  },
  {
    id: 'radix',
    name: 'Radix UI',
    repo: 'https://github.com/radix-ui/primitives',
    license: 'MIT',
    tagline: 'A11y Primitives für moderne Apps',
    preview: '/img/radix-preview.png',
    a11y: 'WAI-ARIA compliant, screen reader optimized',
    features: ['Unstyled Primitives', 'Headless Components', 'Accessibility First', 'React'],
    category: 'primitives',
    popularity: 88,
    lastUpdated: '2025-01-10'
  },
  {
    id: 'tabler',
    name: 'Tabler',
    repo: 'https://github.com/tabler/tabler',
    license: 'MIT',
    tagline: 'Klassisches Dashboard-Design',
    preview: '/img/tabler-preview.png',
    a11y: 'Semantic HTML, keyboard accessible',
    features: ['Dashboard Components', 'Tabler Icons', 'Bootstrap', 'HTML/CSS'],
    category: 'dashboard',
    popularity: 82,
    lastUpdated: '2025-01-08'
  },
  {
    id: 'primereact',
    name: 'PrimeReact',
    repo: 'https://github.com/primefaces/primereact',
    license: 'MIT',
    tagline: 'Umfangreiche React-Komponenten',
    preview: '/img/primereact-preview.png',
    a11y: 'ARIA compliant, keyboard navigation',
    features: ['80+ Components', 'Virtual Scrolling', 'DataTable', 'Charts'],
    category: 'enterprise',
    popularity: 75,
    lastUpdated: '2025-01-12'
  },
  {
    id: 'daisyui',
    name: 'daisyUI',
    repo: 'https://github.com/saadeghi/daisyui',
    license: 'MIT',
    tagline: 'Tailwind CSS Komponenten',
    preview: '/img/daisyui-preview.png',
    a11y: 'Semantic components, focus management',
    features: ['Tailwind Plugin', 'Theme System', 'Semantic Classes', 'Responsive'],
    category: 'utility',
    popularity: 78,
    lastUpdated: '2025-01-05'
  },
  {
    id: 'mui',
    name: 'Material-UI',
    repo: 'https://github.com/mui/material-ui',
    license: 'MIT',
    tagline: 'React Material Design',
    preview: '/img/mui-preview.png',
    a11y: 'Material Design accessibility guidelines',
    features: ['Material Design', 'MUI X', 'DataGrid', 'Charts'],
    category: 'material',
    popularity: 92,
    lastUpdated: '2025-01-14'
  }
];

const systemStatus = {
  feeds: {
    weather: { ok: true, freshnessSec: 12, region: 'eu-central', lastUpdate: new Date().toISOString() },
    aviation: { ok: true, freshnessSec: 8, region: 'global', lastUpdate: new Date().toISOString() },
    maritime: { ok: true, freshnessSec: 15, region: 'coastal', lastUpdate: new Date().toISOString() },
    amateur: { ok: true, freshnessSec: 5, region: 'worldwide', lastUpdate: new Date().toISOString() }
  },
  license: {
    overall: 'compliant',
    violations: 0,
    lastCheck: new Date().toISOString(),
    details: {
      mit: 6,
      apache: 0,
      gpl: 0,
      proprietary: 0
    }
  },
  compliance: {
    score: 98,
    lastAudit: new Date().toISOString(),
    evidences: [
      { type: 'license_check', status: 'passed', timestamp: new Date().toISOString() },
      { type: 'security_scan', status: 'passed', timestamp: new Date().toISOString() },
      { type: 'accessibility_test', status: 'passed', timestamp: new Date().toISOString() }
    ]
  }
};

// API Routes
app.get('/api/ui-variants', (req, res) => {
  const { active, limit, category } = req.query;
  let variants = [...uiVariants];
  
  if (active === 'true') {
    variants = variants.filter(v => v.popularity > 70);
  }
  
  if (category) {
    variants = variants.filter(v => v.category === category);
  }
  
  if (limit) {
    variants = variants.slice(0, parseInt(limit));
  }
  
  res.json({
    success: true,
    data: variants,
    meta: {
      total: variants.length,
      categories: [...new Set(uiVariants.map(v => v.category))],
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/ui-variants/:id', (req, res) => {
  const variant = uiVariants.find(v => v.id === req.params.id);
  if (!variant) {
    return res.status(404).json({ success: false, error: 'UI variant not found' });
  }
  
  res.json({
    success: true,
    data: variant,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/status/feeds', (req, res) => {
  res.json({
    success: true,
    data: systemStatus.feeds,
    meta: {
      timestamp: new Date().toISOString(),
      overall: Object.values(systemStatus.feeds).every(f => f.ok) ? 'healthy' : 'degraded'
    }
  });
});

app.get('/api/status/freshness', (req, res) => {
  const freshness = Object.entries(systemStatus.feeds).map(([domain, feed]) => ({
    domain,
    region: feed.region,
    freshnessSec: feed.freshnessSec,
    status: feed.freshnessSec < 30 ? 'fresh' : 'stale'
  }));
  
  res.json({
    success: true,
    data: freshness,
    meta: {
      timestamp: new Date().toISOString(),
      averageFreshness: freshness.reduce((sum, f) => sum + f.freshnessSec, 0) / freshness.length
    }
  });
});

app.get('/api/status/license', (req, res) => {
  res.json({
    success: true,
    data: systemStatus.license,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/status/compliance', (req, res) => {
  res.json({
    success: true,
    data: systemStatus.compliance,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
});

// WebSocket connection handling
const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  clients.set(clientId, {
    ws,
    connectedAt: new Date(),
    lastPing: new Date()
  });
  
  console.log(`Client ${clientId} connected. Total clients: ${clients.size}`);
  
  // Send initial status
  ws.send(JSON.stringify({
    type: 'status',
    data: systemStatus,
    timestamp: new Date().toISOString()
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;
        case 'subscribe':
          // Handle subscription to specific feeds
          break;
        default:
          console.log(`Unknown message type from ${clientId}:`, data.type);
      }
    } catch (error) {
      console.error(`Error processing message from ${clientId}:`, error);
    }
  });
  
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected. Total clients: ${clients.size}`);
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
    clients.delete(clientId);
  });
});

// Broadcast status updates to all connected clients
function broadcastStatus() {
  const message = JSON.stringify({
    type: 'status_update',
    data: systemStatus,
    timestamp: new Date().toISOString()
  });
  
  clients.forEach((client, clientId) => {
    if (client.ws.readyState === client.ws.OPEN) {
      client.ws.send(message);
    } else {
      clients.delete(clientId);
    }
  });
}

// Update system status periodically
cron.schedule('*/30 * * * * *', () => {
  // Simulate status changes
  Object.keys(systemStatus.feeds).forEach(domain => {
    systemStatus.feeds[domain].freshnessSec = Math.floor(Math.random() * 30) + 5;
    systemStatus.feeds[domain].lastUpdate = new Date().toISOString();
  });
  
  broadcastStatus();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    clients: clients.size
  });
});

// Serve static files from root directory
app.use(express.static(__dirname, {
  maxAge: 0, // Disable caching
  etag: false,
  lastModified: false
}));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 SDR UI Rotation System running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌐 Web Interface: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
