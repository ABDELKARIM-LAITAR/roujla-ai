/* ============================================================
   ROUJLA AI - model requests and conversation actions
   Copyright (c) 2026 ABDELKARIM LAITAR. All rights reserved.
   ============================================================ */

'use strict';

function apiError(message, status, code) {
  const err = new Error(message);
  err.status = status || 0;
  err.code = code || '';
  return err;
}

function extractContent(data) {
  const choice = data && data.choices && data.choices[0];
  const message = choice && choice.message;
  let content = message && message.content;
  if (Array.isArray(content)) {
    content = content.map(part => (part && (part.text || part.content)) || '').join('');
  }
  if (!content && choice) content = choice.text;
  if (!content && data) content = data.response || data.text || data.content;
  return typeof content === 'string' ? content.trim() : '';
}

async function callChat(url, body, key, signal) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, APP.timeoutMs);

  const forwardAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', forwardAbort, { once: true });
  }

  try {
    const headers = { 'content-type': 'application/json', 'accept': 'application/json' };
    if (key) headers.authorization = 'Bearer ' + key;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const raw = await res.text();
    let data = null;
    try { data = JSON.parse(raw); } catch (e) { /* non-JSON error page */ }

    if (!res.ok) {
      const detail = (data && ((data.error && data.error.message) || data.message)) ||
        raw.slice(0, 180) || ('HTTP ' + res.status);
      throw apiError(detail, res.status, 'http');
    }

    const content = extractContent(data);
    if (!content) throw apiError(t('errorEmpty'), res.status, 'empty');
    return content;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      if (timedOut && !(signal && signal.aborted)) {
        throw apiError(t('errorTimeout'), 0, 'timeout');
      }
      throw err;
    }
    if (err && err.status !== undefined) throw err;
    throw apiError(t('errorNetwork'), 0, 'network');
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', forwardAbort);
  }
}

async function requestAnswer(history, signal) {
  const settings = state.settings;
  const systemPrompt = (settings.system || '').trim() ||
    SYSTEM_PROMPT[settings.lang === 'en' ? 'en' : 'ar'];
  const messages = [{ role: 'system', content: systemPrompt }, ...history];

  if (settings.provider === 'custom') {
    const base = (settings.baseUrl || '').trim();
    if (!base) throw apiError(t('baseUrlHint'), 0, 'config');
    const url = /\/chat\/completions\/?$/.test(base)
      ? base
      : base.replace(/\/+$/, '') + '/chat/completions';
    return callChat(url, {
      model: settings.model || 'gpt-4o-mini',
      messages,
      temperature: Number(settings.temperature) || 0.7
    }, settings.apiKey, signal);
  }

  const models = [...new Set([settings.model || 'openai', 'openai-fast', 'openai'])];
  let lastError = null;

  for (const model of models) {
    try {
      return await callChat(APP.endpoint, {
        model,
        messages,
        temperature: Number(settings.temperature) || 0.7,
        referrer: 'roujla-ai'
      }, '', signal);
    } catch (err) {
      if (err && err.name === 'AbortError') throw err;
      lastError = err;
      if (err && [402, 404, 429].includes(err.status)) continue;
      throw err;
    }
  }

  throw lastError || apiError(t('errorGeneric'), 0, 'unknown');
}

function errorText(err) {
  if (!navigator.onLine) return t('errorNetwork');
  if (!err) return t('errorGeneric');
  if (err.code === 'timeout') return t('errorTimeout');
  if (err.code === 'config') return err.message;
  if (err.status === 401 || err.status === 403) return t('errorAuth');
  if (err.status === 402) return t('errorBusy');
  if (err.status === 429) return t('errorRate');
  if (err.status >= 500) return t('errorBusy');
  if (err.code === 'network') return t('errorNetwork');
  if (err.code === 'empty') return t('errorEmpty');
  return t('errorGeneric');
}

function sendMessage(rawText) {
  if (state.streaming) return;

  const text = String(rawText != null ? rawText : ($('#prompt') && $('#prompt').value) || '').trim();
  if (!text) return;
  if (text.length > APP.maxChars) {
    toast(t('tooLong'));
    return;
  }

  let chat = activeChat();
  if (!chat) {
    chat = {
      id: uid(),
      title: text.replace(/\s+/g, ' ').slice(0, 42),
      messages: [],
      draft: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    state.chats.unshift(chat);
    state.activeId = chat.id;
  }

  const isFirstUserMessage = !chat.messages.some(m => m.role === 'user');
  chat.messages.push({ role: 'user', content: text, ts: Date.now() });
  if (isFirstUserMessage) chat.title = text.replace(/\s+/g, ' ').slice(0, 42);
  chat.draft = '';
  chat.updatedAt = Date.now();

  $('#prompt').value = '';
  resizePrompt();
  updateSendButton();
  saveChats();
  renderChatList();
  renderMessages();

  runAssistant(chat);
}

async function runAssistant(chat) {
  if (state.streaming) return;

  state.streaming = true;
  updateSendButton();

  const placeholder = { role: 'assistant', content: '', pending: true, ts: Date.now() };
  chat.messages.push(placeholder);
  chat.updatedAt = Date.now();
  renderMessages();

  state.thinkingStart = Date.now();
  clearInterval(state.thinkTimer);
  state.thinkTimer = setInterval(() => {
    const el = document.querySelector('.think-time');
    if (el) el.textContent = Math.max(1, Math.round((Date.now() - state.thinkingStart) / 1000)) + 's';
  }, 500);

  const controller = new AbortController();
  state.controller = controller;

  try {
    const history = chat.messages
      .filter(m => !m.pending && !m.error && !m.stopped && (m.content || '').trim())
      .slice(-APP.maxHistory)
      .map(m => ({ role: m.role, content: m.content }));

    const answer = await requestAnswer(history, controller.signal);
    chat.messages = chat.messages.filter(m => m !== placeholder);
    chat.messages.push({ role: 'assistant', content: answer, ts: Date.now() });
  } catch (err) {
    console.warn('[ROUJLA AI] request failed:', err);
    chat.messages = chat.messages.filter(m => m !== placeholder);
    if (err && err.name === 'AbortError') {
      chat.messages.push({ role: 'assistant', content: t('stopped'), stopped: true, ts: Date.now() });
    } else {
      chat.messages.push({ role: 'assistant', content: errorText(err), error: true, ts: Date.now() });
    }
  } finally {
    clearInterval(state.thinkTimer);
    state.thinkTimer = null;
    state.streaming = false;
    state.controller = null;
    chat.updatedAt = Date.now();
    saveChats();
    updateSendButton();
    renderMessages();
    renderChatList();
  }
}

function regenerate() {
  if (state.streaming) return;
  const chat = activeChat();
  if (!chat) return;

  let lastUser = -1;
  for (let i = chat.messages.length - 1; i >= 0; i--) {
    if (chat.messages[i].role === 'user') { lastUser = i; break; }
  }
  if (lastUser < 0) return;

  chat.messages = chat.messages.slice(0, lastUser + 1);
  chat.updatedAt = Date.now();
  saveChats();
  renderMessages();
  runAssistant(chat);
}

function stopCurrent() {
  if (state.streaming && state.controller) state.controller.abort();
}
