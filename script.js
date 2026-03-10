document.addEventListener('DOMContentLoaded', () => {
    const inputBtn = document.querySelector('#input');
    const translateBtn = document.querySelector('#translateBtn');
    const outputDiv = document.querySelector('#output');

    const email = 'organic.food2500@gmail.com';

    async function translateText() {
        const text = inputBtn.value.trim();

        if (text === "") {
            outputDiv.innerText = "Будь ласка, введіть текст!";
            return;
        }

        const safeText = encodeURIComponent(text);
        const url = `https://api.mymemory.translated.net/get?q=${safeText}&langpair=uk|en&de=${email}`;

        const response = await fetch(url);
        const data = await response.json();


        outputDiv.innerText = data.responseData.translatedText;

    }
    translateBtn.addEventListener('click', translateText);
});