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
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("API Response:", data);
    
    if (!data.data || data.data.length === 0) {
      resultDiv.innerHTML = `<p>No cards found.</p>`;
      return;
    }

    const cardsToShow = data.data;
    console.log(`Found ${cardsToShow.length} cards`);
    
    resultDiv.innerHTML = cardsToShow.map((card, idx) => {
      if (card.name == null || card.name === '') {
          console.warn(`Missing name for card: ${card}`);
          return `<div class="card error">Missing name for card "${card.id}"</div>`;
      }
      // TODO: Improve this code
      if (isDualFace(card)) {
        // Double-faced card: add flip button
        const image = card.card_faces[0]?.image_uris?.normal;
        if (!image) {
          console.warn(`Missing image for card: ${card.name} with layout "${card.layout}" and URL ${image}`);
          return `<div class="card error">Missing image for ${card.name}</div>`;
        }
        return `
          <div class="card">
            <a href="card.html?id=${card.id}">
              <img id="cardFaceImg-${idx}" src="${image}" alt="${card.card_faces[0].name}" onerror="this.parentElement.parentElement.innerHTML='<div class=error>Image failed to load</div>'"/>
            </a>
            <button class="flipBtn" data-idx="${idx}" type="button" aria-label="Flip card">${generateFlipIcon()}</button>
          </div>
        `;
      } else {
        const image = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;
        if (!image) {
          console.warn(`Missing image for card: ${card.name} with layout "${card.layout}" and URL ${image}`);
          return `<div class="card error">Missing image for ${card.name}</div>`;
        }
        return `
          <div class="card">
            <a href="card.html?id=${card.id}">
              <img src="${image}" alt="${card.name}" onerror="this.parentElement.parentElement.innerHTML='<div class=error>Image failed to load</div>'"/>
            </a>
          </div>
        `;
      }
    }).join('');

    // Initialize pagination after cards are rendered
    initializePagination();

    // Add flip functionality for all double-faced cards
    cardsToShow.forEach((card, idx) => {
      if (card.card_faces && card.card_faces.length === 2) {
        let showingFront = true;
        const btn = document.querySelector(`.flipBtn[data-idx="${idx}"]`);
        if (btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            const img = document.getElementById(`cardFaceImg-${idx}`);
            if (img && card.card_faces[Number(showingFront)]?.image_uris?.normal) {
              img.src = card.card_faces[Number(showingFront)].image_uris.normal;
              img.alt = card.card_faces[Number(showingFront)].name;
              showingFront = !showingFront;
            }
          });
        }
      }
    });
  } catch (error) {
    // Handle different types of errors
    if (error.message.includes('429')) {
      resultDiv.innerHTML = `<p>Too many requests. Please wait a moment and try again.</p>`;
    } else if (error.message.includes('timeout')) {
      resultDiv.innerHTML = `<p>Request timed out. Try searching for fewer cards.</p>`;
    } else if (error.message.includes('HTTP error')) {
      resultDiv.innerHTML = `<p>Server responded with ${error.message}.</p>`;
    } else {
      resultDiv.innerHTML = `<p>Could not retrieve cards. ${error.message}</p>`;
    }
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

  // Add pagination event listeners (only on index.html)
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.addEventListener('click', goToPreviousPage);
  if (nextBtn) nextBtn.addEventListener('click', goToNextPage);
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

    // TODO: Improve this code
    let imageHTML = '';
    if (isDualFace(card)) {
      const image = card.card_faces?.[0]?.image_uris?.normal;
      if (!image) {
        console.warn(`Missing image for card: ${card.name} with layout "${card.layout}" and URL ${image}`);
        return `<div class="card error">Missing image for ${card.name}</div>`;
      }
      imageHTML = `
        <div class="flip-card">
          <img id="detailCardFaceImg" src="${image}" alt="${card.card_faces[0].name}"/>
          <button id="detailFlipBtn" type="button" aria-label="Flip card">${generateFlipIcon()}</button>
        </div>
      `;
    } else {
      const image = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;
      if (!image) {
        console.warn(`Missing image for card: ${card.name} with layout "${card.layout}" and URL ${image}`);
        return `<div class="card error">Missing image for ${card.name}</div>`;
      }
      imageHTML = `<img src="${image}" alt="${card.name}"/>`;
    }

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

    let oracleHTML = '';
    if (card.card_faces && card.card_faces.length > 1) {
      oracleHTML = card.card_faces.map(face =>
        `<div class="oracle-face">
          <strong>${face.name}</strong><br>
          <em>${face.type_line || ''}</em>
          <div class="oracle-text">${(face.oracle_text || '').replace(/\n/g, '<br>')}</div>
        </div>`
      ).join('<hr style="opacity:0.2;">');
    } else {
      oracleHTML = `
        <strong>${card.name}</strong><br>
        <em>${card.type_line || ''}</em>
        <div class="oracle-text">${(card.oracle_text || 'N/A').replace(/\n/g, '<br>')}</div>
      `;
    }

    document.getElementById('cardDetails').innerHTML = `
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

    if (isDualFace(card)) {
      let showingFront = true;
      document.getElementById('detailFlipBtn').onclick = function() {
        const img = document.getElementById('detailCardFaceImg');
        img.src = card.card_faces[Number(showingFront)].image_uris.normal;
        img.alt = card.card_faces[Number(showingFront)].name;
        showingFront = !showingFront;
      };
    }
  } catch (error) {
    console.error(error);
    document.getElementById('cardDetails').innerText = 'Failed to load card details.';
  }
}

function isDualFace(card) {
  return card.card_faces?.length === 2 && !['adventure', 'split'].includes(card.layout);
}

function generateFlipIcon() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw-icon lucide-refresh-cw">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  `;
}

// Placeholder functions to prevent errors
function initializePagination() {

}

function goToPreviousPage() {

}

function goToNextPage() {

}

// Only call loadCardDetails if on card.html
if (document.getElementById('cardDetails')) {
  loadCardDetails();
}