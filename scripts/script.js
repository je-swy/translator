import { translations } from './languages.js';

const input = document.getElementById('input');
const output = document.getElementById('output');
const translateBtn = document.getElementById('translateBtn');
const copyBtn = document.getElementById('copyBtn');
const langFrom = document.getElementById('langFrom');
const langTo = document.getElementById('langTo');
const swapBtn = document.getElementById('swapBtn');

const historySidebar = document.getElementById('historySidebar');
const historyToggle = document.getElementById('historyToggle');
const closeHistory = document.getElementById('closeHistory');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');
const themeToggle = document.getElementById('themeToggle');

let historyData = JSON.parse(localStorage.getItem('translate_history')) || [];

// theme and language setup

const userLang = navigator.language.split('-')[0];
const currentInterfaceLang = translations[userLang] ? userLang : 'en';

const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

const themeIcon = themeToggle.querySelector('i');
themeIcon.className = currentTheme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';

themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeIcon.className = newTheme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
});

function applyInterfaceLanguage() {
    const texts = translations[currentInterfaceLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) el.innerText = texts[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (texts[key]) el.placeholder = texts[key];
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (texts[key]) el.title = texts[key];
    });
    return texts;
}

const uiTexts = applyInterfaceLanguage();

// history setup

const savedText = localStorage.getItem('last_input');
const savedTranslation = localStorage.getItem('last_output');

if (savedText) {
    input.value = savedText;
    output.innerText = savedTranslation || uiTexts.resultPlaceholder;
}

function updateHistoryUI() {
    historyList.innerHTML = '';
    if (historyData.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'empty-msg';
        emptyLi.innerText = translations[currentInterfaceLang]?.emptyMsg || "Історія порожня";
        historyList.appendChild(emptyLi);
        return;
    }

    historyData.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'history-item-wrapper';
        const article = document.createElement('article');
        article.className = 'history-item';
        article.innerHTML = `
            <button class="delete-item" onclick="deleteHistoryItem(${index})" title="Видалити">
                <i class="ph ph-x"></i>
            </button>
            <small>${item.from} → ${item.to}</small>
            <div class="history-text"><strong>${item.input}</strong></div>
            <p class="history-result">${item.output}</p>
            <button class="copy-history-btn" onclick="copyHistoryItem(event, ${index})" title="Копіювати">
                <i class="ph ph-copy"></i>
            </button>
        `;
        li.appendChild(article);
        historyList.appendChild(li);
    });
}

updateHistoryUI();

// translation logic validation

function isValid(text) {
    const hasLetters = /[a-zA-Zа-яА-ЯіїєґІЇЄҐ]/.test(text);
    return text.length > 0 && hasLetters;
}

// copy logic for both main output and history items

function handleCopy(text, btn) {
    if (!text || text === uiTexts.resultPlaceholder) return;
    const icon = btn.querySelector('i');
    navigator.clipboard.writeText(text).then(() => {
        const originalClass = icon.className;
        icon.className = 'ph ph-check';
        icon.style.color = '#4ade80';
        btn.style.pointerEvents = 'none';
        setTimeout(() => {
            icon.className = originalClass;
            icon.style.color = '';
            btn.style.pointerEvents = 'auto';
        }, 2000);
    });
}

// main translation function with API call and UI updates (includes error handling and history management)
async function performTranslation() {
    const text = input.value.trim();
    if (!text) {
        output.innerText = uiTexts.resultPlaceholder;
        return;
    }
    if (!isValid(text)) {
        output.innerText = uiTexts.error || "Некоректний текст";
        return;
    }

    translateBtn.disabled = true;
    output.innerText = uiTexts.wait || "Зачекайте...";
    output.classList.remove('fade-in');

    // API call to MyMemory translation service
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langFrom.value}|${langTo.value}`);
        const data = await res.json();
        if (data.responseData) {
            const translatedText = data.responseData.translatedText;
            output.innerText = translatedText;
            void output.offsetWidth;
            output.classList.add('fade-in');
            localStorage.setItem('last_input', text);
            localStorage.setItem('last_output', translatedText);
            addToHistory(text, translatedText, langFrom.value, langTo.value);
        }
    } catch (err) {
        output.innerText = uiTexts.error || "Помилка мережі";
    } finally {
        translateBtn.disabled = false;
    }
}

// event listeners for translation, swapping languages, and history interactions

translateBtn.addEventListener('click', performTranslation);

// allow pressing Enter to translate, but only if Shift is not held (to allow multi-line input)
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        performTranslation();
    }
});

// language swap logic with animation and immediate translation if there's input
swapBtn.addEventListener('click', () => {
    const icon = swapBtn.querySelector('i');
    icon.style.transition = 'transform 0.4s ease';
    icon.style.transform = icon.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
    const temp = langFrom.value;
    langFrom.value = langTo.value;
    langTo.value = temp;
    if (input.value.trim()) performTranslation();
});

// main copy button logic (now uses handleCopy for consistency with history items)

copyBtn.addEventListener('click', () => {
    handleCopy(output.innerText, copyBtn);
});

// copy logic for history items

window.copyHistoryItem = function (event, index) {
    handleCopy(historyData[index].output, event.currentTarget);
};

// history management functions

function addToHistory(inputVal, outputVal, from, to) {
    if (historyData.length > 0 && historyData[0].input === inputVal) return;
    historyData.unshift({
        input: inputVal,
        output: outputVal,
        from: from.toUpperCase(),
        to: to.toUpperCase()
    });
    historyData = historyData.slice(0, 15);
    localStorage.setItem('translate_history', JSON.stringify(historyData));
    updateHistoryUI();
}

// function to delete individual history items, called from the delete button in each item
window.deleteHistoryItem = function (index) {
    historyData.splice(index, 1);
    localStorage.setItem('translate_history', JSON.stringify(historyData));
    updateHistoryUI();
};

// sidebar toggle logic
historyToggle.addEventListener('click', () => historySidebar.classList.add('active'));
closeHistory.addEventListener('click', () => historySidebar.classList.remove('active'));

// clear entire history logic with confirmation
clearHistoryBtn.addEventListener('click', () => {
    if (confirm(uiTexts.confirmClear || "Очистити всю історію?")) {
        historyData = [];
        localStorage.removeItem('translate_history');
        updateHistoryUI();
    }
});