/**
 * API Stub for GitHub Stats and Contributors
 * Provides client-side API responses for static GitHub Pages
 * Copyright 2025 Raymond Demitrio Dr. Tel - ViewunitySystem
 */

(function() {
  'use strict';

  // Repository configuration
  const REPO = {
    owner: 'ViewunitySystem',
    name: 'OnAirMulTiMedia',
    branch: 'mainzero'
  };

  /**
   * Fetch GitHub repository stats
   */
  async function fetchGitHubStats() {
    try {
      const response = await fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.name}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      return {
        success: true,
        data: {
          name: data.name,
          full_name: data.full_name,
          description: data.description,
          stars: data.stargazers_count,
          forks: data.forks_count,
          watchers: data.watchers_count,
          open_issues: data.open_issues_count,
          language: data.language,
          created_at: data.created_at,
          updated_at: data.updated_at,
          pushed_at: data.pushed_at,
          size: data.size,
          default_branch: data.default_branch,
          homepage: data.homepage,
          html_url: data.html_url,
          license: data.license?.name || 'None'
        }
      };
    } catch (error) {
      console.warn('[API] Failed to fetch GitHub stats:', error);
      
      // Fallback data
      return {
        success: false,
        error: error.message,
        data: {
          name: 'OnAirMulTiMedia',
          full_name: 'ViewunitySystem/OnAirMulTiMedia',
          description: 'Open-source Software-Defined Radio platform',
          stars: 0,
          forks: 0,
          watchers: 0,
          open_issues: 0,
          language: 'JavaScript',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pushed_at: new Date().toISOString(),
          size: 0,
          default_branch: 'mainzero',
          homepage: 'https://viewunitysystem.github.io/OnAirMulTiMedia/',
          html_url: `https://github.com/${REPO.owner}/${REPO.name}`,
          license: 'None'
        }
      };
    }
  }

  /**
   * Fetch GitHub contributors
   */
  async function fetchContributors() {
    try {
      const response = await fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.name}/contributors`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      return {
        success: true,
        data: data.map(contributor => ({
          login: contributor.login,
          avatar: contributor.avatar_url,
          contributions: contributor.contributions,
          profile: contributor.html_url,
          type: contributor.type
        }))
      };
    } catch (error) {
      console.warn('[API] Failed to fetch contributors:', error);
      
      // Fallback data
      return {
        success: false,
        error: error.message,
        data: [
          {
            login: 'ViewunitySystem',
            avatar: 'https://github.com/identicons/ViewunitySystem.png',
            contributions: 0,
            profile: 'https://github.com/ViewunitySystem',
            type: 'User'
          }
        ]
      };
    }
  }

  /**
   * API Router - Handle API requests
   */
  async function handleAPIRequest(endpoint) {
    console.log('[API] Request:', endpoint);
    
    switch(endpoint) {
      case '/api/github/stats':
        return await fetchGitHubStats();
      
      case '/api/contribs':
      case '/api/contributors':
        return await fetchContributors();
      
      default:
        return {
          success: false,
          error: 'Unknown endpoint',
          endpoint: endpoint
        };
    }
  }

  /**
   * Intercept fetch requests for API endpoints
   */
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    
    // Check if it's an API request
    if (typeof url === 'string' && url.startsWith('/api/')) {
      console.log('[API] Intercepted:', url);
      
      return handleAPIRequest(url).then(data => {
        return new Response(JSON.stringify(data), {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      });
    }
    
    // Otherwise, use original fetch
    return originalFetch.apply(this, args);
  };

  // Export API functions globally
  window.GitHubAPI = {
    getStats: fetchGitHubStats,
    getContributors: fetchContributors,
    request: handleAPIRequest
  };

  console.log('[API] Stub handler loaded ✅');
  console.log('[API] Available endpoints: /api/github/stats, /api/contribs');
  
})();

