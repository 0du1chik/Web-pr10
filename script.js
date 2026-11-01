const cartIdInput = document.getElementById('cartId');
const loadBtn = document.getElementById('loadBtn');
const simErrorCheckbox = document.getElementById('simError');

const statusMessage = document.getElementById('statusMessage');
const errorMessage = document.getElementById('errorMessage');
const cartContent = document.getElementById('cartContent');

const cartTitle = document.getElementById('cartTitle');
const cartItems = document.getElementById('cartItems');
const totalSum = document.getElementById('totalSum');

// Допоміжна функція паузи (затримки)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Функція виконує один HTTP-запит
async function loadCart(id, attemptNumber, isSimulatedError) {
  // Симуляція помилки на клієнті для тестового режиму
  if (isSimulatedError && attemptNumber === 1) {
    throw new Error('Штучна помилка першої спроби (Тестовий режим)');
  }

  // Використовуємо параметр delay=3000 для затримки сервера в 3 секунди
  const response = await fetch(`https://dummyjson.com/carts/${id}?delay=3000`);

  // Обробка HTTP-помилок (status code != 2xx)
  if (!response.ok) {
    throw new Error(`Помилка HTTP! Статус: ${response.status} (${response.statusText})`);
  }

  const data = await response.json();
  return data;
}

// Функція з автоматичною повторною спробою
async function requestWithRetry(id) {
  const maxAttempts = 2;
  const isSimulatedError = simErrorCheckbox.checked;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      statusMessage.textContent = `Завантаження кошика... Будь ласка, зачекайте. (Спроба ${attempt} із ${maxAttempts})`;
      
      const data = await loadCart(id, attempt, isSimulatedError);
      return data; // Успіх — повертаємо дані
    } catch (error) {
      if (attempt < maxAttempts) {
        statusMessage.textContent = `Спроба ${attempt} невдала (${error.message}). Повторний запит через 1 секунду...`;
        await sleep(1000);
      } else {
        // Якщо це була остання спроба, прокидаємо помилку далі
        throw new Error(`Всі спроби завантаження виявилися невдалими. Останнє повідомлення: ${error.message}`);
      }
    }
  }
}

// Відображення даних у таблиці
function renderCart(data) {
  cartTitle.textContent = `Кошик №${data.id}`;
  cartItems.innerHTML = '';

  data.products.forEach((product) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${product.title}</td>
      <td>${product.price} $</td>
      <td>${product.quantity}</td>
      <td>${(product.price * product.quantity).toFixed(2)} $</td>
    `;
    cartItems.appendChild(tr);
  });

  totalSum.textContent = data.total;
  cartContent.classList.remove('hidden');
}

// Скинути стан UI
function clearUI() {
  statusMessage.textContent = '';
  errorMessage.textContent = '';
  errorMessage.classList.add('hidden');
  cartContent.classList.add('hidden');
}

// Головний обробник події кліку
loadBtn.addEventListener('click', async () => {
  const id = cartIdInput.value.trim();

  if (!id) {
    alert('Будь ласка, введіть ID кошика');
    return;
  }

  clearUI();
  
  // Блокуємо елементи управління під час запиту
  loadBtn.disabled = true;
  cartIdInput.disabled = true;

  try {
    const cartData = await requestWithRetry(id);
    renderCart(cartData);
    statusMessage.textContent = 'Дані успішно отримано!';
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.classList.remove('hidden');
    statusMessage.textContent = '';
  } finally {
    // Відновлюємо доступність кнопок
    loadBtn.disabled = false;
    cartIdInput.disabled = false;
  }
});