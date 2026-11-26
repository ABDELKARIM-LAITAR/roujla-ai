/* ============================================================
   ROUJLA AI - interface, storage and rendering
   Copyright (c) 2026 ABDELKARIM LAITAR. All rights reserved.
   ============================================================ */

'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const state = {
  settings: { ...DEFAULT_SETTINGS },
  chats: [],
  activeId: null,
  streaming: false,
  controller: null,
  thinkTimer: null,
  thinkingStart: 0,
  draftTimer: null
};

const media = window.matchMedia('(prefers-color-scheme: dark)');

/* ---------- Small helpers ---------- */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function t(key) {
  const dict = I18N[state.settings.lang] || I18N.ar;
  return dict[key] || I18N.ar[key] || key;
}

function icon(name) {
  return '<svg class="ico" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function saveSettings() {
  writeJSON(LS.settings, state.settings);
}

function loadState() {
  const saved = readJSON(LS.settings, null);
  state.settings = { ...DEFAULT_SETTINGS, ...(saved && typeof saved === 'object' ? saved : {}) };
  if (!I18N[state.settings.lang]) state.settings.lang = 'ar';
  if (!['pollinations', 'custom'].includes(state.settings.provider)) state.settings.provider = 'pollinations';
  if (!['light', 'dark', 'system'].includes(state.settings.theme)) state.settings.theme = 'system';
  if (!Number.isFinite(Number(state.settings.temperature))) state.settings.temperature = 0.7;

  const chats = readJSON(LS.chats, []);
  state.chats = Array.isArray(chats)
    ? chats.filter(c => c && c.id && Array.isArray(c.messages))
    : [];
  state.chats.forEach(c => {
    c.draft = typeof c.draft === 'string' ? c.draft : '';
    c.title = c.title || t('newChat');
    c.messages = c.messages.filter(m => m && (m.role === 'user' || m.role === 'assistant'));
  });

  let activeId = '';
  try { activeId = localStorage.getItem(LS.active) || ''; } catch (e) {}
  state.activeId = activeId && state.chats.some(c => c.id === activeId) ? activeId : null;
}

function saveChats() {
  state.chats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const list = state.chats.slice(0, 60);
  if (!writeJSON(LS.chats, list)) {
    let smaller = list.slice(0, 20);
    while (smaller.length > 1 && !writeJSON(LS.chats, smaller)) {
      smaller = smaller.slice(0, Math.max(1, Math.floor(smaller.length / 2)));
    }
    state.chats = smaller;
    if (state.activeId && !state.chats.some(c => c.id === state.activeId)) state.activeId = null;
  }
  try { localStorage.setItem(LS.active, state.activeId || ''); } catch (e) {}
}

function activeChat() {
  return state.chats.find(c => c.id === state.activeId) || null;
}

function formatDate(ts) {
  const date = new Date(ts || Date.now());
  const now = new Date();
  const locale = state.settings.lang === 'ar' ? 'ar-DZ' : 'en';
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function dateStamp() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* ---------- Theme ---------- */

function isDark() {
  return state.settings.theme === 'dark' ||
    (state.settings.theme === 'system' && media.matches);
}

function applyTheme() {
  const dark = isDark();
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.classList.toggle('light', !dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#07110c' : '#16a34a');
  updateThemeButton();
}

function updateThemeButton() {
  const btn = $('#themeBtn');
  if (!btn) return;
  btn.innerHTML = icon(isDark() ? 'sun' : 'moon');
  btn.title = t('theme');
}

function toggleTheme() {
  state.settings.theme = isDark() ? 'light' : 'dark';
  saveSettings();
  applyTheme();
}

media.addEventListener('change', () => {
  if (state.settings.theme === 'system') applyTheme();
});

/* ---------- Language ---------- */

function applyLang() {
  const dict = I18N[state.settings.lang] || I18N.ar;
  document.documentElement.lang = state.settings.lang;
  document.documentElement.dir = dict.dir;
  document.title = dict.pageTitle;

  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) el.textContent = dict[key];
  });
  $$('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    if (dict[key]) el.placeholder = dict[key];
  });

  updateStaticTitles();
  renderSuggestions();
  updateModelChip();
  updateSendButton();
  updateThemeButton();
  updateOnline();
  if (!state.streaming) renderMessages();
  renderChatList();
}

