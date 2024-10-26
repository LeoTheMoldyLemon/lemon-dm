function init() {}

const socket = io();

async function init() {
	await socket.emit("getTerminal", connectTerminal);
}

function getBranches() {
	const projectSelect = document.getElementById("name");
	const name = projectSelect.value;
	const branchList = document.getElementById("branch-list");
	const branchInput = document.getElementById("branch");
	branchList.innerHTML = [];
	branchInput.disabled = true;
	document.getElementById("reload-branches").disabled = true;

	socket.emit("getBranches", name, (branches) => {
		for (const branch of branches) {
			const node = document.createElement("option");
			node.value = branch;
			node.text = branch;
			branchList.appendChild(node);
		}
		branchInput.disabled = false;
		document.getElementById("reload-branches").disabled = false;
	});
}

async function build() {
	const buildData = {
		name: document.getElementById("name").value,
		branch: document.getElementById("branch").value,
	};
	await socket.emit("createBuild", buildData);
}
