# Live Data Platform

A real-time, high-availability data platform for streaming weather, space, geo, and community data with comprehensive monitoring, quality assurance, and security features.

## 🚀 Features

### Core Functionality
- **Real-time Data Streaming**: Sub-minute freshness with SSE and WebSocket support
- **Multi-Source Integration**: Weather (DWD), Space (NASA), Geo, and Community data
- **Quality Assurance**: Automated data validation, anomaly detection, and quality scoring
- **High Availability**: 99.95% uptime with multi-region support
- **Security**: Comprehensive security headers, authentication, and signature verification

### Data Sources
- **Weather Data**: Real-time weather nowcasts and forecasts
- **Space Weather**: Solar flares, geomagnetic storms, radiation alerts
- **Geographic Data**: Location-based services and mapping
- **Community Data**: Social media and forum integration

### API & Streaming
- **REST API**: Full CRUD operations with caching and rate limiting
- **Server-Sent Events**: Real-time streaming for web clients
- **WebSocket**: Bidirectional communication for Node.js clients
- **GraphQL**: Flexible querying (planned)

## 📋 Prerequisites

- Node.js 20.0.0 or higher
- npm 10.0.0 or higher
- TypeScript 5.6.0 or higher
- Docker (for development services)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/live-data-platform.git
   cd live-data-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Start the platform**
   ```bash
   npm start
   ```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Sources  │    │  Ingress Gateway │    │   Stream Bus    │
│                 │───▶│                 │───▶│                 │
│ • Weather APIs  │    │ • Auth & Rate   │    │ • Real-time     │
│ • Space APIs    │    │ • Validation    │    │ • Processing    │
│ • Geo APIs      │    │ • Signatures    │    │ • Distribution  │
│ • Community     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐              │
│   Delivery      │◀───│   Storage       │◀─────────────┘
│                 │    │                 │
│ • REST API      │    │ • Hot (Redis)   │
│ • SSE Streams   │    │ • Warm (DB)     │
│ • WebSocket     │    │ • Cold (S3)     │
│ • GraphQL       │    │                 │
└─────────────────┘    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost:5432/live_data

# API Keys
DWD_API_KEY=your_dwd_api_key
NASA_API_KEY=your_nasa_api_key

# Security
JWT_SECRET=your_jwt_secret
SIGNING_KEY=your_signing_key

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

### Security Configuration

```typescript
import { createSecurityHeaders } from './src/security/headers';

const securityHeaders = createSecurityHeaders({
  enableHSTS: true,
  enableCSP: true,
  cspDirectives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'connect-src': ["'self'", "https://api.example.com"]
  }
});
```

## 📡 API Usage

### REST API

#### Get Current Weather
```bash
curl -H "X-API-Key: your_api_key" \
     "https://api.live-data-platform.com/api/v1/weather/current/eu-central"
```

#### Get Space Alerts
```bash
curl -H "X-API-Key: your_api_key" \
     "https://api.live-data-platform.com/api/v1/space/alerts?severity=warning"
```

### Server-Sent Events

```javascript
const eventSource = new EventSource('/stream/weather/nowcast/eu-central');

eventSource.addEventListener('weather-nowcast', (event) => {
  const data = JSON.parse(event.data);
  console.log('Weather update:', data);
});
```

### WebSocket (Node.js)

```javascript
import WebSocket from 'ws';

const ws = new WebSocket('wss://api.live-data-platform.com/ws');

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Real-time update:', message);
});
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:contracts     # Contract tests
npm run test:performance   # Performance tests
```

### Contract Testing
```bash
npm run test:contracts
```

Contract tests validate data schemas and API contracts to ensure compatibility between producers and consumers.

## 📊 Monitoring

### Metrics Endpoint
```bash
curl "https://api.live-data-platform.com/metrics"
```

### Health Check
```bash
curl "https://api.live-data-platform.com/health"
```

### SLO Monitoring
The platform continuously monitors:
- **Freshness**: Data age < 60 seconds
- **Availability**: 99.95% uptime
- **Latency**: p95 < 300ms
- **Error Rate**: < 0.1%

## 🔒 Security

### Authentication
- API Key authentication
- JWT tokens for session management
- Rate limiting per client

### Data Integrity
- Cryptographic signatures on all data
- Schema validation
- Quality scoring and anomaly detection

### Security Headers
- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options
- And many more...

## 🚀 Deployment

### Docker
```bash
docker build -t live-data-platform .
docker run -p 3000:3000 live-data-platform
```

### Docker Compose
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

## 📈 Performance

### Benchmarks
- **Throughput**: 10,000+ requests/second
- **Latency**: p95 < 300ms, p99 < 500ms
- **Memory**: < 512MB under normal load
- **CPU**: < 50% under normal load

### Optimization
- Redis caching for hot data
- Connection pooling
- Request batching
- Gzip compression

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
```bash
npm run dev          # Start development server
npm run test:watch   # Run tests in watch mode
npm run lint:fix     # Fix linting issues
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.live-data-platform.com](https://docs.live-data-platform.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/live-data-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/live-data-platform/discussions)
- **Email**: support@live-data-platform.com

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core platform with weather and space data
- ✅ REST API and SSE streaming
- ✅ Basic monitoring and alerting

### Phase 2 (Q2 2025)
- 🔄 GraphQL API
- 🔄 Advanced analytics dashboard
- 🔄 Machine learning for anomaly detection

### Phase 3 (Q3 2025)
- 📋 Multi-region deployment
- 📋 Advanced caching strategies
- 📋 Mobile SDK

## 🙏 Acknowledgments

- Deutscher Wetterdienst (DWD) for weather data
- NASA for space weather data
- OpenStreetMap for geographic data
- The open-source community for amazing tools and libraries

---

**Built with ❤️ by the Live Data Platform Team**
