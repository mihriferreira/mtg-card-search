async function searchCard() {
  
  const input = document.getElementById('cardName').value.trim(); 
  const hasQualifier = /[:><=]/.test(input);                      
  const searchQuery = hasQualifier ? input : `name:"${input}"`; 

  const resultDiv = document.getElementById('cardResult');

  resultDiv.innerHTML = 'Searching...';

  try {
    const query = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}`;
    const res = await fetch(query);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    if (!data.data || data.data.length === 0) {
      resultDiv.innerHTML = '<p>No cards found.</p>';
      return;
    }

    const cardsToShow = data.data;
    resultDiv.innerHTML = cardsToShow.map(renderCard).join('');

    initializePagination();
    setupSearchFlipButtons(cardsToShow);
  } catch (error) {
    displayErrorMessage(error, resultDiv);
  }
}

async function loadCardDetails() {
  const params = new URLSearchParams(window.location.search);
  const cardId = params.get("id");
  const cardDetailsDiv = document.getElementById('cardDetails');

  if (!cardId) {
    cardDetailsDiv.innerText = 'Card ID missing in URL.';
    return;
  }

  try {
    const query = `https://api.scryfall.com/cards/${cardId}`;
    const res = await fetch(query);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const card = await res.json();

    const image = getCardImage(card);
    if (!image) {
      cardDetailsDiv.innerHTML = `<div class="card error">Missing image for ${card.name}</div>`;
      return;
    }

    const imageHTML = renderDetailImage(card);
    const legalityHTML = renderLegality(card);
    const oracleHTML = renderOracleText(card);

    cardDetailsDiv.innerHTML = `
      <div class="card-details-flex">
        <div class="card-image-and-legality-box">
          <div class="card-image-box">${imageHTML}</div>
          <div class="card-legality-box">${legalityHTML}</div>
        </div>
        <div class="card-info-box">
          <h1>${card.name}</h1>
          <p><strong>Set:</strong> ${card.set_name}</p>
          <p>${oracleHTML}</p>
          <button onclick="history.back()">← Back to search</button>
        </div>
      </div>
    `;

    if (isDualFace(card)) setupDetailFlip(card);
  } catch (error) {
    displayErrorMessage(error, cardDetailsDiv);
  }
}

// --- Helper functions ---

function renderCard(card, idx) {
  const image = getCardImage(card);
  if (!card.name || !image) {
    return `<div class="card error">Missing data for ${card.name || card.id}</div>`;
  }
  const flipBtn = isDualFace(card)
    ? `<button class="flipBtn" data-idx="${idx}" type="button" aria-label="Flip card">${generateFlipIcon()}</button>`
    : '';
  return `
    <div class="card">
      <a href="card.html?id=${card.id}">
        <img id="cardFaceImg-${idx}" src="${image}" alt="${card.name}" onerror="this.parentElement.parentElement.innerHTML='<div class=error>Image failed to load</div>'"/>
      </a>
      ${flipBtn}
    </div>
  `;
}

function renderDetailImage(card) {
  const image = getCardImage(card);
  if (isDualFace(card)) {
    return `
      <div class="flip-card">
        <img id="detailCardFaceImg" src="${image}" alt="${card.card_faces[0].name}"/>
        <button id="detailFlipBtn" type="button" aria-label="Flip card">${generateFlipIcon()}</button>
      </div>
    `;
  } else {
    return `<img src="${image}" alt="${card.name}"/>`;
  }
}

function renderOracleText(card) {
  if (card.card_faces?.length > 1) {
    return card.card_faces.map(face => `
      <div class="oracle-face">
        <strong>${face.name}</strong><br>
        <em>${face.type_line || ''}</em>
        <div class="oracle-text">${(face.oracle_text || '').replace(/\n/g, '<br>')}</div>
      </div>
    `).join('<hr style="opacity:0.2;">');
  } else {
    return `
      <strong>${card.name}</strong><br>
      <em>${card.type_line || ''}</em>
      <div class="oracle-text">${(card.oracle_text || 'N/A').replace(/\n/g, '<br>')}</div>
    `;
  }
}

function renderLegality(card) {
  const formats = ['standard', 'modern', 'legacy', 'vintage', 'commander', 'pioneer', 'brawl', 'historic'];
  return formats.map(format => {
    const isLegal = card.legalities?.[format] === 'legal';
    return `<span class="legality-box ${isLegal ? 'legal' : 'not-legal'}">${capitalize(format)}</span>`;
  }).join('');
}

function setupSearchFlipButtons(cards) {
  cards.forEach((card, idx) => {
    if (!isDualFace(card)) return;
    let showingFront = true;
    const btn = document.querySelector(`.flipBtn[data-idx="${idx}"]`);
    const img = document.getElementById(`cardFaceImg-${idx}`);
    if (btn && img) {
      btn.addEventListener('click', () => {
        const face = card.card_faces[Number(!showingFront)];
        img.src = face.image_uris.normal;
        img.alt = face.name;
        showingFront = !showingFront;
      });
    }
  });
}

function setupDetailFlip(card) {
  let showingFront = true;
  const btn = document.getElementById('detailFlipBtn');
  const img = document.getElementById('detailCardFaceImg');
  btn.onclick = () => {
    const face = card.card_faces[Number(!showingFront)];
    img.src = face.image_uris.normal;
    img.alt = face.name;
    showingFront = !showingFront;
  };
}

function getCardImage(card, faceIndex = 0) {
  return isDualFace(card)
    ? card.card_faces?.[faceIndex]?.image_uris?.normal
    : card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;
}

function displayErrorMessage(error, container) {
  let message = '';
  if (error.message.includes('429')) {
    message = 'Too many requests. Please wait a moment and try again.';
  } else if (error.message.includes('timeout')) {
    message = 'Request timed out. Try searching for fewer cards.';
  } else if (error.message.includes('HTTP error')) {
    message = `Server responded with ${error.message}.`;
  } else {
    message = `Could not retrieve cards. ${error.message}`;
  }
  container.innerHTML = `<p>Error: ${message}</p>`;
  console.error(error);
}

function isDualFace(card) {
  return card.card_faces?.length === 2 && !['adventure', 'split'].includes(card.layout);
}

function generateFlipIcon() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
         stroke-linejoin="round" class="lucide lucide-refresh-cw-icon lucide-refresh-cw">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  `;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function initializePagination() {}
function goToPreviousPage() {}
function goToNextPage() {}

if (document.getElementById('searchBtn')) {
  document.getElementById('searchBtn').addEventListener('click', searchCard);
  const cardInput = document.getElementById('cardName');
  if (cardInput) {
    cardInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') searchCard();
    });
  }
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.addEventListener('click', goToPreviousPage);
  if (nextBtn) nextBtn.addEventListener('click', goToNextPage);
}

if (document.getElementById('cardDetails')) {
  loadCardDetails();
}