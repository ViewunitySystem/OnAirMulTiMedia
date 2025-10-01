#!/bin/bash
# Firebase Preview Channel Script
# Automatically creates preview channels for PRs

PR_NUMBER=$1
CHANNEL_NAME="pr-$PR_NUMBER"

if [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 <PR_NUMBER>"
  exit 1
fi

echo "Creating preview channel: $CHANNEL_NAME"

firebase hosting:channel:deploy $CHANNEL_NAME \
  --site onairmultimedia \
  --expires 7d \
  --non-interactive

echo "Preview URL: https://$CHANNEL_NAME---onairmultimedia.web.app"
echo "Channel expires in 7 days"
