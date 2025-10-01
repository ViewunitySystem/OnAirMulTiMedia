import pagesSingleSource from './rule-pages-single-source';
import indexNoRedirect from './rule-index-no-redirect';
import infoNoFramebust from './rule-info-no-framebust';
import serviceWorkerFallback from './rule-sw-404-fallback';
import duplication from './rule-duplication-jscpd';
import mocksPlaceholders from './rule-mocks-placeholders';
import htmlValidators from './rule-html-validators';
import firebaseHostingSync from './rule-firebase-hosting-sync';
import firebasePreviewChannels from './rule-firebase-preview-channels';

export default { 
  pagesSingleSource, 
  indexNoRedirect, 
  infoNoFramebust, 
  serviceWorkerFallback, 
  duplication, 
  mocksPlaceholders, 
  htmlValidators,
  firebaseHostingSync,
  firebasePreviewChannels
} as const;
