/**
 * DoW -> DoD Text Replacer
 *
 * Walks visible text nodes on the page and swaps:
 *   "Department of War"  -> "Department of Defense"
 *   "War Department"     -> "Defense Department"
 *   "Gulf of America"    -> "Gulf of Mexico"
 *   "DoW"                -> "DoD"
 *
 * The phrases are matched case-insensitively but the replacement's
 * capitalization is made to match the original (ALL CAPS, lower case,
 * or as-written), so "DEPARTMENT OF WAR" -> "DEPARTMENT OF DEFENSE" and
 * "department of war" -> "department of defense".
 *
 * "DoW" is matched as an exact-case whole word so this doesn't touch
 * unrelated words/names like "Dow Jones" or "dowry".
 */
(function () {
  'use strict';

  const PHRASE_REPLACEMENTS = [
    { regex: /\bDepartment of War\b/gi, target: 'Department of Defense' },
    { regex: /\bWar Department\b/gi, target: 'Defense Department' },
    { regex: /\bGulf of America\b/gi, target: 'Gulf of Mexico' }
  ];

  // Exact-case, whole-word acronym swap. Not applied case-insensitively
  // on purpose, to avoid clobbering things like "Dow Jones".
  const ACRONYM_REGEX = /\bDoW\b/g;
  const ACRONYM_TARGET = 'DoD';

  // Quick pre-check so we don't run the full regex set over every text
  // node on the page (cheap string search first, regex only if needed).
  const QUICK_CHECK = /war|dow|gulf/i;

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT',
    'CODE', 'PRE', 'TITLE'
  ]);

  function matchCasing(original, target) {
    if (original === original.toUpperCase()) return target.toUpperCase();
    if (original === original.toLowerCase()) return target.toLowerCase();
    // Mixed case: the targets are already written in their canonical form
    // ("Department of Defense", "Gulf of Mexico"), so use them as-is rather
    // than title-casing, which would capitalize the "of".
    return target;
  }

  function replaceInString(text) {
    let result = text;
    for (const { regex, target } of PHRASE_REPLACEMENTS) {
      regex.lastIndex = 0;
      result = result.replace(regex, (match) => matchCasing(match, target));
    }
    ACRONYM_REGEX.lastIndex = 0;
    result = result.replace(ACRONYM_REGEX, ACRONYM_TARGET);
    return result;
  }

  function isSkippableNode(textNode) {
    const el = textNode.parentElement;
    if (!el) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function processTextNode(node) {
    if (node.nodeType !== Node.TEXT_NODE) return;
    if (isSkippableNode(node)) return;
    const original = node.nodeValue;
    if (!original || !QUICK_CHECK.test(original)) return;
    const replaced = replaceInString(original);
    if (replaced !== original) node.nodeValue = replaced;
  }

  function walkAndReplace(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      processTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      processTextNode(node);
    }
  }

  function processTitle() {
    if (document.title && QUICK_CHECK.test(document.title)) {
      const replaced = replaceInString(document.title);
      if (replaced !== document.title) document.title = replaced;
    }
  }

  function runFullPass() {
    processTitle();
    walkAndReplace(document.body || document.documentElement);
  }

  // --- Batch pending mutation targets and process them off the main
  // rendering hot-path, so we don't fight the page's own scripts. ---
  let scheduled = false;
  const pendingNodes = new Set();

  function flushPending() {
    scheduled = false;
    const batch = Array.from(pendingNodes);
    pendingNodes.clear();
    for (const node of batch) {
      walkAndReplace(node);
    }
    processTitle();
  }

  function scheduleFlush(nodes) {
    for (const n of nodes) pendingNodes.add(n);
    if (scheduled) return;
    scheduled = true;
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
    idle(flushPending, { timeout: 500 });
  }

  function startObserving() {
    const observer = new MutationObserver((mutations) => {
      if (!extensionEnabled) return;
      const touched = [];
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          touched.push(mutation.target);
        } else if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((n) => touched.push(n));
        }
      }
      if (touched.length) scheduleFlush(touched);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // --- Enable/disable toggle, persisted via chrome.storage.sync ---
  let extensionEnabled = true;

  function init() {
    if (!(window.chrome && chrome.storage && chrome.storage.sync)) {
      // storage API unavailable for some reason; just run once.
      runFullPass();
      startObserving();
      return;
    }

    chrome.storage.sync.get({ enabled: true }, (data) => {
      extensionEnabled = data.enabled !== false;
      if (extensionEnabled) runFullPass();
      startObserving();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync' || !changes.enabled) return;
      extensionEnabled = changes.enabled.newValue !== false;
      if (extensionEnabled) runFullPass();
    });
  }

  init();
})();
