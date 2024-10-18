var terminal;
function init() {
	terminal = document.getElementById("terminal");
	terminal.innerHTML = "";
}

function log(data) {
	console.log(data);
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

function download() {
	let filename = `log.txt`;
	text = terminal.innerHTML;
	var element = document.createElement("a");
	element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
	element.setAttribute("download", filename);

	element.style.display = "none";
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}
