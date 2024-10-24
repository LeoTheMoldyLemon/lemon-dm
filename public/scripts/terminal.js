var terminal;
function init() {
	terminal = document.getElementById("terminal");
	terminal.innerHTML = "";
}

function log(data) {
	terminal.innerHTML += data + "\n";
	terminal.scrollTop = terminal.scrollHeight;
}
const socket = io();
socket.emit("connectTerminal", params.get("id"), log);
socket.on("stdout", log);
socket.on("stderr", log);
socket.on("buffer", (dataList) => {
	for (const data of dataList) log(data);
});

function clearTerminal() {
	terminal.innerHTML = "";
}

function downloadTerminalOutput() {
	let filename = `terminal.log`;
	text = terminal.innerHTML;
	download(filename, text);
}
