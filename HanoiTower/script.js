// Глобальні змінні гри
let towers = [];
let numDisks = 3;
let moveCount = 0;
let selectedDiskElement = null;
let sourceTowerIndex = -1;
let isGameOver = false; // Додамо флаг для блокування ходів після перемоги

// Кольори для дисків
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

// Ініціалізація гри
document.addEventListener('DOMContentLoaded', () => {
    setupTowersDOM();
    startGame();
    startResetButton.addEventListener('click', startGame);
    numDisksInput.addEventListener('change', () => {
        let value = parseInt(numDisksInput.value);
        if (value < 3) numDisksInput.value = 3;
        if (value > 8) numDisksInput.value = 8;
    });
});

/**
 * Створює DOM-елементи для трьох веж.
 */
function setupTowersDOM() {
    towersContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const towerElement = document.createElement('div');
        towerElement.classList.add('tower', 'relative');
        towerElement.dataset.towerId = i;

        const towerBase = document.createElement('div');
        towerBase.classList.add('tower-base');
        towerElement.appendChild(towerBase);

        towerElement.addEventListener('click', () => handleTowerClick(i));

        towerElement.addEventListener('dragover', (e) => e.preventDefault());
        towerElement.addEventListener('drop', (e) => {
            e.preventDefault();
            const diskValueToMove = parseInt(e.dataTransfer.getData('text/plain'));
            handleDrop(i, diskValueToMove);
        });

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
    isGameOver = false;

    towers = [[], [], []];

    document.querySelectorAll('.tower').forEach(towerNode => {
        Array.from(towerNode.childNodes).forEach(child => {
            if (!child.classList.contains('tower-base')) {
                towerNode.removeChild(child);
            }
        });
    });

    for (let i = 0; i < numDisks; i++) {
        const diskValue = numDisks - i;
        towers[0].push(diskValue);
        
        const diskElement = createDiskElement(diskValue, numDisks);
        const firstTowerDOM = towersContainer.children[0];
        firstTowerDOM.appendChild(diskElement);
    }
    
    updateDraggableDisks(); // Оновлюємо, які диски можна перетягувати
    updateMoveCount();
    displayMessage('Гра почалася! Зробіть свій перший хід.', 'info');
    startResetButton.textContent = 'Перезапустити Гру';
}

/**
 * Створює DOM-елемент для диска.
 */
function createDiskElement(value, totalDisks) {
    const diskElement = document.createElement('div');
    diskElement.classList.add('disk', diskColors[(value - 1) % diskColors.length]);
    // Атрибут draggable буде керуватися динамічно, тому тут його не ставимо

    const minWidthPercent = 30;
    const maxWidthPercent = 100;
    const widthRange = maxWidthPercent - minWidthPercent;
    const diskWidth = minWidthPercent + ((value - 1) / (totalDisks - 1 + 0.001)) * widthRange;

    diskElement.style.width = `${Math.max(20, diskWidth)}%`;
    diskElement.textContent = value;
    diskElement.dataset.value = value;

    diskElement.addEventListener('dragstart', (e) => {
        // Перевіряємо, чи цей диск дійсно можна тягнути
        if (diskElement.draggable) {
            e.dataTransfer.setData('text/plain', value);
            sourceTowerIndex = parseInt(diskElement.parentElement.dataset.towerId);
        } else {
            e.preventDefault(); // Забороняємо перетягування, якщо диск не верхній
        }
    });

    return diskElement;
}

/**
 * Оновлює 'draggable' атрибути для всіх дисків.
 * Лише верхній диск на кожній вежі може бути перетягнутий.
 */
function updateDraggableDisks() {
    document.querySelectorAll('.tower').forEach(towerNode => {
        const disksInTower = Array.from(towerNode.children).filter(el => el.classList.contains('disk'));
        
        // Спочатку робимо всі диски неперетягуваними
        disksInTower.forEach(disk => disk.draggable = false);

        // Потім робимо тільки верхній (останній) диск перетягуваним
        if (disksInTower.length > 0) {
            disksInTower[disksInTower.length - 1].draggable = true;
        }
    });
}

