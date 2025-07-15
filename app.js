async function searchCard() {
  const cardName = document.getElementById('cardName').value.trim();
  const resultDiv = document.getElementById('cardResult');
  resultDiv.innerHTML = 'Searching...';

  try {
    const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}`);
    const data = await res.json();

    if (!data.data || data.data.length === 0) {
      resultDiv.innerHTML = `<p>No cards found.</p>`;
      return;
    }

    // Show up to 5 matches
    const cardsToShow = data.data.slice(0, 5);
  resultDiv.innerHTML = cardsToShow.map(card => {
  const image = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '';
  return `
    <div class="card">
      <a href="card.html?id=${card.id}">
        <img src="${image}" alt="${card.name}" />
      </a>
    </div>
  `;
}).join('');
  } catch (error) {
    resultDiv.innerHTML = `<p>Error: Could not retrieve cards.</p>`;
    console.error(error);
  }
}
