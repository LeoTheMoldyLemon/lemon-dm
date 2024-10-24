function connectTerminal(id) {
	document.getElementById("terminal").src = `/terminal?id=${id}`;
}

const params = new URL(document.location).searchParams;

function download(filename, text) {
	var element = document.createElement("a");
	element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
	element.setAttribute("download", filename);

	element.style.display = "none";
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

function openInNewTab(url) {
	window.open(url, "_blank").focus();
}
