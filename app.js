async function searchCard() {
  const cardName = document.getElementById('cardName').value;
  const resultDiv = document.getElementById('cardResult');
  resultDiv.innerHTML = 'Searching...';

  try {
    const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${cardName}`);
    const card = await res.json();

    resultDiv.innerHTML = `
      <h2>${card.name}</h2>
      <img src="${card.image_uris?.normal || card.card_faces?.[0].image_uris.normal}" alt="${card.name}" />
      <p><strong>Set:</strong> ${card.set_name}</p>
      <p><strong>Commander Legal:</strong> ${card.legalities.commander}</p>
      <p><strong>Price (USD):</strong> $${card.prices.usd || 'Not available'}</p>
    `;
  } catch (error) {
    resultDiv.innerHTML = `<p>Error: Card not found or API issue.</p>`;
    console.error(error);
  }
}
