function connectTerminal(id) {
	document.getElementById("terminal").src = `/terminal?id=${id}`;
}

const params = new URL(document.location).searchParams;
