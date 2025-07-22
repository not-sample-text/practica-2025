// Rate limiting utilities

class RateLimiter {
	constructor() {
		this.userLimits = new Map(); // token -> { messageCount, lastReset, actionCount }
		this.MESSAGE_LIMIT = 30; // messages per minute
		this.ACTION_LIMIT = 60; // actions per minute
		this.RESET_INTERVAL = 60 * 1000; // 1 minute
	}

	checkMessageLimit(token) {
		const now = Date.now();
		const userLimit = this.userLimits.get(token) || {
			messageCount: 0,
			actionCount: 0,
			lastReset: now
		};

		// Reset counters if minute has passed
		if (now - userLimit.lastReset > this.RESET_INTERVAL) {
			userLimit.messageCount = 0;
			userLimit.actionCount = 0;
			userLimit.lastReset = now;
		}

		userLimit.messageCount++;
		this.userLimits.set(token, userLimit);

		return userLimit.messageCount <= this.MESSAGE_LIMIT;
	}

	checkActionLimit(token) {
		const now = Date.now();
		const userLimit = this.userLimits.get(token) || {
			messageCount: 0,
			actionCount: 0,
			lastReset: now
		};

		// Reset counters if minute has passed
		if (now - userLimit.lastReset > this.RESET_INTERVAL) {
			userLimit.messageCount = 0;
			userLimit.actionCount = 0;
			userLimit.lastReset = now;
		}

		userLimit.actionCount++;
		this.userLimits.set(token, userLimit);

		return userLimit.actionCount <= this.ACTION_LIMIT;
	}

	cleanup(token) {
		this.userLimits.delete(token);
	}

	// Clean up old entries periodically
	startCleanup() {
		setInterval(() => {
			const now = Date.now();
			for (const [token, limit] of this.userLimits.entries()) {
				if (now - limit.lastReset > this.RESET_INTERVAL * 2) {
					this.userLimits.delete(token);
				}
			}
		}, this.RESET_INTERVAL);
	}
}

module.exports = RateLimiter;
