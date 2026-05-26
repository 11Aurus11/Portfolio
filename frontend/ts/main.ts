// Типы для формы
namespace MyApp {
    export interface FormData {
    name: string;
    phone: string;
    email: string;
    comment: string;
  }
}

interface ApiSuccessResponse {
  message?: string;
  text?: string;
}

interface ApiErrorResponse {
  message: string;
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

// Тип для функции-валидатора
type ValidatorFn = (value: string) => string;

// Навигация
const nav = document.getElementById('nav');
const burger = document.getElementById('burger');

// Скролл эффект
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// Мобильное меню
const mobileMenu = document.createElement('div');
mobileMenu.className = 'nav__mobile-menu';

const menuItems: Array<{ label: string; href: string }> = [
  { label: 'Стек', href: '#about' },
  { label: 'Подход', href: '#approach' },
  { label: 'Кейсы', href: '#cases' },
  { label: 'Контакт', href: '#contact' },
];

menuItems.forEach(({ label, href }) => {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = label;
  a.addEventListener('click', closeMobileMenu);
  mobileMenu.appendChild(a);
});
document.body.appendChild(mobileMenu);

function openMobileMenu(): void {
  mobileMenu.classList.add('open');
  burger?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu(): void {
  mobileMenu.classList.remove('open');
  burger?.classList.remove('open');
  document.body.style.overflow = '';
}

burger?.addEventListener('click', () => {
  mobileMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
});

// Скролл анимации
function initScrollAnimations(): void {
  const selectors = '.approach__card, .case-card, .about__exp-item, .stack-group, .ai-block';
  const targets = document.querySelectorAll<HTMLElement>(selectors);

  targets.forEach((el) => el.classList.add('fade-up'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

initScrollAnimations();

// Валидаторы для полей формы
const validators: Record<string, ValidatorFn> = {
  name: (v) => {
    if (!v.trim()) return 'Введите имя';
    if (v.trim().length < 2) return 'Имя слишком короткое';
    return '';
  },
  phone: (v) => {
    const cleaned = v.replace(/\D/g, '');
    if (!v.trim()) return 'Введите телефон';
    if (cleaned.length < 10) return 'Неверный формат телефона';
    return '';
  },
  email: (v) => {
    if (!v.trim()) return 'Введите email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Неверный формат email';
    return '';
  },
};

function validateField(fieldName: string, value: string): boolean {
  const input = document.getElementById(fieldName);
  const error = document.getElementById(`${fieldName}-error`);
  if (!validators[fieldName] || !input || !error) return true;

  const msg = validators[fieldName](value);
  error.textContent = msg;
  input.classList.toggle('invalid', Boolean(msg));
  return !msg;
}

// Проверка в реальном времени при размытии
(['name', 'phone', 'email'] as const).forEach((fieldName) => {
  const input = document.getElementById(fieldName);
  input?.addEventListener('blur', (e) => {
    validateField(fieldName, (e.target as HTMLInputElement).value);
  });
  input?.addEventListener('input', (e) => {
    if (input.classList.contains('invalid')) {
      validateField(fieldName, (e.target as HTMLInputElement).value);
    }
  });
});

// Отправка формы
const form = document.getElementById('contactForm') as HTMLFormElement | null;
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement | null;
const formStatus = document.getElementById('formStatus');

function setLoading(loading: boolean): void {
  if (!submitBtn) return;
  submitBtn.disabled = loading;
  const text = submitBtn.querySelector('.btn__text') as HTMLElement | null;
  const loader = submitBtn.querySelector('.btn__loader') as HTMLElement | null;
  if (text) text.hidden = loading;
  if (loader) loader.hidden = !loading;
}

function showStatus(type: 'success' | 'error', message: string): void {
  if (!formStatus) return;
  formStatus.className = `form-status ${type}`;
  formStatus.textContent = message;
  formStatus.hidden = false;
  setTimeout(() => { if (formStatus) formStatus.hidden = true; }, 6000);
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameEl = document.getElementById('name') as HTMLInputElement | null;
  const phoneEl = document.getElementById('phone') as HTMLInputElement | null;
  const emailEl = document.getElementById('email') as HTMLInputElement | null;
  const commentEl = document.getElementById('comment') as HTMLTextAreaElement | null;

  const isValid = [
    validateField('name', nameEl?.value  ?? ''),
    validateField('phone', phoneEl?.value ?? ''),
    validateField('email', emailEl?.value ?? ''),
  ].every(Boolean);

  if (!isValid) return;

  const payload: MyApp.FormData = {
    name: nameEl?.value.trim() ?? '',
    phone: phoneEl?.value.trim() ?? '',
    email: emailEl?.value.trim() ?? '',
    comment: commentEl?.value.trim() ?? '',
  };

  setLoading(true);

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as ApiResponse;

    if (!res.ok) throw new Error((data as ApiErrorResponse).message ?? 'Ошибка сервера');

    showStatus('success', 'Сообщение отправлено! Копия выслана на ваш email.');
    form.reset();
    hideAiOutput();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Неизвестная ошибка';
    showStatus('error', `Не удалось отправить: ${msg}`);
  } finally {
    setLoading(false);
  }
});

// ИИ помощник
const aiHelperBtn = document.getElementById('aiHelperBtn');
const aiHelperOutput = document.getElementById('aiHelperOutput');
const aiHelperText = document.getElementById('aiHelperText');
const aiHelperUse = document.getElementById('aiHelperUse');
const commentField = document.getElementById('comment') as HTMLTextAreaElement | null;

function hideAiOutput(): void {
  if (aiHelperOutput) aiHelperOutput.hidden = true;
  if (aiHelperText) aiHelperText.textContent = '';
}

aiHelperBtn?.addEventListener('click', async () => {
  const nameEl = document.getElementById('name') as HTMLInputElement | null;
  const commentEl = document.getElementById('comment') as HTMLTextAreaElement | null;

  const name  = nameEl?.value.trim() || 'пользователь';
  const draft = commentEl?.value.trim();

  (aiHelperBtn as HTMLButtonElement).disabled = true;
  if (aiHelperOutput) aiHelperOutput.hidden = false;
  if (aiHelperText) aiHelperText.textContent = 'Генерирую текст...';

  try {
    const res = await fetch('/api/ai-helper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, draft }),
    });

    const data = await res.json() as ApiSuccessResponse & ApiErrorResponse;
    if (!res.ok) throw new Error(data.message ?? 'Ошибка AI');

    if (aiHelperText) aiHelperText.textContent = data.text ?? '';
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ошибка';
    if (aiHelperText) aiHelperText.textContent = `Ошибка: ${msg}`;
  } finally {
    (aiHelperBtn as HTMLButtonElement).disabled = false;
  }
});

aiHelperUse?.addEventListener('click', () => {
  if (commentField && aiHelperText?.textContent) {
    commentField.value = aiHelperText.textContent;
    commentField.focus();
  }
});
