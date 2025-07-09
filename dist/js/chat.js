// WebSocket chat functionality for welcome page

class ChatHandler {
	constructor() {
		this.ws = null;
		this.messagesList = null;
		this.init();
	}

	init() {
		document.addEventListener("DOMContentLoaded", () => {
			this.initializeWebSocket();
		});
	}

	initializeWebSocket() {
		this.messagesList = document.getElementById("messages");
		this.ws = new WebSocket(`ws://${window.location.host}/ws`);

		this.ws.onmessage = (event) => this.handleMessage(event);
		this.ws.onopen = () => this.handleOpen();
		this.ws.onerror = (error) => this.handleError(error);
		this.ws.onclose = () => this.handleClose();

		// Make sendMessage available globally
		window.sendMessage = (event) => this.sendMessage(event);
	}

	handleMessage(event) {
		const [token, message] = event.data.split("–");
		this.addMessage(token, message);
	}

	handleOpen() {
		// Connection established - could add visual indicator
	}

	handleError(error) {
		// Handle connection errors gracefully
	}

	handleClose() {
		// Handle connection close - could show reconnection message
	}

	decodeJWTPayload(token) {
		try {
			const parts = token.split(".");
			if (parts.length !== 3) return null;

			const base64Url = parts[1];
			const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
			const jsonPayload = decodeURIComponent(
				atob(base64)
					.split("")
					.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
					.join("")
			);
			return JSON.parse(jsonPayload);
		} catch (e) {
			return null;
		}
	}

	getCurrentTime() {
		return new Date().toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit"
		});
	}

	isCurrentUser(token) {
		return document.cookie.includes("token=" + token);
	}

	getMessageBubbleClass(isCurrentUser, isServer) {
		const baseClasses =
			"rounded-lg px-3 py-2 inline-block max-w-[80%] relative";

		if (isCurrentUser) {
			return `bg-stone-300 dark:bg-stone-600 text-stone-900 dark:text-stone-100 ${baseClasses} rounded-br-none ml-auto border border-stone-400 dark:border-stone-500`;
		} else if (isServer) {
			return `bg-indigo-200 dark:bg-indigo-700 text-stone-900 dark:text-stone-100 ${baseClasses} mx-auto`;
		} else {
			return `bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 ${baseClasses} rounded-bl-none mr-auto border border-stone-200 dark:border-stone-600`;
		}
	}

	createMessageElement(username, message, time, isCurrentUser, isServer) {
		const messageElement = document.createElement("li");
		const bubbleClass = this.getMessageBubbleClass(isCurrentUser, isServer);

		let alignment = "flex justify-start";
		if (isCurrentUser) alignment = "flex justify-end";
		else if (isServer) alignment = "flex justify-center";

		messageElement.className = alignment;

		const usernameDisplay =
			!isCurrentUser && !isServer
				? `<span class='font-semibold text-xs'>${username}</span><br/>`
				: "";

		messageElement.innerHTML = `
            <div class="${bubbleClass}">
                ${usernameDisplay}
                <span>${this.escapeHtml(message)}</span>
                <span class="block text-xs text-stone-400 text-right mt-1">${time}</span>
            </div>
        `;

		return messageElement;
	}

	escapeHtml(text) {
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	}

	addMessage(token, message) {
		if (!this.messagesList) return;

		const time = this.getCurrentTime();
		let username,
			isServer = false,
			isCurrent = false;

		if (token === "server") {
			username = "server";
			isServer = true;
		} else {
			const payload = this.decodeJWTPayload(token);
			username = payload ? payload.username : "Unknown";
			isCurrent = this.isCurrentUser(token);
		}

		const messageElement = this.createMessageElement(
			username,
			message,
			time,
			isCurrent,
			isServer
		);
		this.messagesList.appendChild(messageElement);
		this.messagesList.scrollTop = this.messagesList.scrollHeight;
	}

	sendMessage(event) {
		if (event.key === "Enter" && event.target.value.trim()) {
			if (this.ws && this.ws.readyState === WebSocket.OPEN) {
				this.ws.send(event.target.value);
				event.target.value = "";
			}
		}
	}
}

// Initialize the chat handler
new ChatHandler();
