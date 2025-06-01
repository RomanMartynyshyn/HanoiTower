// Глобальні змінні гри
let towers = []; // Масив для зберігання стану веж (масиви дисків)
let numDisks = 3; // Поточна кількість дисків
let moveCount = 0; // Лічильник ходів
let selectedDiskElement = null; // DOM-елемент обраного диска
let sourceTowerIndex = -1; // Індекс вежі, з якої взято диск

// Кольори для дисків (можна розширити)
const diskColors = [
    'disk-color-1', 'disk-color-2', 'disk-color-3', 'disk-color-4',
    'disk-color-5', 'disk-color-6', 'disk-color-7', 'disk-color-8'
];

// DOM-елементи
const towersContainer = document.getElementById('towers-container');
const numDisksInput = document.getElementById('num-disks');
const startResetButton = document.getElementById('start-reset-button');
const moveCountDisplay = document.getElementById('move-count');
const messageArea = document.getElementById('message-area');

// Ініціалізація гри при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    setupTowersDOM(); // Створюємо DOM для веж один раз
    startGame(); // Починаємо гру з налаштуваннями за замовчуванням
    startResetButton.addEventListener('click', startGame);
    numDisksInput.addEventListener('change', () => {
            // Переконуємося, що значення в межах допустимого
        let value = parseInt(numDisksInput.value);
        if (value < 3) numDisksInput.value = 3;
        if (value > 8) numDisksInput.value = 8;
    });
});

/**
 * Створює DOM-елементи для трьох веж.
 * Це робиться один раз, щоб не перестворювати їх при кожному старті гри.
 */
function setupTowersDOM() {
    towersContainer.innerHTML = ''; // Очищуємо контейнер веж
    for (let i = 0; i < 3; i++) {
        const towerElement = document.createElement('div');
        towerElement.classList.add('tower', 'relative'); // Додаємо relative для позиціонування основи
        towerElement.dataset.towerId = i; // Встановлюємо ID вежі

        const towerBase = document.createElement('div'); // Створюємо основу вежі
        towerBase.classList.add('tower-base');
        towerElement.appendChild(towerBase); // Додаємо основу до вежі

        towerElement.addEventListener('click', () => handleTowerClick(i));
        towersContainer.appendChild(towerElement);
    }
}

/**
 * Розпочинає або перезапускає гру.
 */
function startGame() {
    numDisks = parseInt(numDisksInput.value);
    moveCount = 0;
    selectedDiskElement = null;
    sourceTowerIndex = -1;

    towers = [[], [], []]; // Очищуємо логіку веж

    // Очищуємо диски з DOM-веж
    document.querySelectorAll('.tower').forEach(towerNode => {
        // Видаляємо всі дочірні елементи, крім основи
        Array.from(towerNode.childNodes).forEach(child => {
            if (!child.classList.contains('tower-base')) {
                towerNode.removeChild(child);
            }
        });
    });

    // Створюємо диски та додаємо їх на першу вежу (логічно та візуально)
    for (let i = 0; i < numDisks; i++) {
        const diskValue = numDisks - i; // Найбільший диск знизу (значення = розмір)
        towers[0].push(diskValue); // Додаємо в логічний масив першої вежі
        
        const diskElement = createDiskElement(diskValue, numDisks);
        // Додаємо диск до DOM першої вежі
        const firstTowerDOM = towersContainer.children[0]; 
        firstTowerDOM.appendChild(diskElement); // Додаємо диск на вежу
    }
    
    updateMoveCount();
    displayMessage('Гра почалася! Зробіть свій перший хід.', 'info');
    startResetButton.textContent = 'Перезапустити Гру';
}

/**
 * Створює DOM-елемент для диска.
 * @param {number} value - Значення (розмір) диска.
 * @param {number} totalDisks - Загальна кількість дисків (для розрахунку ширини).
 * @returns {HTMLElement} Створений елемент диска.
 */
function createDiskElement(value, totalDisks) {
    const diskElement = document.createElement('div');
    diskElement.classList.add('disk', diskColors[value - 1 % diskColors.length]);
    // Розрахунок ширини диска: базові 40% + відсоток від значення
    const minWidthPercent = 30; // Мінімальна ширина диска у відсотках
    const maxWidthPercent = 100; // Максимальна ширина диска у відсотках
    const widthRange = maxWidthPercent - minWidthPercent;
    // Чим більше значення (більший диск), тим більша ширина
    // Диск з value=1 буде найменшим, value=totalDisks - найбільшим
    const diskWidth = minWidthPercent + ( (value -1) / (totalDisks -1 + 0.001) ) * widthRange ; // +0.001 щоб уникнути ділення на 0 якщо 1 диск
    
    diskElement.style.width = `${Math.max(20, diskWidth)}%`; // Мінімальна ширина 20%
    diskElement.textContent = value; // Показуємо номер диска
    diskElement.dataset.value = value; // Зберігаємо значення диска
    return diskElement;
}