function updateStaticTitles() {
  const titles = {
    closeSide: 'close',
    menuBtn: 'menu',
    clearChat: 'clearChat',
    exportChat: 'exportChat',
    topSettings: 'settings',
    settingsBtn: 'settings',
    themeBtn: 'theme',
    micBtn: 'voice',
    modelChip: 'settings'
  };
  Object.keys(titles).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.title = t(titles[id]);
  });
  const prompt = $('#prompt');
  if (prompt) prompt.setAttribute('aria-label', t('placeholder'));
}

/* ---------- Markdown (small, safe renderer) ---------- */

function inlineMd(text) {
  let s = escapeHtml(text);
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return s;
}

function renderMarkdown(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let inCode = false;
  let codeLang = '';
  let code = [];
  let listType = null;
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html += '<p>' + inlineMd(paragraph.join(' ')) + '</p>';
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      html += '</' + listType + '>';
      listType = null;
    }
  };
  const openList = type => {
    if (listType !== type) {
      closeList();
      listType = type;
      html += '<' + type + '>';
    }
  };

  for (const line of lines) {
    if (inCode) {
      if (/^```/.test(line)) {
        html += '<pre><div class="pre-head"><span>' + escapeHtml(codeLang || 'code') + '</span>' +
          '<button type="button" class="copy-code">' + escapeHtml(t('copy')) + '</button></div>' +
          '<code>' + escapeHtml(code.join('\n')) + '</code></pre>';
        inCode = false;
        codeLang = '';
        code = [];
      } else {
        code.push(line);
      }
      continue;
    }

    const fence = line.match(/^```([\w+#-]*)\s*$/);
    if (fence) {
      flushParagraph();
      closeList();
      inCode = true;
      codeLang = fence[1] || '';
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html += '<h' + level + '>' + inlineMd(heading[2]) + '</h' + level + '>';
      continue;
    }

    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      flushParagraph();
      closeList();
      html += '<hr>';
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      closeList();
      html += '<blockquote>' + inlineMd(quote[1]) + '</blockquote>';
      continue;
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      openList('ul');
      html += '<li>' + inlineMd(unordered[1]) + '</li>';
      continue;
    }

    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      openList('ol');
      html += '<li>' + inlineMd(ordered[1]) + '</li>';
      continue;
    }

    paragraph.push(line.trim());
  }

  if (inCode) html += '<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>';
  flushParagraph();
  closeList();

  return html || '<p></p>';
}

/* ---------- Rendering ---------- */

function renderSuggestions() {
  const wrap = $('#suggestions');
  if (!wrap) return;
  const items = SUGGESTIONS[state.settings.lang] || SUGGESTIONS.ar;
  wrap.innerHTML = '';
  items.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sugg';
    button.dataset.prompt = item.prompt;
    button.innerHTML = '<span class="sugg-ico">' + icon(item.icon) + '</span>' +
      '<span><b></b><small></small></span>';
    button.querySelector('b').textContent = item.title;
    button.querySelector('small').textContent = item.sub;
    wrap.appendChild(button);
  });
}

