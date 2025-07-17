async function searchCard() {
  const input = document.getElementById('cardName').value.trim(); 
  const hasQualifier = /[:><=]/.test(input);                      
  const searchQuery = hasQualifier ? input : `name:"${input}"`;   

  const resultDiv = document.getElementById('cardResult');

  resultDiv.innerHTML = 'Searching...';

  try {
    const query = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}`;
    console.log("searchCard:", query);
    const res = await fetch(query);
    const data = await res.json();

    if (!data.data || data.data.length === 0) {
      resultDiv.innerHTML = `<p>No cards found.</p>`;
      return;
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

//card.html script to display card details
async function loadCardDetails() {
  const params = new URLSearchParams(window.location.search);
  const cardId = params.get("id");

  if (!cardId) {
    document.getElementById('cardDetails').innerText = 'Card ID missing in URL.';
    return;
  }

  try {
    const query = `https://api.scryfall.com/cards/${cardId}`;
    console.log("loadCardDetails:", query);
    const res = await fetch(query);
    const card = await res.json();
    console.log(card);

    const image = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '';
    const formats = ['standard', 'modern', 'legacy', 'vintage', 'commander', 'pioneer', 'brawl', 'historic'];

    const legalityHTML = formats.map(format => {
      const status = card.legalities[format];
      const isLegal = status === 'legal';
      return `
        <span class="legality-box ${isLegal ? 'legal' : 'not-legal'}">
          ${format.charAt(0).toUpperCase() + format.slice(1)}
        </span>
      `;
    }).join("");

    document.getElementById('cardDetails').innerHTML = `
  <div class="card-details-flex">
    <div class="card-image-and-legality-box">
      <div class="card-image-box">
        <img src="${image}" alt="${card.name}" />
      </div>
      <div class="card-legality-box">${legalityHTML}</div>
    </div>
    <div class="card-info-box">
      <h1>${card.name}</h1>
      <p><strong>Set:</strong> ${card.set_name}</p>
      
      <p><strong>Price (USD):</strong> $${card.prices.usd || 'N/A'}</p>
      <p>${(card.oracle_text || 'N/A').replace(/\n/g, '<br>')}</p>
    
      <button onclick="history.back()">← Back to search</button>
    </div>
  </div>
`;
  } catch (error) {
    console.error(error);
    document.getElementById('cardDetails').innerText = 'Failed to load card details.';
  }
}

// Only call loadCardDetails if on card.html
if (document.getElementById('cardDetails')) {
  loadCardDetails();
}