/**
 * Обробляє клік по вежі.
 * @param {number} targetTowerIndex - Індекс вежі, по якій клікнули.
 */
function handleTowerClick(targetTowerIndex) {
    const targetTowerDOM = towersContainer.children[targetTowerIndex];

    if (selectedDiskElement === null) { // Фаза 1: Вибір диска
        if (towers[targetTowerIndex].length > 0) {
            // Беремо верхній диск з логічної структури
            // DOM-елемент беремо як останній дочірній елемент вежі (не враховуючи основу)
            const diskNodes = Array.from(targetTowerDOM.childNodes).filter(node => node.classList.contains('disk'));
            if (diskNodes.length > 0) {
                selectedDiskElement = diskNodes[diskNodes.length - 1];
                selectedDiskElement.classList.add('disk-selected'); // Візуально виділяємо диск
                sourceTowerIndex = targetTowerIndex;
                displayMessage(`Диск ${selectedDiskElement.dataset.value} обрано. Оберіть цільову вежу.`, 'info');
            }
        } else {
            displayMessage('Ця вежа порожня. Оберіть вежу з дисками.', 'error');
        }
    } else { // Фаза 2: Розміщення диска
        const diskValueToMove = parseInt(selectedDiskElement.dataset.value);
        const topDiskOnTargetTower = towers[targetTowerIndex].length > 0 ? towers[targetTowerIndex][towers[targetTowerIndex].length - 1] : null;

        // Перевірка правил гри
        if (topDiskOnTargetTower === null || diskValueToMove < topDiskOnTargetTower) {
            // Валідний хід
            // 1. Оновлюємо логічну структуру
            towers[sourceTowerIndex].pop(); // Видаляємо диск з вихідної вежі (логічно)
            towers[targetTowerIndex].push(diskValueToMove); // Додаємо диск на цільову вежу (логічно)

            // 2. Оновлюємо DOM ("анімація" переміщення)
            targetTowerDOM.appendChild(selectedDiskElement); // Переміщуємо DOM-елемент диска
            selectedDiskElement.classList.remove('disk-selected'); // Знімаємо виділення

            // 3. Оновлюємо стан гри
            moveCount++;
            updateMoveCount();
            displayMessage(`Диск ${diskValueToMove} переміщено.`, 'info');
            
            // 4. Скидаємо вибір
            selectedDiskElement = null;
            sourceTowerIndex = -1;

            // 5. Перевірка на перемогу
            checkWinCondition();
        } else {
            // Невалідний хід
            displayMessage('Невалідний хід! Не можна класти більший диск на менший.', 'error');
            selectedDiskElement.classList.remove('disk-selected'); // Знімаємо виділення
            selectedDiskElement = null; // Скидаємо вибір
            sourceTowerIndex = -1;
        }
    }
}

/**
 * Оновлює лічильник ходів на сторінці.
 */
function updateMoveCount() {
    moveCountDisplay.textContent = moveCount;
}

/**
 * Відображає повідомлення для користувача.
 * @param {string} text - Текст повідомлення.
 * @param {'info' | 'success' | 'error'} type - Тип повідомлення.
 */
function displayMessage(text, type = 'info') {
    messageArea.textContent = text;
    messageArea.className = 'mt-2 font-medium'; // Скидаємо попередні класи кольорів
    if (type === 'success') {
        messageArea.classList.add('message-success');
    } else if (type === 'error') {
        messageArea.classList.add('message-error');
    } else {
        messageArea.classList.add('message-info');
    }
}

/**
 * Перевіряє умову перемоги.
 */
function checkWinCondition() {
    // Перемога, якщо всі диски на останній вежі (або на другій, якщо граємо не на першу)
    if (towers[2].length === numDisks ) {
            // Додатково перевіримо, чи перша та одна з інших порожні
        if ((towers[0].length === 0 && towers[1].length === 0 && towers[2].length === numDisks) ||
            (towers[0].length === 0 && towers[2].length === 0 && towers[1].length === numDisks)) {
            displayMessage(`Вітаємо! Ви пройшли гру за ${moveCount} ходів!`, 'success');
            confetti({
                particleCount: 900,
                spread: 700,
                origin: { y: 0.1 },
              });
            // Можна додати блокування подальших ходів тут
            selectedDiskElement = null; 
            // Блокуємо кліки по вежах після перемоги
            document.querySelectorAll('.tower').forEach(towerNode => {
                towerNode.removeEventListener('click', handleTowerClick); // Це не спрацює, бо функція інша
                // Краще мати змінну-флаг isGameOver
            });
                // Змінюємо текст кнопки, щоб запропонувати нову гру
            startResetButton.textContent = 'Грати Ще Раз';
        }
    }
}
