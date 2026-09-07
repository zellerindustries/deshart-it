/**
 * Configuration & Constants
 */
const CONFIG = {
  LOCK_KEY: 'desh_art_form_lock',
  SUCCESS_KEY: 'desh_art_form_submitted',
  LOCK_DURATION_MS: 5 * 60 * 1000,
  MIN_FILL_TIME_SECONDS: 3,
  MAX_MESSAGE_LENGTH: 5000,
  DEBOUNCE_MS: 200,
};

interface ContactFormData {
  name: string;
  email: string;
  message: string;
  'bot-field': string;
  submission_speed: number;
}

/* ==========================================
   FORM INITIALIZATION
========================================== */

export function initForm(): void {
  let formLoadTime = Date.now();

  /**
   * DOM Elements (check if exist)
   */
  const contactForm = document.getElementById('contact-form') as HTMLFormElement | null;
  const submitButton = document.getElementById('submit-btn') as HTMLButtonElement | null;
  const statusDiv = document.getElementById('form-status') as HTMLDivElement | null;
  const successScreen = document.getElementById('form-success') as HTMLDivElement | null;

  // Exit early if form or required elements do not exist
  if (!contactForm || !submitButton || !statusDiv || !successScreen) {
    console.warn('Contact form script loaded, but no form found on this page.');
    return;
  }

  /**
   * Fields (safe binding)
   */
  const nameField = contactForm.querySelector('#name') as HTMLInputElement | null;
  const emailField = contactForm.querySelector('#email') as HTMLInputElement | null;
  const messageField = contactForm.querySelector('#message') as HTMLTextAreaElement | null;

  if (!nameField || !emailField || !messageField) {
    console.warn('Contact form fields not found — script will not initialize.');
    return;
  }

  const fields = { name: nameField, email: emailField, message: messageField };

  /**
   * Helpers
   */
  const hasSubmitted = () => localStorage.getItem(CONFIG.SUCCESS_KEY) === 'true';

  /**
   * Character Counter
   */
  let counterEl = contactForm.querySelector('.char-counter') as HTMLDivElement | null;
  if (!counterEl) {
    counterEl = document.createElement('div');
    counterEl.className = 'char-counter';
    fields.message.after(counterEl);
  }

  /**
   * Validators
   */
  const validators = {
    name: (v: string) =>
      v.length < 2
        ? 'Name is too short.'
        : !/^[\p{L}\s.'-]+$/u.test(v)
          ? 'Invalid characters in name.'
          : '',
    email: (v: string) =>
      !v ? 'Email is required.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Invalid email.' : '',
    message: (v: string) =>
      v.length < 10
        ? 'Message is too short.'
        : v.length > CONFIG.MAX_MESSAGE_LENGTH
          ? 'Message too long.'
          : '',
  };

  /**
   * UI Helpers
   */
  const setFieldError = (field: HTMLInputElement | HTMLTextAreaElement, message: string) => {
    const id = `${field.id}-error`;
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'input-error';
      field.after(el);
    }
    el.textContent = message;
    field.classList.add('input-invalid');
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', id);
  };

  const clearFieldError = (field: HTMLInputElement | HTMLTextAreaElement) => {
    const id = `${field.id}-error`;
    document.getElementById(id)?.remove();
    field.classList.remove('input-invalid');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  };

  /**
   * Validation
   */
  const isFieldValid = (name: keyof typeof fields) => !validators[name](fields[name].value.trim());

  const isFormValid = () =>
    Object.keys(fields).every((k) => isFieldValid(k as keyof typeof fields));

  const validateFieldUI = (name: keyof typeof fields) => {
    const field = fields[name];
    const error = validators[name](field.value.trim());
    if (error) {
      setFieldError(field, error);
      return false;
    }
    clearFieldError(field);
    return true;
  };

  const validateFormUI = () =>
    Object.keys(fields).every((k) => validateFieldUI(k as keyof typeof fields));

  /**
   * Debounce
   */
  const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
    let t: number;
    return (...args: Parameters<T>) => {
      clearTimeout(t);
      t = window.setTimeout(() => fn(...args), delay);
    };
  };

  /**
   * UI State
   */
  const showSuccessUI = () => {
    contactForm.style.display = 'none';
    successScreen.hidden = false;
    successScreen.classList.add('active');
    statusDiv.textContent = '';
    statusDiv.className = '';
  };

  const showFormUI = () => {
    contactForm.style.display = '';
    successScreen.hidden = true;
    successScreen.classList.remove('active');
  };

  /**
   * Submit state
   */
  const updateSubmitState = () => {
    if (hasSubmitted()) return;
    submitButton.disabled = !isFormValid();
  };

  /**
   * Status
   */
  const updateStatus = (msg: string, type: 'error' | 'success') => {
    statusDiv.textContent = msg;
    statusDiv.className = '';
    statusDiv.classList.add('active', type);
  };

  /**
   * Counter
   */
  const updateCounter = () => {
    const len = fields.message.value.length;
    counterEl!.textContent = `${len} / ${CONFIG.MAX_MESSAGE_LENGTH}`;
    counterEl!.classList.toggle('warning', len > CONFIG.MAX_MESSAGE_LENGTH * 0.9);
  };

  /**
   * Sanitization
   */
  const sanitize = (s: string) => {
    const t = document.createElement('div');
    t.textContent = s;
    return t.innerHTML;
  };

  /**
   * Lock
   */
  const getRemainingLockTime = () => {
    const last = localStorage.getItem(CONFIG.LOCK_KEY);
    if (!last) return 0;
    return Math.max(0, CONFIG.LOCK_DURATION_MS - (Date.now() - +last));
  };

  /**
   * Reset
   */
  const resetFormUI = () => {
    contactForm.reset();
    Object.values(fields).forEach(clearFieldError);
    updateCounter();
  };

  /**
   * Fake success (bot protection)
   */
  const fakeSuccess = () => {
    localStorage.setItem(CONFIG.SUCCESS_KEY, 'true');
    showSuccessUI();
  };

  /**
   * Submit
   */
  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const botField = formData.get('bot-field') as string;

    if (botField) {
      fakeSuccess();
      return;
    }

    const now = Date.now();
    const timeToFill = (now - formLoadTime) / 1000;

    if (timeToFill < CONFIG.MIN_FILL_TIME_SECONDS) {
      fakeSuccess();
      return;
    }

    if (!validateFormUI()) {
      updateStatus('Fix errors before submitting.', 'error');
      return;
    }

    if (getRemainingLockTime() > 0) {
      updateStatus('Please wait before sending again.', 'error');
      return;
    }

    const data: ContactFormData = {
      name: sanitize(fields.name.value.trim()),
      email: fields.email.value.trim(),
      message: sanitize(fields.message.value.trim()),
      'bot-field': '',
      submission_speed: timeToFill,
    };

    const originalText = submitButton.textContent || '';

    updateStatus('Sending...', 'success');
    submitButton.disabled = true;
    submitButton.classList.add('loading');

    try {
      const res = await fetch(
        'https://jeovlal67gzoep6nlct2nn6sym0hyxwy.lambda-url.eu-south-1.on.aws',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );

      if (!res.ok) throw new Error();

      localStorage.setItem(CONFIG.LOCK_KEY, Date.now().toString());
      localStorage.setItem(CONFIG.SUCCESS_KEY, 'true');

      resetFormUI();
      showSuccessUI();
      formLoadTime = Date.now();
    } catch {
      updateStatus('Failed to send. Try again.', 'error');
    } finally {
      if (!hasSubmitted()) {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.textContent = originalText;
        updateSubmitState();
      }
    }
  };

  /**
   * Events
   */
  const debouncedUpdate = debounce(updateSubmitState, CONFIG.DEBOUNCE_MS);

  Object.entries(fields).forEach(([key, field]) => {
    field.addEventListener('input', () => {
      debouncedUpdate();
      if (key === 'message') updateCounter();
    });

    field.addEventListener('blur', () => {
      validateFieldUI(key as keyof typeof fields);
    });
  });

  /**
   * Init
   */
  if (hasSubmitted()) {
    showSuccessUI();
  } else {
    showFormUI();
  }

  contactForm.removeEventListener('submit', handleSubmit);
  contactForm.addEventListener('submit', handleSubmit);

  updateSubmitState();
  updateCounter();
}
