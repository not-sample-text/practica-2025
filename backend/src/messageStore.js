const fs = require("fs").promises;
const path = require("path");

class MessageStore {
	constructor() {
		this.messagesDir = path.join(__dirname, "..", "messages");
		this.ensureDirectoriesExist();
		this.startCleanupTimer();
	}

	async ensureDirectoriesExist() {
		try {
			await fs.mkdir(this.messagesDir, { recursive: true });
			await fs.mkdir(path.join(this.messagesDir, "global"), {
				recursive: true
			});
			await fs.mkdir(path.join(this.messagesDir, "rooms"), { recursive: true });
			await fs.mkdir(path.join(this.messagesDir, "private"), {
				recursive: true
			});
		} catch (error) {
			console.error("Error creating message directories:", error);
		}
	}

	async saveMessage(type, identifier, message) {
		try {
			const timestamp = new Date().toISOString();
			const messageWithTimestamp = {
				...message,
				timestamp,
				id: this.generateMessageId()
			};

			let filePath;
			switch (type) {
				case "global":
					filePath = path.join(this.messagesDir, "global", "messages.json");
					break;
				case "room":
					filePath = path.join(this.messagesDir, "rooms", `${identifier}.json`);
					break;
				case "private":
					// For private messages, create a consistent filename regardless of who sends first
					const participants = [identifier.user1, identifier.user2].sort();
					filePath = path.join(
						this.messagesDir,
						"private",
						`${participants[0]}_${participants[1]}.json`
					);
					break;
				default:
					throw new Error(`Unknown message type: ${type}`);
			}

			// Read existing messages
			let messages = [];
			try {
				const data = await fs.readFile(filePath, "utf8");
				messages = JSON.parse(data);
			} catch (error) {
				// File doesn't exist yet, start with empty array
				if (error.code !== "ENOENT") {
					throw error;
				}
			}

			// Add new message
			messages.push(messageWithTimestamp);

			// Write back to file
			await fs.writeFile(filePath, JSON.stringify(messages, null, 2));

			return messageWithTimestamp;
		} catch (error) {
			console.error("Error saving message:", error);
			throw error;
		}
	}

	async getMessages(type, identifier, limit = 100) {
		try {
			let filePath;
			switch (type) {
				case "global":
					filePath = path.join(this.messagesDir, "global", "messages.json");
					break;
				case "room":
					filePath = path.join(this.messagesDir, "rooms", `${identifier}.json`);
					break;
				case "private":
					const participants = [identifier.user1, identifier.user2].sort();
					filePath = path.join(
						this.messagesDir,
						"private",
						`${participants[0]}_${participants[1]}.json`
					);
					break;
				default:
					throw new Error(`Unknown message type: ${type}`);
			}

			try {
				const data = await fs.readFile(filePath, "utf8");
				const messages = JSON.parse(data);

				// Return most recent messages (limited by limit parameter)
				return messages.slice(-limit);
			} catch (error) {
				if (error.code === "ENOENT") {
					return []; // No messages yet
				}
				throw error;
			}
		} catch (error) {
			console.error("Error getting messages:", error);
			return [];
		}
	}

	async cleanupOldMessages() {
		try {
			const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			console.log(
				`Cleaning up messages older than ${oneWeekAgo.toISOString()}`
			);

			await this.cleanupMessagesInDirectory(
				path.join(this.messagesDir, "global"),
				oneWeekAgo
			);
			await this.cleanupMessagesInDirectory(
				path.join(this.messagesDir, "rooms"),
				oneWeekAgo
			);
			await this.cleanupMessagesInDirectory(
				path.join(this.messagesDir, "private"),
				oneWeekAgo
			);

			console.log("Message cleanup completed");
		} catch (error) {
			console.error("Error during message cleanup:", error);
		}
	}

	async cleanupMessagesInDirectory(dirPath, cutoffDate) {
		try {
			const files = await fs.readdir(dirPath);

			for (const file of files) {
				if (!file.endsWith(".json")) continue;

				const filePath = path.join(dirPath, file);
				try {
					const data = await fs.readFile(filePath, "utf8");
					const messages = JSON.parse(data);

					// Filter out old messages
					const recentMessages = messages.filter((msg) => {
						const messageDate = new Date(msg.timestamp);
						return messageDate > cutoffDate;
					});

					// If no messages remain, delete the file
					if (recentMessages.length === 0) {
						await fs.unlink(filePath);
						console.log(`Deleted empty message file: ${file}`);
					} else if (recentMessages.length < messages.length) {
						// Write back the filtered messages
						await fs.writeFile(
							filePath,
							JSON.stringify(recentMessages, null, 2)
						);
						console.log(
							`Cleaned ${
								messages.length - recentMessages.length
							} old messages from ${file}`
						);
					}
				} catch (error) {
					console.error(`Error processing file ${file}:`, error);
				}
			}
		} catch (error) {
			if (error.code !== "ENOENT") {
				console.error(`Error reading directory ${dirPath}:`, error);
			}
		}
	}

	startCleanupTimer() {
		// Run cleanup every hour
		setInterval(() => {
			this.cleanupOldMessages();
		}, 60 * 60 * 1000);

		// Run cleanup on startup
		setTimeout(() => {
			this.cleanupOldMessages();
		}, 5000);
	}

	generateMessageId() {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}

	async getExistingRooms() {
		try {
			const roomsDir = path.join(this.messagesDir, "rooms");
			const files = await fs.readdir(roomsDir);
			const rooms = files
				.filter((file) => file.endsWith(".json"))
				.map((file) => file.replace(".json", ""));
			return rooms;
		} catch (error) {
			if (error.code !== "ENOENT") {
				console.error("Error reading rooms directory:", error);
			}
			return [];
		}
	}
}

module.exports = MessageStore;
