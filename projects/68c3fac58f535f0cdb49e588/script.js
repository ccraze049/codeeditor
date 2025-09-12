let count = 0;
const button = document.getElementById('clickBtn');
const counter = document.getElementById('counter');

button.addEventListener('click', () => {
    count++;
    counter.textContent = count;
    console.log(`Button clicked ${count} times`);
});

console.log('Vanilla JavaScript project loaded successfully!');