function messageEl(message, index) {
  const article = document.createElement('article');
  article.className = 'msg ' + (message.role === 'user' ? 'user' : 'assistant');
  article.dataset.index = String(index);
  if (message.error) article.classList.add('has-error');

  if (message.role === 'assistant') {
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = '<img src="icon.svg" alt="">';
    article.appendChild(avatar);
  }

  const body = document.createElement('div');
  body.className = 'msg-body';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (message.pending) {
    bubble.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>' +
      '<span class="think">' + escapeHtml(t('thinking')) + ' <span class="think-time">0s</span></span>';
  } else if (message.error) {
    bubble.innerHTML = '<div class="err"><b>' + escapeHtml(t('errorTitle')) + '</b>' +
      '<p>' + escapeHtml(message.content) + '</p>' +
      '<div class="err-actions"><button type="button" class="btn-mini" data-act="retry">' +
      icon('refresh') + ' ' + escapeHtml(t('retry')) + '</button></div></div>';
  } else if (message.stopped) {
    bubble.innerHTML = '<div class="stopped"><span>' + escapeHtml(message.content) + '</span>' +
      '<button type="button" class="btn-mini" data-act="retry">' +
      icon('refresh') + ' ' + escapeHtml(t('regenerate')) + '</button></div>';
  } else if (message.role === 'user') {
    bubble.innerHTML = '<p>' + escapeHtml(message.content).replace(/\n/g, '<br>') + '</p>';
  } else {
    bubble.innerHTML = '<div class="md">' + renderMarkdown(message.content) + '</div>';
  }

  body.appendChild(bubble);

  if (!message.pending) {
    const actions = document.createElement('div');
    actions.className = 'msg-actions';
    const copyTitle = escapeHtml(t('copy'));
    let actionHtml = '<button type="button" class="act" data-act="copy" title="' + copyTitle +
      '" aria-label="' + copyTitle + '">' + icon('copy') + '</button>';
    if (message.role === 'assistant' && !message.error) {
      const regenTitle = escapeHtml(t('regenerate'));
      actionHtml += '<button type="button" class="act" data-act="regen" title="' + regenTitle +
        '" aria-label="' + regenTitle + '">' + icon('refresh') + '</button>';
    }
    actions.innerHTML = actionHtml;
    body.appendChild(actions);
  }

  article.appendChild(body);
  return article;
}

function renderMessages() {
  const box = $('#messages');
  if (!box) return;
  const chat = activeChat();
  const hasMessages = !!(chat && chat.messages.length);
  const welcome = $('#welcome');
  if (welcome) welcome.hidden = hasMessages;

  box.innerHTML = '';
  if (hasMessages) {
    chat.messages.forEach((message, index) => box.appendChild(messageEl(message, index)));
  }

  requestAnimationFrame(() => {
    const scroller = $('#chatScroll');
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  });
}

function renderChatList() {
  const wrap = $('#chatList');
  const empty = $('#chatEmpty');
  if (!wrap) return;

  const query = (($('#chatSearch') && $('#chatSearch').value) || '').trim().toLowerCase();
  const chats = [...state.chats]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .filter(chat => {
      if (!query) return true;
      if ((chat.title || '').toLowerCase().includes(query)) return true;
      return chat.messages.some(m => (m.content || '').toLowerCase().includes(query));
    });

  wrap.innerHTML = '';
  chats.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'chat-item' + (chat.id === state.activeId ? ' active' : '');
    item.dataset.id = chat.id;
    item.tabIndex = 0;
    item.setAttribute('role', 'button');

    const title = document.createElement('span');
    title.className = 'ci-title';
    title.textContent = chat.title;

    const date = document.createElement('span');
    date.className = 'ci-date';
    date.textContent = formatDate(chat.updatedAt);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'ci-del';
    del.dataset.del = chat.id;
    del.title = t('deleteChat');
    del.setAttribute('aria-label', t('deleteChat'));
    del.innerHTML = icon('trash');

    item.append(title, date, del);
    wrap.appendChild(item);
  });

  if (empty) {
    empty.hidden = chats.length > 0;
    empty.textContent = state.chats.length ? t('noResults') : t('emptyChats');
  }
}

function updateModelChip() {
  const label = $('#modelLabel');
  if (!label) return;
  const custom = state.settings.provider === 'custom';
  label.textContent = custom ? t('modelChipCustom') : t('modelChipFree');
}

function updateSendButton() {
  const button = $('#sendBtn');
  const prompt = $('#prompt');
  if (!button || !prompt) return;
  if (state.streaming) {
    button.classList.add('stop');
    button.disabled = false;
    button.innerHTML = icon('stop');
    button.title = t('stop');
    button.setAttribute('aria-label', t('stop'));
  } else {
    button.classList.remove('stop');
    button.disabled = !prompt.value.trim();
    button.innerHTML = icon('send');
    button.title = t('send');
    button.setAttribute('aria-label', t('send'));
  }
}

