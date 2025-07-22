// Service for interacting with Deck of Cards API

const https = require("https");

class DeckService {
	constructor() {
		this.baseUrl = "deckofcardsapi.com";
		this.decks = new Map(); // deckId -> deck info
	}

	// Make HTTP request to deck API
	makeRequest(path) {
		return new Promise((resolve, reject) => {
			const options = {
				hostname: this.baseUrl,
				path: path,
				method: "GET",
				headers: {
					"Content-Type": "application/json"
				}
			};

			const req = https.request(options, (res) => {
				let data = "";

				res.on("data", (chunk) => {
					data += chunk;
				});

				res.on("end", () => {
					try {
						const parsed = JSON.parse(data);
						if (parsed.success) {
							resolve(parsed);
						} else {
							reject(
								new Error(`API Error: ${parsed.error || "Unknown error"}`)
							);
						}
					} catch (error) {
						reject(new Error(`Failed to parse API response: ${error.message}`));
					}
				});
			});

			req.on("error", (error) => {
				reject(new Error(`Request failed: ${error.message}`));
			});

			req.setTimeout(5000, () => {
				req.abort();
				reject(new Error("Request timeout"));
			});

			req.end();
		});
	}

	// Create a new shuffled deck
	async createDeck(deckCount = 6) {
		try {
			const path = `/api/deck/new/shuffle/?deck_count=${deckCount}`;
			const response = await this.makeRequest(path);

			const deckInfo = {
				deckId: response.deck_id,
				remaining: response.remaining,
				deckCount: deckCount,
				shuffled: true,
				created: new Date().toISOString()
			};

			this.decks.set(response.deck_id, deckInfo);
			console.log(
				`Created new deck ${response.deck_id} with ${deckCount} deck(s), ${response.remaining} cards`
			);

			return deckInfo;
		} catch (error) {
			console.error("Failed to create deck:", error);
			throw error;
		}
	}

	// Draw cards from deck
	async drawCards(deckId, count = 1) {
		try {
			const path = `/api/deck/${deckId}/draw/?count=${count}`;
			const response = await this.makeRequest(path);

			// Update deck info
			if (this.decks.has(deckId)) {
				const deckInfo = this.decks.get(deckId);
				deckInfo.remaining = response.remaining;
			}

			console.log(
				`Drew ${count} card(s) from deck ${deckId}, ${response.remaining} remaining`
			);

			return {
				cards: response.cards,
				remaining: response.remaining
			};
		} catch (error) {
			console.error(`Failed to draw cards from deck ${deckId}:`, error);
			throw error;
		}
	}

	// Shuffle existing deck
	async shuffleDeck(deckId) {
		try {
			const path = `/api/deck/${deckId}/shuffle/`;
			const response = await this.makeRequest(path);

			// Update deck info
			if (this.decks.has(deckId)) {
				const deckInfo = this.decks.get(deckId);
				deckInfo.remaining = response.remaining;
				deckInfo.shuffled = true;
			}

			console.log(
				`Shuffled deck ${deckId}, ${response.remaining} cards remaining`
			);

			return {
				deckId: response.deck_id,
				remaining: response.remaining,
				shuffled: true
			};
		} catch (error) {
			console.error(`Failed to shuffle deck ${deckId}:`, error);
			throw error;
		}
	}

	// Get deck information
	getDeckInfo(deckId) {
		return this.decks.get(deckId);
	}

	// Check if deck needs reshuffling (20-30% remaining)
	needsReshuffle(deckId) {
		const deckInfo = this.decks.get(deckId);
		if (!deckInfo) return true;

		const totalCards = deckInfo.deckCount * 52;
		const remainingPercent = (deckInfo.remaining / totalCards) * 100;

		// Random threshold between 20-30%
		const threshold = 20 + Math.random() * 10;

		return remainingPercent <= threshold;
	}

	// Calculate card values for blackjack
	calculateCardValue(card) {
		if (["JACK", "QUEEN", "KING"].includes(card.value)) {
			return 10;
		} else if (card.value === "ACE") {
			return 11; // Ace high initially, will be adjusted if needed
		} else {
			return parseInt(card.value);
		}
	}

	// Calculate hand total for blackjack
	calculateHandTotal(cards) {
		let total = 0;
		let aces = 0;

		// First pass: count non-aces and count aces
		for (const card of cards) {
			if (card.value === "ACE") {
				aces++;
				total += 11;
			} else {
				total += this.calculateCardValue(card);
			}
		}

		// Adjust for aces if total > 21
		while (total > 21 && aces > 0) {
			total -= 10; // Convert ace from 11 to 1
			aces--;
		}

		return total;
	}

	// Check if hand is blackjack (21 with exactly 2 cards)
	isBlackjack(cards) {
		return cards.length === 2 && this.calculateHandTotal(cards) === 21;
	}

	// Check if hand is busted
	isBusted(cards) {
		return this.calculateHandTotal(cards) > 21;
	}

	// Format card for display (hide dealer hole card)
	formatCard(card, hidden = false) {
		if (hidden) {
			return {
				code: "HIDDEN",
				image: null,
				value: "HIDDEN",
				suit: "HIDDEN"
			};
		}

		return {
			code: card.code,
			image: card.image,
			value: card.value,
			suit: card.suit
		};
	}

	// Clean up deck info
	removeDeck(deckId) {
		this.decks.delete(deckId);
		console.log(`Removed deck ${deckId} from memory`);
	}

	// Get all active decks
	getActiveDecks() {
		return Array.from(this.decks.keys());
	}

	// Cleanup old decks (older than 1 hour)
	cleanupOldDecks() {
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

		for (const [deckId, deckInfo] of this.decks.entries()) {
			if (new Date(deckInfo.created) < oneHourAgo) {
				this.removeDeck(deckId);
			}
		}
	}
}

// Create singleton instance
const deckService = new DeckService();

// Start cleanup timer
setInterval(() => {
	deckService.cleanupOldDecks();
}, 30 * 60 * 1000); // Every 30 minutes

module.exports = deckService;
