function setupCharCounter(fieldId, countId, maxChars) {
    const field = document.getElementById(fieldId);
    const countDisplay = document.getElementById(countId);

    field.addEventListener('input', () => {
        const charCount = field.value.length;
        countDisplay.textContent = `${charCount} / ${maxChars} caracteres`;
        if (charCount > maxChars) {
            field.value = field.value.substring(0, maxChars);
            countDisplay.textContent = `${maxChars} / ${maxChars} caracteres`;
            alert(`Has alcanzado el límite de ${maxChars} caracteres.`);
        }
    });
}
