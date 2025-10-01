import pagesSingleSource from './rules/rule-pages-single-source';
import indexNoRedirect from './rules/rule-index-no-redirect';
import infoNoFramebust from './rules/rule-info-no-framebust';
import serviceWorkerFallback from './rules/rule-sw-404-fallback';
import duplication from './rules/rule-duplication-jscpd';
import mocksPlaceholders from './rules/rule-mocks-placeholders';
import htmlValidators from './rules/rule-html-validators';
import firebaseHostingSync from './rules/rule-firebase-hosting-sync';
import firebasePreviewChannels from './rules/rule-firebase-preview-channels';
import binaryFiles from './rules/rule-binary-files';
import lockfiles from './rules/rule-lockfiles';
import securityHeaders from './rules/rule-security-headers';
import webtritSwipe from './rules/rule-webtrit-swipe';
import appVisibility from './rules/rule-app-visibility';

export default { 
  pagesSingleSource, 
  indexNoRedirect, 
  infoNoFramebust, 
  serviceWorkerFallback, 
  duplication, 
  mocksPlaceholders, 
  htmlValidators,
  firebaseHostingSync,
  firebasePreviewChannels,
  binaryFiles,
  lockfiles,
  securityHeaders,
  webtritSwipe,
  appVisibility
} as const;