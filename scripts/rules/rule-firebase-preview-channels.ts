import * as fs from 'node:fs';

export default {
  enabled: (cfg:any)=>cfg.rules.firebasePreviewChannels?.enabled,
  run: async ()=>{
    // Erstelle Preview-Channel-Konfiguration für PR-Deployments
    const previewConfig = {
      channels: {
        "pr-preview": {
          site: "onairmultimedia",
          expires: "7d",
          description: "PR Preview Channel"
        },
        "staging": {
          site: "onairmultimedia-staging", 
          expires: "30d",
          description: "Staging Environment"
        },
        "dev": {
          site: "onairmultimedia-dev",
          expires: "30d", 
          description: "Development Environment"
        }
      },
      autoDeploy: {
        pullRequest: true,
        branches: ["main", "gh-pages", "mainzero"],
        previewExpiry: "7d"
      }
    };

    // Erstelle .firebaserc falls nicht vorhanden
    if (!fs.existsSync('.firebaserc')) {
      const firebaserc = {
        projects: {
          default: "tel1nl"
        },
        targets: {
          tel1nl: {
            hosting: {
              sites: {
                prod: ["onairmultimedia"],
                staging: ["onairmultimedia-staging"],
                dev: ["onairmultimedia-dev"]
              }
            }
          }
        }
      };
      fs.writeFileSync('.firebaserc', JSON.stringify(firebaserc, null, 2));
    }

    // Erstelle Preview-Channel-Script
    const previewScript = `#!/bin/bash
# Firebase Preview Channel Script
# Automatically creates preview channels for PRs

PR_NUMBER=$1
CHANNEL_NAME="pr-$PR_NUMBER"

if [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 <PR_NUMBER>"
  exit 1
fi

echo "Creating preview channel: $CHANNEL_NAME"

firebase hosting:channel:deploy $CHANNEL_NAME \\
  --site onairmultimedia \\
  --expires 7d \\
  --non-interactive

echo "Preview URL: https://$CHANNEL_NAME---onairmultimedia.web.app"
echo "Channel expires in 7 days"
`;

    if (!fs.existsSync('scripts')) {
      fs.mkdirSync('scripts');
    }
    
    fs.writeFileSync('scripts/firebase-preview.sh', previewScript);
    
    // Mache Script ausführbar (Unix)
    try {
      fs.chmodSync('scripts/firebase-preview.sh', '755');
    } catch (e) {
      // Ignore auf Windows
    }

    return { changed: true };
  }
}

