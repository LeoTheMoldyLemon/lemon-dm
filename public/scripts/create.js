function init() {}

const socket = io();

async function build() {
	const buildData = {
		name: document.getElementById("name").value,
		version: document.getElementById("version").value,
		gitUrl: document.getElementById("gitUrl").value,
	};
	await socket.emit("getTerminal", connectTerminal);
	await socket.emit("createBuild", buildData);
}