/**
 * Обробляє клік по вежі.
 */
function handleTowerClick(targetTowerIndex) {
    if (isGameOver) return; // Блокуємо ходи після перемоги

    const targetTowerDOM = towersContainer.children[targetTowerIndex];

    if (selectedDiskElement === null) { // Фаза 1: Вибір диска
        if (towers[targetTowerIndex].length > 0) {
            const diskNodes = Array.from(targetTowerDOM.childNodes).filter(node => node.classList.contains('disk'));
            if (diskNodes.length > 0) {
                selectedDiskElement = diskNodes[diskNodes.length - 1];
                selectedDiskElement.classList.add('disk-selected');
                sourceTowerIndex = targetTowerIndex;
                displayMessage(`Диск ${selectedDiskElement.dataset.value} обрано. Оберіть цільову вежу.`, 'info');
            }
        } else {
            displayMessage('Ця вежа порожня. Оберіть вежу з дисками.', 'error');
        }
    } else { // Фаза 2: Розміщення диска
        const diskValueToMove = parseInt(selectedDiskElement.dataset.value);
        const topDiskOnTargetTower = towers[targetTowerIndex].length > 0 ? towers[targetTowerIndex][towers[targetTowerIndex].length - 1] : null;

        if (topDiskOnTargetTower === null || diskValueToMove < topDiskOnTargetTower) { // Валідний хід
            towers[sourceTowerIndex].pop();
            towers[targetTowerIndex].push(diskValueToMove);

            targetTowerDOM.appendChild(selectedDiskElement);
            selectedDiskElement.classList.remove('disk-selected');

            moveCount++;
            updateMoveCount();
            displayMessage(`Диск ${diskValueToMove} переміщено.`, 'info');
            
            selectedDiskElement = null;
            sourceTowerIndex = -1;

            updateDraggableDisks(); // Оновлюємо draggable статус
            checkWinCondition();
        } else { // Невалідний хід
            displayMessage('Невалідний хід! Не можна класти більший диск на менший.', 'error');
            selectedDiskElement.classList.remove('disk-selected');
            selectedDiskElement = null;
            sourceTowerIndex = -1;
        }
    }
}

/**
 * Обробляє переміщення диска методом drag-and-drop.
 */
function handleDrop(targetTowerIndex, diskValueToMove) {
    if (isGameOver) return;

    const targetTowerDOM = towersContainer.children[targetTowerIndex];
    const topDiskOnTargetTower = towers[targetTowerIndex].slice(-1)[0];

    // Перевірка правил гри
    if (topDiskOnTargetTower == null || diskValueToMove < topDiskOnTargetTower) {
        const sourceTowerDOM = towersContainer.children[sourceTowerIndex];
        const diskElement = Array.from(sourceTowerDOM.children).find(
            el => el.dataset?.value == diskValueToMove
        );

        if (diskElement) {
            towers[sourceTowerIndex].pop();
            towers[targetTowerIndex].push(diskValueToMove);
            targetTowerDOM.appendChild(diskElement);

            moveCount++;
            updateMoveCount();
            displayMessage(`Диск ${diskValueToMove} переміщено.`, 'info');

            updateDraggableDisks(); // Оновлюємо draggable статус
            checkWinCondition();
        }
    } else {
        displayMessage('Невалідний хід! Не можна класти більший диск на менший.', 'error');
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
 */
function displayMessage(text, type = 'info') {
    messageArea.textContent = text;
    messageArea.className = 'mt-2 font-medium';
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
    if (towers[1].length === numDisks || towers[2].length === numDisks) {
        displayMessage(`Вітаємо! Ви пройшли гру за ${moveCount} ходів!`, 'success');
        isGameOver = true; // Блокуємо подальші ходи
        
        // Запускаємо конфіті, якщо бібліотека підключена
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.0 },
            });
        }
        
        startResetButton.textContent = 'Грати Ще Раз';
    }
}