function updateOnline() {
  const dot = $('#netDot');
  if (!dot) return;
  const online = navigator.onLine;
  dot.classList.toggle('off', !online);
  dot.title = t(online ? 'statusOnline' : 'statusOffline');
}

/* ---------- Composer / layout ---------- */

function resizePrompt() {
  const prompt = $('#prompt');
  if (!prompt) return;
  prompt.style.height = 'auto';
  prompt.style.height = Math.min(prompt.scrollHeight, 200) + 'px';
}

function persistDraft() {
  const chat = activeChat();
  if (chat) chat.draft = $('#prompt').value;
}

function scheduleDraftSave() {
  clearTimeout(state.draftTimer);
  state.draftTimer = setTimeout(() => {
    const chat = activeChat();
    if (chat) {
      chat.draft = $('#prompt').value;
      saveChats();
    }
  }, 500);
}

/* ---------- Conversations ---------- */

function newChat() {
  persistDraft();
  state.activeId = null;
  $('#prompt').value = '';
  resizePrompt();
  updateSendButton();
  renderMessages();
  renderChatList();
  closeSidebar();
  $('#prompt').focus();
}

function selectChat(id) {
  const chat = state.chats.find(c => c.id === id);
  if (!chat) return;
  persistDraft();
  state.activeId = id;
  $('#prompt').value = chat.draft || '';
  resizePrompt();
  updateSendButton();
  renderMessages();
  renderChatList();
  closeSidebar();
  $('#prompt').focus();
}

function removeChat(id) {
  const chat = state.chats.find(c => c.id === id);
  if (!chat) return;
  if (!window.confirm(t('confirmDelete'))) return;
  state.chats = state.chats.filter(c => c.id !== id);
  if (state.activeId === id) {
    state.activeId = null;
    $('#prompt').value = '';
    resizePrompt();
  }
  saveChats();
  renderChatList();
  renderMessages();
  updateSendButton();
  toast(t('deleted'));
}

function deleteActiveChat() {
  const chat = activeChat();
  if (!chat) {
    toast(t('noChat'));
    return;
  }
  removeChat(chat.id);
}

