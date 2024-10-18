const socket = io();

var build = { name: params.get("name"), version: params.get("version") };

async function init() {
	document.getElementById("build-name").innerHTML = build.name;
	document.getElementById("build-version").innerHTML = build.version;
	await socket.emit("getTerminal", connectTerminal);
	await socket.emit(
		"buildData",
		{ name: params.get("name"), version: params.get("version") },
		(buildData) => {
			build = buildData;
			document.getElementById("build-name").innerHTML = build.name;
			document.getElementById("build-version").innerHTML = build.version;
			document.getElementById("build-CreatedAt").innerHTML =
				build.image.CreatedAt.toLocaleString();
			document.getElementById("build-gitUrl").innerHTML = build.gitUrl;
		}
	);
}
