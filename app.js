async function searchCard() 
//Get the input field and search button
{
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
// Attach event listener for search button (only on index.html)
if (document.getElementById('searchBtn')) {
  document.getElementById('searchBtn').addEventListener('click', searchCard);
  // Also allow Enter key in the input to trigger search
  const cardInput = document.getElementById('cardName');
  if (cardInput) {
    cardInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        searchCard();
      }
    });
  }
}

    const cardsToShow = data.data;
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
//card.html script to display card details
    async function loadCardDetails() {
      const params = new URLSearchParams(window.location.search);
      const cardId = params.get("id");

      if (!cardId) {
        document.getElementById('cardDetails').innerText = 'Card ID missing in URL.';
        return;
      }

      try {
        const res = await fetch(`https://api.scryfall.com/cards/${cardId}`);
        const card = await res.json();

        const image = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '';
        const formats = ['standard', 'modern', 'legacy', 'vintage', 'commander', 'pioneer', 'brawl', 'historic'];

        const legalityHTML = formats.map(format => {
        const status = card.legalities[format];
        const isLegal = status === 'legal';
       return `
    <span class="legality-box ${isLegal ? 'legal' : 'not-legal'}">
      ${isLegal ? 'LEGAL' : 'NOT LEGAL'} – ${format.charAt(0).toUpperCase() + format.slice(1)}
    </span>
  `;
}).join('<br>');

document.getElementById('cardDetails').innerHTML = `
  <div class="card-details-box">
    <h1>${card.name}</h1>
    <img src="${image}" alt="${card.name}" />
    <div class="card-info">
      <p><strong>Set:</strong> ${card.set_name}</p>
      
      <div class="legalities">${legalityHTML}</div>
      
      <p><strong>Price (USD):</strong> $${card.prices.usd || 'N/A'}</p>
      <p>${(card.oracle_text || 'N/A').replace(/\n/g, '<br>')}</p>
    </div>
    <a href="index.html">← Back to search</a>
  </div>
`;


      } catch (error) {
        console.error(error);
        document.getElementById('cardDetails').innerText = 'Failed to load card details.';
      }
    }

    loadCardDetails();

//
