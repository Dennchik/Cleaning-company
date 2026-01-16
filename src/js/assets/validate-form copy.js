export function validateForm() {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.form-order').forEach((form, index) => {
      const name = form.querySelector('.input.name');
      const email = form.querySelector('.input.email');
      const phone = form.querySelector('.input.phone');
      const checkbox = form.querySelector('.checkbox__input');
      const sendButton = form.querySelector('.send-button');
      const buttonContainer = sendButton?.closest('.button-container');

      // Обязательные структурные элементы
      if (!checkbox || !sendButton || !buttonContainer) return;

      /**
       * Анимация ошибки
       */
      function animateError(
        el,
        { maxSpread = 12, duration = 1000, pulses = 3 } = {}
      ) {
        const container = el.closest('.button-container') || el.parentElement;
        if (!container) return;

        let startTime = null;

        function frame(ts) {
          if (!startTime) startTime = ts;
          const elapsed = ts - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const wave = Math.abs(Math.sin(progress * pulses * Math.PI));
          const spread = maxSpread * wave;

          container.style.boxShadow = `0 0 ${spread}px ${
            spread / 2
          }px rgba(255,0,0,0.6)`;

          if (elapsed < duration) {
            requestAnimationFrame(frame);
          } else {
            container.style.boxShadow = '';
          }
        }

        requestAnimationFrame(frame);
      }

      /**
       * Универсальная валидация формы
       */
      function validateFormFields() {
        let isValid = checkbox.checked;

        if (name) {
          isValid &&= name.value.trim().length >= 3;
        }

        if (phone) {
          isValid &&= phone.value.trim().length === 18;
        }

        if (email) {
          isValid &&= email.value.trim().length >= 3;
        }

        // Визуальная блокировка
        buttonContainer.classList.toggle('is-disabled', !isValid);

        // Функциональная блокировка — ТОЛЬКО чекбокс
        sendButton.disabled = !checkbox.checked;

        return isValid;
      }

      /**
       * Показ ошибок
       */
      function showValidationErrors() {
        if (name && name.value.trim().length < 3) animateError(name);
        if (phone && phone.value.trim().length !== 18) animateError(phone);
        if (email && email.value.trim().length < 3) animateError(email);
        if (!checkbox.checked) animateError(checkbox);
      }

      /**
       * События
       */
      if (name) {
        name.addEventListener('input', validateFormFields);
      }

      if (phone) {
        phone.addEventListener('input', validateFormFields);
      }

      if (email) {
        email.addEventListener('input', validateFormFields);
      }

      checkbox.addEventListener('change', validateFormFields);

      // Инициализация состояния
      validateFormFields();

      /**
       * Клик по контейнеру кнопки
       */
      buttonContainer.addEventListener('click', (e) => {
        if (buttonContainer.classList.contains('is-disabled')) {
          e.preventDefault();
          console.warn(`⚠️ [Форма ${index + 1}] Невалидная попытка отправки`);
          showValidationErrors();
        }
      });

      /**
       * Отправка формы
       */
      sendButton.addEventListener('click', () => {
        if (
          sendButton.disabled ||
          buttonContainer.classList.contains('is-disabled')
        )
          return;

        let goalName = sendButton.getAttribute('goal-name') || '';

        const formData = new FormData();
        formData.append('action', 'send_telegram_message');
        formData.append('goalName', goalName);

        if (phone && phone.value) {
          formData.append('phone', phone.value.trim());
        }

        if (email && email.value) {
          formData.append('email', email.value.trim());
        }

        if (name && name.value) {
          formData.append('name', name.value.trim());
        }

        fetch(localizedVars.ajax_url, {
          method: 'POST',
          headers: {
            'X-WP-Nonce': localizedVars.ajax_nonce,
          },
          body: formData,
        })
          .then((response) => response.text())
          .then((responseText) => {
            alert('Ваш запрос отправлен.');
            console.log('Ответ сервера:', responseText);

            if (name) name.value = '';
            if (phone) phone.value = '';
            if (email) email.value = '';
            checkbox.checked = false;

            validateFormFields();
          })
          .catch((error) => {
            console.error('Ошибка при отправке:', error);
            alert('Произошла ошибка при отправке данных.');
          });
      });
    });
  });
}
