export function counterProduct() {
  document
    .querySelectorAll('[data-quantity-container]')
    .forEach((container) => {
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('.quantity__button');
        console.log(btn);

        if (!btn) return;

        const quantityBlock = btn.closest('.quantity');
        const input = quantityBlock.querySelector('input');
        const removeBtn = quantityBlock.querySelector('.quantity-remove');

        let value = Number(input.value) || 0;

        if (btn.classList.contains('quantity-add')) {
          value++;
        } else {
          value--;
        }

        if (value <= 0) {
          value = 0;
          removeBtn.classList.add('_disabled');
        } else {
          removeBtn.classList.remove('_disabled');
        }

        input.value = value;
      });

      container.addEventListener('input', (e) => {
        const input = e.target.closest('.quantity input');
        if (!input) return;

        input.value = input.value.replace(/\D/g, '');

        const removeBtn = input
          .closest('.quantity')
          .querySelector('.quantity-remove');
        if (Number(input.value) <= 0) {
          removeBtn.classList.add('_disabled');
        } else {
          removeBtn.classList.remove('_disabled');
        }
      });
    });
}
