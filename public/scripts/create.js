function init() {}

const socket = io();

async function init() {
	await socket.emit("getTerminal", connectTerminal);
}

function getBranches() {
	const projectSelect = document.getElementById("name");
	const name = projectSelect.value;
	const branchSelect = document.getElementById("branch");
	branchSelect.innerHTML = [];
	branchSelect.disabled = true;
	document.getElementById("reload-branches").disabled = true;

	const placeholderNode = document.createElement("option");
	placeholderNode.value = "";
	placeholderNode.text = "Select a branch";
	placeholderNode.disabled = true;
	placeholderNode.selected = true;
	branchSelect.add(placeholderNode);

	socket.emit("getBranches", name, (branches) => {
		for (const branch of branches) {
			const node = document.createElement("option");
			node.value = branch;
			node.text = branch;
			branchSelect.add(node);
		}
		branchSelect.disabled = false;
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
