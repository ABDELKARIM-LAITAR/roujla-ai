/* ============================================================
   ROUJLA AI - configuration, translations and prompt presets
   Copyright (c) 2026 ABDELKARIM LAITAR. All rights reserved.
   ============================================================ */

'use strict';

const APP = {
  version: '1.0.0',
  /* Site family: GitHub Pages today, custom domain in the future.
     Links switch automatically based on the current hostname. */
  sites: {
    github: {
      main: 'https://abdelkarim-laitar.github.io/roujla/',
      soft: 'https://abdelkarim-laitar.github.io/roujlasoft/',
      map: 'https://abdelkarim-laitar.github.io/roujla-map/'
    },
    domain: {
      main: 'https://www.roujla.com/',
      soft: 'https://soft.roujla.com/',
      map: 'https://map.roujla.com/'
    }
  },
  /* Free, no-key OpenAI-compatible endpoint used by default. */
  endpoint: 'https://text.pollinations.ai/openai',
  freeModels: ['openai', 'openai-fast'],
  maxHistory: 20,
  maxChars: 8000,
  timeoutMs: 90000
};

/* Returns the right family links for the hostname we are served from. */
function siteFamily(hostname) {
  return /(^|\.)roujla\.com$/i.test(hostname || '') ? APP.sites.domain : APP.sites.github;
}

const LS = {
  settings: 'roujla_ai_settings_v1',
  chats: 'roujla_ai_chats_v1',
  active: 'roujla_ai_active_v1'
};

const DEFAULT_SETTINGS = {
  provider: 'pollinations',
  model: 'openai',
  temperature: 0.7,
  system: '',
  baseUrl: '',
  apiKey: '',
  lang: 'ar',
  theme: 'system'
};

const SYSTEM_PROMPT = {
  ar: 'أنت ROUJLA AI، مساعد ذكاء اصطناعي عربي ودود ودقيق. أجب بنفس لغة المستخدم وبأسلوب واضح ومنظم. استخدم تنسيق Markdown عند الحاجة (عناوين، قوائم مرقمة، أكواد). كن صريحاً إذا لم تكن تعرف الإجابة أو إذا كانت المعلومة غير مؤكدة، واذكر ذلك بوضوح. لا تطلب معلومات شخصية حساسة. اجعل الإجابة مختصرة ومفيدة افتراضياً، وفصّل أكثر إذا طلب المستخدم ذلك.',
  en: 'You are ROUJLA AI, a friendly and accurate AI assistant. Reply in the same language as the user, in a clear and well-structured way. Use Markdown when helpful (headings, numbered lists, code blocks). Be honest when you do not know something or when information is uncertain. Never ask for sensitive personal data. Keep answers concise and useful by default, and go deeper when the user asks.'
};

const SUGGESTIONS = {
  ar: [
    { icon: 'spark',    title: 'اشرح لي الذكاء الاصطناعي ببساطة', sub: 'تعريف واضح مع أمثلة من الحياة', prompt: 'اشرح لي الذكاء الاصطناعي ببساطة، مع أمثلة من الحياة اليومية.' },
    { icon: 'calendar', title: 'اكتب لي خطة مذاكرة أسبوعية',       sub: 'خطة عملية تناسب وقتي',          prompt: 'اكتب لي خطة مذاكرة أسبوعية عملية، مع توزيع الوقت وأهداف يومية واضحة.' },
    { icon: 'mail',     title: 'ساعدني في كتابة بريد إلكتروني',    sub: 'صياغة واضحة ومهذبة',           prompt: 'ساعدني في كتابة بريد إلكتروني احترافي ومهذب إلى مديري بخصوص طلب اجتماع.' },
    { icon: 'code',     title: 'أعطني أفكاراً لمشروع برمجي',        sub: 'أفكار قابلة للتنفيذ للمبتدئين', prompt: 'أعطني خمس أفكار لمشاريع برمجية صغيرة قابلة للتنفيذ للمبتدئين، مع الأدوات المقترحة.' }
  ],
  en: [
    { icon: 'spark',    title: 'Explain AI in simple terms',       sub: 'A clear definition with examples', prompt: 'Explain artificial intelligence in simple terms, with everyday examples.' },
    { icon: 'calendar', title: 'Make me a weekly study plan',      sub: 'A practical plan that fits my time', prompt: 'Create a practical weekly study plan with time blocks and clear daily goals.' },
    { icon: 'mail',     title: 'Help me write a professional email', sub: 'Clear and polite wording',        prompt: 'Help me write a professional and polite email to my manager requesting a meeting.' },
    { icon: 'code',     title: 'Give me small coding project ideas', sub: 'Beginner-friendly ideas',         prompt: 'Give me five small coding project ideas for beginners, with suggested tools.' }
  ]
};

