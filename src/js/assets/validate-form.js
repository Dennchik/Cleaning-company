/**
 * Валидация форм
 * @returns {Object} API для управления валидацией
 */
export function initFormValidation() {
  let isInitialized = false;

  // Используем IIFE для единоразовой инициализации
  (function () {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    document.querySelectorAll('.form-order').forEach((form, index) => {
      const formValidator = new FormValidator(form, index);
      formValidator.init();
    });
  }

  // Публичное API при необходимости
  return {
    revalidateAll: () => {
      document.querySelectorAll('.form-order').forEach((form) => {
        const validator = form._validator;
        if (validator) validator.validateFormFields();
      });
    },
  };
}

/**
 * Класс для валидации отдельной формы
 */
class FormValidator {
  constructor(form, index) {
    this.form = form;
    this.index = index;
    this.isSubmitting = false;

    // Кешируем элементы
    this.elements = {
      name: form.querySelector('.input.name'),
      email: form.querySelector('.input.email'),
      phone: form.querySelector('.input.phone'),
      checkbox: form.querySelector('.checkbox__input'),
      sendButton: form.querySelector('.send-button'),
      buttonContainer: null,
    };

    this.elements.buttonContainer =
      this.elements.sendButton?.closest('.button-container');

    // Дебаунсинг для inputs
    this.validateDebounced = this.debounce(
      this.validateFormFields.bind(this),
      300
    );

    // Сохраняем ссылку на форме для доступа извне
    form._validator = this;
  }

  init() {
    const { checkbox, sendButton, buttonContainer, name, email, phone } =
      this.elements;

    // Проверка обязательных элементов
    if (!checkbox || !sendButton || !buttonContainer) {
      console.warn(
        `Форма ${this.index + 1}: отсутствуют обязательные элементы`
      );
      return;
    }

    // Назначаем обработчики событий
    this.setupEventListeners();

    // Инициализируем состояние
    this.validateFormFields();
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventListeners() {
    const { name, email, phone, checkbox, sendButton, buttonContainer } =
      this.elements;

    // Обработчики для полей ввода
    [name, email, phone].forEach((field) => {
      if (field) {
        field.addEventListener('input', this.validateDebounced);
        field.addEventListener('blur', this.validateFormFields.bind(this));
      }
    });

    // Чекбокс
    checkbox.addEventListener('change', this.validateFormFields.bind(this));

    // Клик по контейнеру кнопки
    buttonContainer.addEventListener('click', (e) => {
      if (buttonContainer.classList.contains('is-disabled')) {
        e.preventDefault();
        this.showValidationErrors();
      }
    });

    // Отправка формы
    sendButton.addEventListener('click', this.handleSubmit.bind(this));

    // Обработка отправки через нажатие Enter
    this.form.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.elements.sendButton.disabled) {
        e.preventDefault();
        this.handleSubmit();
      }
    });
  }

  /**
   * Валидация всех полей формы
   */
  validateFormFields() {
    const { name, email, phone, checkbox, buttonContainer, sendButton } =
      this.elements;

    let isValid = checkbox.checked;

    // Валидация имени
    if (name) {
      const nameValid = name.value.trim().length >= 3;
      this.toggleFieldError(name, !nameValid);
      isValid &&= nameValid;
    }

    // Валидация телефона (маска +7 (XXX) XXX-XX-XX = 18 символов)
    if (phone) {
      const phoneValid = phone.value.trim().length === 18;
      this.toggleFieldError(phone, !phoneValid);
      isValid &&= phoneValid;
    }

    // Валидация email
    if (email) {
      const emailValue = email.value.trim();
      const emailValid =
        emailValue.length >= 3 && this.validateEmail(emailValue);
      this.toggleFieldError(email, !emailValid);
      isValid &&= emailValid;
    }

    // Визуальная индикация
    buttonContainer.classList.toggle('is-disabled', !isValid);
    sendButton.disabled = !checkbox.checked || this.isSubmitting;

    // Визуальная индикация чекбокса
    this.toggleFieldError(checkbox, !checkbox.checked);

    return isValid;
  }

  /**
   * Валидация email регулярным выражением
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Показать ошибки валидации
   */
  showValidationErrors() {
    const { name, email, phone, checkbox } = this.elements;

    if (name && name.value.trim().length < 3) this.animateError(name);
    if (phone && phone.value.trim().length !== 18) this.animateError(phone);
    if (email && !this.validateEmail(email.value.trim()))
      this.animateError(email);
    if (!checkbox.checked) this.animateError(checkbox);

    console.warn(`⚠️ [Форма ${this.index + 1}] Невалидная попытка отправки`);
  }

  /**
   * Анимация ошибки
   */
  animateError(el, options = {}) {
    const { maxSpread = 12, duration = 1000, pulses = 3 } = options;
    const container = el.closest('.button-container') || el.parentElement;
    if (!container) return;

    let startTime = null;

    const frame = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const wave = Math.abs(Math.sin(progress * pulses * Math.PI));
      const spread = maxSpread * wave;

      container.style.boxShadow = `0 0 ${spread}px ${
        spread / 2
      }px rgba(255, 0, 0, 0.6)`;

      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        container.style.boxShadow = '';
      }
    };

    requestAnimationFrame(frame);
  }

  /**
   * Обработка отправки формы
   */
  async handleSubmit() {
    const { sendButton, buttonContainer, name, email, phone, checkbox } =
      this.elements;

    // Проверка перед отправкой
    if (
      !this.validateFormFields() ||
      sendButton.disabled ||
      this.isSubmitting
    ) {
      this.showValidationErrors();
      return;
    }

    this.isSubmitting = true;
    sendButton.disabled = true;
    sendButton.textContent = 'Отправка...';

    try {
      const goalName = sendButton.getAttribute('goal-name') || '';
      const formData = new FormData();

      formData.append('action', 'send_telegram_message');
      formData.append('goalName', goalName);
      if (phone?.value) formData.append('phone', phone.value.trim());
      if (email?.value) formData.append('email', email.value.trim());
      if (name?.value) formData.append('name', name.value.trim());

      const response = await fetch(localizedVars.ajax_url, {
        method: 'POST',
        headers: { 'X-WP-Nonce': localizedVars.ajax_nonce },
        body: formData,
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const responseText = await response.text();

      // Успешная отправка
      this.showSuccess();
      this.resetForm();

      console.log('Ответ сервера:', responseText);
    } catch (error) {
      console.error('Ошибка при отправке:', error);
      this.showError('Произошла ошибка при отправке данных.');

      // Возвращаем кнопку в исходное состояние
      sendButton.disabled = false;
      sendButton.textContent = 'Отправить';
    } finally {
      this.isSubmitting = false;
      this.validateFormFields();
    }
  }

  /**
   * Сброс формы
   */
  resetForm() {
    const { name, email, phone, checkbox } = this.elements;

    if (name) name.value = '';
    if (phone) phone.value = '';
    if (email) email.value = '';
    checkbox.checked = false;

    // Сбрасываем классы ошибок
    [name, email, phone, checkbox].forEach((field) => {
      if (field) this.toggleFieldError(field, false);
    });
  }

  /**
   * Показать успешное сообщение
   */
  showSuccess() {
    // Можно заменить alert на красивый toast
    alert('Ваш запрос отправлен.');

    // Альтернатива: показать сообщение в форме
    // this.showMessage('Ваш запрос отправлен!', 'success');
  }

  /**
   * Показать сообщение об ошибке
   */
  showError(message) {
    alert(message);

    // Альтернатива: показать сообщение в форме
    // this.showMessage(message, 'error');
  }

  /**
   * Визуальная индикация ошибки поля
   */
  toggleFieldError(field, showError) {
    const container = field.closest('.input-container') || field.parentElement;
    if (!container) return;

    container.classList.toggle('has-error', showError);
  }

  /**
   * Дебаунсинг для оптимизации
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}
