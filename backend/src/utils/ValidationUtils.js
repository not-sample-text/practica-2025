// Input validation utilities

class ValidationUtils {
	static validateRoomName(roomName) {
		if (!roomName || typeof roomName !== "string") {
			return { valid: false, error: "Room name is required" };
		}

		const trimmed = roomName.trim();
		if (trimmed.length === 0) {
			return { valid: false, error: "Room name cannot be empty" };
		}

		if (trimmed.length > 50) {
			return { valid: false, error: "Room name too long (max 50 characters)" };
		}

		if (!/^[\w\s-]+$/.test(trimmed)) {
			return { valid: false, error: "Room name contains invalid characters" };
		}

		return { valid: true, value: trimmed.toLowerCase() };
	}

	static validateMessageContent(content) {
		if (!content || typeof content !== "string") {
			return { valid: false, error: "Message content is required" };
		}

		const trimmed = content.trim();
		if (trimmed.length === 0) {
			return { valid: false, error: "Message cannot be empty" };
		}

		if (trimmed.length > 1000) {
			return { valid: false, error: "Message too long (max 1000 characters)" };
		}

		return { valid: true, value: trimmed };
	}

	static validateUsername(username) {
		if (!username || typeof username !== "string") {
			return { valid: false, error: "Username is required" };
		}

		const trimmed = username.trim();
		if (trimmed.length === 0) {
			return { valid: false, error: "Username cannot be empty" };
		}

		if (!/^[\w]{3,20}$/.test(trimmed)) {
			return { valid: false, error: "Invalid username format" };
		}

		return { valid: true, value: trimmed };
	}

	static validateChatType(chatType) {
		const validTypes = ["global", "room", "private"];
		if (!validTypes.includes(chatType)) {
			return { valid: false, error: "Invalid chat type" };
		}
		return { valid: true, value: chatType };
	}
}

module.exports = ValidationUtils;