const I18N = {
  ar: {
    dir: 'rtl',
    pageTitle: 'ROUJLA AI — مساعدك الذكي',
    newChat: 'محادثة جديدة',
    searchChats: 'ابحث في المحادثات',
    emptyChats: 'لا توجد محادثات بعد',
    noResults: 'لا نتائج مطابقة',
    settings: 'الإعدادات',
    settingsTitle: 'الإعدادات',
    theme: 'المظهر',
    deleteChat: 'حذف المحادثة',
    confirmDelete: 'هل تريد حذف هذه المحادثة؟',
    deleted: 'تم حذف المحادثة',
    noChat: 'لا توجد محادثة مفتوحة',
    welcomeTitle: 'كيف يمكنني مساعدتك؟',
    welcomeSub: 'اسأل عن أي شيء: الشرح، الكتابة، البرمجة، التخطيط... أنا هنا للمساعدة.',
    badgeFree: 'مجاني',
    badgeNoSignup: 'بدون تسجيل',
    badgeArabic: 'يدعم العربية',
    privacyShort: 'أسئلتك تُرسل إلى خدمة الذكاء الاصطناعي لمعالجتها. لا تشارك معلومات حساسة.',
    placeholder: 'اكتب سؤالك هنا...',
    send: 'إرسال',
    stop: 'إيقاف',
    thinking: 'يفكر',
    copy: 'نسخ',
    copied: 'تم النسخ',
    regenerate: 'إعادة التوليد',
    retry: 'إعادة المحاولة',
    errorTitle: 'تعذر الحصول على إجابة',
    errorGeneric: 'حدث خطأ غير متوقع. أعد المحاولة بعد قليل.',
    errorNetwork: 'تعذر الاتصال بالخدمة. تحقق من اتصالك بالإنترنت ثم أعد المحاولة.',
    errorTimeout: 'استغرق الطلب وقتاً طويلاً. جرّب سؤالاً أقصر أو أعد المحاولة.',
    errorBusy: 'الخدمة المجانية مشغولة الآن. جرّب النموذج «السريع» أو أضف مفتاح API خاصاً بك من الإعدادات.',
    errorRate: 'طلبات كثيرة في وقت قصير. انتظر قليلاً ثم أعد المحاولة.',
    errorAuth: 'مفتاح API غير صالح أو غير مصرح به. تحقق من الإعدادات.',
    errorEmpty: 'وصل رد فارغ من الخدمة. أعد المحاولة.',
    stopped: 'تم إيقاف الإجابة.',
    tooLong: 'النص طويل جداً. اختصره قليلاً ثم أرسله.',
    saved: 'تم حفظ الإعدادات',
    fileExported: 'تم تصدير الملف',
    confirmClearAll: 'سيتم حذف كل المحادثات والإعدادات من هذا المتصفح. هل أنت متأكد؟',
    cleared: 'تم حذف كل البيانات',
    provider: 'مزوّد الذكاء الاصطناعي',
    providerFree: 'ROUJLA AI المجاني',
    providerFreeDesc: 'يعمل مباشرة بدون تسجيل أو مفتاح.',
    providerCustom: 'واجهة API خاصة',
    providerCustomDesc: 'استخدم OpenAI أو أي خدمة متوافقة.',
    model: 'النموذج',
    modelOpenAI: 'OpenAI — متوازن',
    modelOpenAIFast: 'OpenAI Fast — أسرع',
    modelHint: 'اختر «سريع» إذا كانت الخدمة المجانية مزدحمة.',
    customModelLabel: 'اسم النموذج',
    baseUrl: 'عنوان API',
    baseUrlHint: 'مثال: https://api.openai.com/v1 — يجب أن يسمح الخادم بطلبات المتصفح (CORS).',
    apiKey: 'مفتاح API',
    apiKeyHint: 'يُخزَّن في متصفحك فقط ولا يُرسل إلا للخدمة التي تختارها.',
    show: 'إظهار',
    hide: 'إخفاء',
    temperature: 'الإبداع (temperature)',
    temperatureHint: 'قيمة أقل = إجابات أدق ومباشرة، قيمة أعلى = إجابات أكثر تنوعاً.',
    systemPrompt: 'تعليمات المساعد',
    systemHint: 'اتركه فارغاً لاستخدام التعليمات الافتراضية.',
    appearance: 'المظهر واللغة',
    uiLanguage: 'لغة الواجهة',
    themeLabel: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    system: 'حسب النظام',
    data: 'البيانات',
    exportAll: 'تصدير المحادثات',
    clearAll: 'حذف كل البيانات',
    privacyNote: 'تنبيه: أسئلتك تُرسل إلى مزوّد الخدمة لمعالجتها. لا تشارك معلومات شخصية أو حساسة. تُحفظ محادثاتك في متصفحك فقط.',
    cancel: 'إلغاء',
    save: 'حفظ',
    disclaimer: 'ROUJLA AI قد يخطئ. تحقق من المعلومات المهمة قبل الاعتماد عليها.',
    modelChipFree: 'ROUJLA AI · مجاني',
    modelChipCustom: 'API خاص',
    statusOnline: 'متصل بالإنترنت',
    statusOffline: 'غير متصل بالإنترنت',
    close: 'إغلاق',
    menu: 'القائمة',
    voice: 'إدخال صوتي',
    you: 'أنت',
    assistant: 'ROUJLA AI',
    exportChat: 'تصدير المحادثة',
    clearChat: 'حذف المحادثة'
  },
  en: {
    dir: 'ltr',
    pageTitle: 'ROUJLA AI — Your smart assistant',
    newChat: 'New chat',
    searchChats: 'Search chats',
    emptyChats: 'No conversations yet',
    noResults: 'No matching chats',
    settings: 'Settings',
    settingsTitle: 'Settings',
    theme: 'Theme',
    deleteChat: 'Delete chat',
    confirmDelete: 'Delete this conversation?',
    deleted: 'Conversation deleted',
    noChat: 'No conversation open',
    welcomeTitle: 'How can I help you?',
    welcomeSub: 'Ask about anything: explanations, writing, coding, planning... I am here to help.',
    badgeFree: 'Free',
    badgeNoSignup: 'No sign-up',
    badgeArabic: 'Arabic first',
    privacyShort: 'Your questions are sent to an AI service for processing. Do not share sensitive data.',
    placeholder: 'Type your question...',
    send: 'Send',
    stop: 'Stop',
    thinking: 'Thinking',
    copy: 'Copy',
    copied: 'Copied',
    regenerate: 'Regenerate',
    retry: 'Try again',
    errorTitle: 'Could not get an answer',
    errorGeneric: 'Something went wrong. Please try again in a moment.',
    errorNetwork: 'Could not reach the service. Check your internet connection and try again.',
    errorTimeout: 'The request took too long. Try a shorter question or retry.',
    errorBusy: 'The free service is busy right now. Try the fast model or add your own API key in Settings.',
    errorRate: 'Too many requests in a short time. Wait a moment and try again.',
    errorAuth: 'The API key is invalid or not authorized. Check your settings.',
    errorEmpty: 'The service returned an empty answer. Please retry.',
    stopped: 'Answer stopped.',
    tooLong: 'The text is too long. Shorten it and try again.',
    saved: 'Settings saved',
    fileExported: 'File exported',
    confirmClearAll: 'This deletes all conversations and settings from this browser. Are you sure?',
    cleared: 'All data cleared',
    provider: 'AI provider',
    providerFree: 'ROUJLA AI Free',
    providerFreeDesc: 'Works instantly with no sign-up or key.',
    providerCustom: 'Custom API',
    providerCustomDesc: 'Use OpenAI or any compatible service.',
    model: 'Model',
    modelOpenAI: 'OpenAI — Balanced',
    modelOpenAIFast: 'OpenAI Fast — Faster',
    modelHint: 'Pick "Fast" when the free service is busy.',
    customModelLabel: 'Model name',
    baseUrl: 'API base URL',
    baseUrlHint: 'Example: https://api.openai.com/v1 — the server must allow browser requests (CORS).',
    apiKey: 'API key',
    apiKeyHint: 'Stored only in your browser and sent only to the service you choose.',
    show: 'Show',
    hide: 'Hide',
    temperature: 'Creativity (temperature)',
    temperatureHint: 'Lower = more precise, higher = more varied answers.',
    systemPrompt: 'Assistant instructions',
    systemHint: 'Leave empty to use the default instructions.',
    appearance: 'Appearance and language',
    uiLanguage: 'Interface language',
    themeLabel: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    data: 'Data',
    exportAll: 'Export chats',
    clearAll: 'Delete all data',
    privacyNote: 'Your questions are sent to the AI provider for processing. Never share personal or sensitive information. Chats are stored in your browser only.',
    cancel: 'Cancel',
    save: 'Save',
    disclaimer: 'ROUJLA AI can make mistakes. Verify important information.',
    modelChipFree: 'ROUJLA AI · Free',
    modelChipCustom: 'Custom API',
    statusOnline: 'Online',
    statusOffline: 'Offline',
    close: 'Close',
    menu: 'Menu',
    voice: 'Voice input',
    you: 'You',
    assistant: 'ROUJLA AI',
    exportChat: 'Export chat',
    clearChat: 'Delete chat'
  }
};