function downloadFile(name, text, type) {
  const blob = new Blob([text], { type: type || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function exportCurrentChat() {
  const chat = activeChat();
  if (!chat) {
    toast(t('noChat'));
    return;
  }
  const parts = chat.messages
    .filter(m => !m.pending)
    .map(m => {
      const who = m.role === 'user' ? t('you') : 'ROUJLA AI';
      return '### ' + who + '\n\n' + (m.content || '') + (m.error ? '\n\n*(error)*' : '');
    });
  const markdown = '# ' + chat.title + '\n\n' + parts.join('\n\n') +
    '\n\n---\nROUJLA AI · ' + new Date().toISOString().slice(0, 10) + '\n';
  downloadFile('roujla-ai-' + dateStamp() + '.md', markdown, 'text/markdown');
  toast(t('fileExported'));
}

function exportAllData() {
  const data = {
    app: 'ROUJLA AI',
    version: APP.version,
    exportedAt: new Date().toISOString(),
    settings: { ...state.settings, apiKey: '' },
    chats: state.chats
  };
  downloadFile('roujla-ai-data-' + dateStamp() + '.json', JSON.stringify(data, null, 2), 'application/json');
  toast(t('fileExported'));
}

function clearAllData() {
  if (!window.confirm(t('confirmClearAll'))) return;
  try {
    localStorage.removeItem(LS.chats);
    localStorage.removeItem(LS.active);
    localStorage.removeItem(LS.settings);
  } catch (e) {}
  state.chats = [];
  state.activeId = null;
  state.settings = { ...DEFAULT_SETTINGS };
  $('#prompt').value = '';
  $('#chatSearch').value = '';
  resizePrompt();
  saveSettings();
  applyTheme();
  applyLang();
  closeSettings();
  updateSendButton();
  toast(t('cleared'));
}

/* ---------- Settings ---------- */

function toggleProviderFields(custom) {
  const customFields = $('#customFields');
  const freeFields = $('#freeFields');
  if (customFields) customFields.hidden = !custom;
  if (freeFields) freeFields.hidden = custom;
}

function openSettings() {
  const s = state.settings;
  $('#providerPollinations').checked = s.provider !== 'custom';
  $('#providerCustom').checked = s.provider === 'custom';
  toggleProviderFields(s.provider === 'custom');

  const isFreeModel = APP.freeModels.includes(s.model);
  $('#freeModel').value = isFreeModel ? s.model : 'openai';
  $('#customModel').value = s.provider === 'custom' ? (s.model || '') : (isFreeModel ? 'gpt-4o-mini' : s.model);
  $('#temperature').value = String(s.temperature);
  $('#tempValue').textContent = Number(s.temperature).toFixed(1);
  $('#systemPrompt').value = s.system || '';
  $('#baseUrl').value = s.baseUrl || '';
  $('#apiKey').value = s.apiKey || '';
  $('#apiKey').type = 'password';
  $('#toggleKey').textContent = t('show');
  $('#uiLang').value = s.lang;
  $('#uiTheme').value = s.theme;

  $('#settingsModal').hidden = false;
  document.body.classList.add('modal-open');
  setTimeout(() => {
    const target = s.provider === 'custom' ? $('#customModel') : $('#freeModel');
    if (target) target.focus();
  }, 60);
}

function closeSettings() {
  $('#settingsModal').hidden = true;
  document.body.classList.remove('modal-open');
}

function saveSettingsFromForm(event) {
  if (event) event.preventDefault();
  const provider = $('#providerCustom').checked ? 'custom' : 'pollinations';
  const model = provider === 'custom'
    ? ($('#customModel').value.trim() || 'gpt-4o-mini')
    : ($('#freeModel').value || 'openai');
  const temperature = Math.min(1.5, Math.max(0, Number($('#temperature').value) || 0.7));

  state.settings = {
    ...state.settings,
    provider,
    model,
    temperature,
    system: $('#systemPrompt').value.trim(),
    baseUrl: $('#baseUrl').value.trim(),
    apiKey: $('#apiKey').value.trim(),
    lang: $('#uiLang').value === 'en' ? 'en' : 'ar',
    theme: ['light', 'dark', 'system'].includes($('#uiTheme').value) ? $('#uiTheme').value : 'system'
  };

  saveSettings();
  applyTheme();
  applyLang();
  closeSettings();
  updateSendButton();
  toast(t('saved'));
}

/* ---------- Sidebar ---------- */

function openSidebar() {
  $('#sidebar').classList.add('open');
  $('#scrim').classList.add('show');
}

function closeSidebar() {
  $('#sidebar').classList.remove('open');
  $('#scrim').classList.remove('show');
}

/* ---------- Toast / copy ---------- */

let toastTimer = null;
function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } catch (err) {}
    area.remove();
  }
  toast(t('copied'));
}

/* ---------- Voice input ---------- */

function setupVoice() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const button = $('#micBtn');
  if (!Recognition || !button) return;
  button.hidden = false;

  let recognition = null;
  button.addEventListener('click', () => {
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
      return;
    }
    recognition = new Recognition();
    recognition.lang = state.settings.lang === 'ar' ? 'ar-DZ' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    button.classList.add('rec');

    recognition.onresult = event => {
      const text = event.results[0][0].transcript;
      const prompt = $('#prompt');
      prompt.value = (prompt.value ? prompt.value + ' ' : '') + text;
      prompt.dispatchEvent(new Event('input'));
    };
    recognition.onend = recognition.onerror = () => {
      recognition = null;
      button.classList.remove('rec');
    };
    try {
      recognition.start();
    } catch (e) {
      recognition = null;
      button.classList.remove('rec');
    }
  });
}

/* ---------- URL hand-off ---------- */

function handleQuery() {
  let params;
  try { params = new URLSearchParams(location.search); } catch (e) { return; }
  const query = (params.get('q') || '').trim();
  if (!query) return;

  persistDraft();
  state.activeId = null;
  renderMessages();
  renderChatList();
  const prompt = $('#prompt');
  prompt.value = query.slice(0, APP.maxChars);
  resizePrompt();
  updateSendButton();
  setTimeout(() => prompt.focus(), 120);
}

