# This application allows users to import their Magic: The Gathering decks 
#directly from Archidekt and automatically calculate mana statistics such as color distribution, 
#average mana cost, and mana curve. It helps players analyze and balance their decks more efficiently.

import re
import requests

ARCHIDEKT_DECK_URL_RE = re.compile(r'https://archidekt.com/api/decks/(\d+)/')

def get_deck_data(deck_id):
    response = requests.get(ARCHIDEKT_DECK_URL_RE.format(deck_id=deck_id))
    if response.status_code == 200:
        return response.json()
    else:
        return None

# Next steps would include parsing the deck data, calculating mana statistics,
# and providing functions to analyze and balance the deck.