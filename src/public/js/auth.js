/* ============================================
   Auth Client-Side JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initPasswordStrength();
});

/* ---------- Password Visibility Toggle ---------- */
function initPasswordToggles() {
  const toggleBtns = document.querySelectorAll('.auth-toggle-password');

  toggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const eyeOpen = btn.querySelector('.eye-open');
      const eyeClosed = btn.querySelector('.eye-closed');

      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPassword ? 'none' : 'block';
        eyeClosed.style.display = isPassword ? 'block' : 'none';
      }
    });
  });
}

/* ---------- Password Strength Indicator ---------- */
function initPasswordStrength() {
  // Look for password inputs that have a strength indicator
  const passwordInputs = document.querySelectorAll(
    '#signup-password, #reset-new-password'
  );

  passwordInputs.forEach((input) => {
    const container = input.closest('.auth-field');
    if (!container) return;

    const strengthEl = container.querySelector('.password-strength');
    const fillEl = container.querySelector('.password-strength__fill');
    const textEl = container.querySelector('.password-strength__text');

    if (!strengthEl || !fillEl || !textEl) return;

    input.addEventListener('input', () => {
      const value = input.value;

      if (!value) {
        strengthEl.classList.remove('visible');
        strengthEl.removeAttribute('data-level');
        return;
      }

      strengthEl.classList.add('visible');
      const result = evaluateStrength(value);
      strengthEl.setAttribute('data-level', result.level);
      textEl.textContent = result.label;
    });
  });
}

function evaluateStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 'weak', label: 'Débil' };
  if (score <= 2) return { level: 'fair', label: 'Regular' };
  if (score <= 3) return { level: 'good', label: 'Buena' };
  return { level: 'strong', label: 'Fuerte' };
}