/* ---------- Events ---------- */

function bindEvents() {
  $('#newChat').addEventListener('click', newChat);
  $('#menuBtn').addEventListener('click', openSidebar);
  $('#closeSide').addEventListener('click', closeSidebar);
  $('#scrim').addEventListener('click', closeSidebar);

  $('#settingsBtn').addEventListener('click', openSettings);
  $('#topSettings').addEventListener('click', openSettings);
  $('#modelChip').addEventListener('click', openSettings);
  $('#closeSettings').addEventListener('click', closeSettings);
  $('#cancelSettings').addEventListener('click', closeSettings);
  $('#settingsModal').addEventListener('click', event => {
    if (event.target === $('#settingsModal')) closeSettings();
  });
  $('#settingsForm').addEventListener('submit', saveSettingsFromForm);

  $('#themeBtn').addEventListener('click', toggleTheme);
  $('#clearChat').addEventListener('click', deleteActiveChat);
  $('#exportChat').addEventListener('click', exportCurrentChat);
  $('#exportDataBtn').addEventListener('click', exportAllData);
  $('#clearAllBtn').addEventListener('click', clearAllData);

  $('#toggleKey').addEventListener('click', () => {
    const input = $('#apiKey');
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    $('#toggleKey').textContent = t(showing ? 'show' : 'hide');
  });

  $$('input[name="provider"]').forEach(radio => {
    radio.addEventListener('change', () => {
      toggleProviderFields($('#providerCustom').checked);
    });
  });

  $('#temperature').addEventListener('input', () => {
    $('#tempValue').textContent = Number($('#temperature').value).toFixed(1);
  });

  $('#chatSearch').addEventListener('input', renderChatList);

  $('#chatList').addEventListener('click', event => {
    const del = event.target.closest('[data-del]');
    if (del) {
      event.stopPropagation();
      removeChat(del.dataset.del);
      return;
    }
    const item = event.target.closest('.chat-item');
    if (item) selectChat(item.dataset.id);
  });

  $('#chatList').addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const item = event.target.closest('.chat-item');
    if (item) {
      event.preventDefault();
      selectChat(item.dataset.id);
    }
  });

  $('#suggestions').addEventListener('click', event => {
    const button = event.target.closest('.sugg');
    if (button) sendMessage(button.dataset.prompt);
  });

  $('#composer').addEventListener('submit', event => {
    event.preventDefault();
    if (state.streaming) stopCurrent();
    else sendMessage();
  });

  const prompt = $('#prompt');
  prompt.addEventListener('input', () => {
    resizePrompt();
    updateSendButton();
    scheduleDraftSave();
  });
  prompt.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (!state.streaming) sendMessage();
    }
  });

  $('#messages').addEventListener('click', event => {
    const codeButton = event.target.closest('.copy-code');
    if (codeButton) {
      const code = codeButton.closest('pre') && codeButton.closest('pre').querySelector('code');
      if (code) copyText(code.textContent);
      return;
    }

    const action = event.target.closest('[data-act]');
    if (!action) return;
    const article = action.closest('.msg');
    const chat = activeChat();
    if (!article || !chat) return;
    const message = chat.messages[Number(article.dataset.index)];
    if (!message) return;

    if (action.dataset.act === 'copy') copyText(message.content || '');
    else if (action.dataset.act === 'retry' || action.dataset.act === 'regen') regenerate();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!$('#settingsModal').hidden) closeSettings();
      else closeSidebar();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      newChat();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault();
      prompt.focus();
    }
  });

  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
}

/* ---------- Start ---------- */

function applySiteLinks() {
  const links = siteFamily(location.hostname);
  const main = $('#familyMain');
  const soft = $('#familySoft');
  const mapLink = $('#familyMap');
  if (main) main.href = links.main;
  if (soft) soft.href = links.soft;
  if (mapLink) mapLink.href = links.map;
}

function init() {
  loadState();
  applyTheme();
  applyLang();
  applySiteLinks();
  bindEvents();
  setupVoice();
  updateOnline();
  renderChatList();
  renderMessages();
  resizePrompt();
  updateSendButton();
  handleQuery();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
