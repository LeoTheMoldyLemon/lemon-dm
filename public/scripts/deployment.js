const socket = io();

var build = { Repository: params.get("name"), Tag: params.get("branch") };

var deploymentTemplate;

socket.on("deploymentEventLog", (event) => {
	if (event.status == "create") {
		socket.emit("getDeployment", event.id, (deploymentData) => {
			if (deploymentData) addDeployment(deploymentData);
		});
	}
	const deploymentNode = document.getElementById(event.id.slice(0, 12));
	if (!deploymentNode) return;
	socket.emit("getDeployment", event.id, (deploymentData) => {
		if (!deploymentData) deploymentNode.remove();
		else applyDeploymentData(deploymentNode, deploymentData);
	});
});

function toggleAllButtons(state) {
	for (const button of document.querySelectorAll("button")) {
		button.disabled = !state;
	}
}

async function init() {
	toggleAllButtons(false);
	deploymentTemplate = document.getElementById("deployment-wrapper-template");
	document.getElementById("build-name").innerHTML = build.Repository;
	document.getElementById("build-branch").innerHTML = build.Tag;
	document.getElementById("create-deployment").onsubmit = () => {
		try {
			createDeployment();
		} catch (e) {
			console.log(e);
		}
		return false;
	};
	await socket.emit("getTerminal", connectTerminal);
	await socket.emit(
		"getBuildData",
		{ name: params.get("name"), branch: params.get("branch") },
		(buildData) => {
			if (!buildData) return alert("Failed to load build");
			build = buildData;
			document.getElementById("build-name").innerHTML = build.Repository;
			document.getElementById("build-branch").innerHTML = build.Tag;
			document.getElementById("build-createdAt").value = build.CreatedAt.slice(
				0,
				16
			);

			toggleAllButtons(true);
		}
	);
	await socket.emit("deploymentEventsRoomJoin");
	await socket.emit(
		"getDeployments",
		{ name: build.Repository, branch: build.Tag },
		(deployments) => {
			for (const deploymentData of deployments) {
				addDeployment(deploymentData);
			}
		}
	);
}

function rebuild() {
	toggleAllButtons(false);
	socket.emit("rebuild", { name: build.Repository, branch: build.Tag }, (success) => {
		if (success) toggleAllButtons(true);
		else alert("Failed to rebuild.");
	});
}

function deleteBuild() {
	toggleAllButtons(false);
	socket.emit("deleteBuild", { name: build.Repository, branch: build.Tag });
}

function deleteAllDeployments() {
	socket.emit("deleteAllDeployments", { name: build.Repository, branch: build.Tag });
}

function addDeployment(deploymentData) {
	const node = deploymentTemplate.content.cloneNode(true);
	applyDeploymentData(node.querySelector("tr"), deploymentData);

	document.getElementById("deployment-table").appendChild(node);
}

function applyDeploymentData(node, deploymentData) {
	node.id = deploymentData.ID;
	node.querySelector(".deployment-id").innerHTML = deploymentData.ID;
	node.querySelector(".deployment-state").innerHTML = deploymentData.State;
	node.querySelector(".deployment-createdAt").value = deploymentData.CreatedAt.slice(0, 16);
	node.querySelector(".deployment-ports").innerHTML =
		deploymentData.Ports == "" ? "None" : deploymentData.Ports;

	const streamLogsBtn = node.querySelector(".deployment-stream-logs");
	const downloadLogsBtn = node.querySelector(".deployment-download-logs");
	const deleteBtn = node.querySelector(".deployment-delete");
	const restartBtn = node.querySelector(".deployment-restart");
	const togglePauseBtn = node.querySelector(".deployment-toggle-pause");
	const toggleStartBtn = node.querySelector(".deployment-toggle-start");

	streamLogsBtn.name = deploymentData.ID;
	downloadLogsBtn.name = deploymentData.ID;
	deleteBtn.name = deploymentData.ID;
	restartBtn.name = deploymentData.ID;
	togglePauseBtn.name = deploymentData.ID;
	toggleStartBtn.name = deploymentData.ID;
	deploymentChangeState(node, deploymentData.State);
}

function createDeployment() {
	const portsListStr = document.getElementById("ports").value;
	const portsList = [];
	for (const portsStr of portsListStr.split(";")) {
		const hostPort = parseInt(portsStr.split(":")[0]);
		const containerPort = parseInt(portsStr.split(":")[1]);
		if (hostPort && containerPort)
			portsList.push({ host: hostPort, container: containerPort });
	}
	socket.emit("createDeployment", { name: build.Repository, branch: build.Tag }, portsList);
}

function startDeployment(id) {
	socket.emit("startDeployment", id);
}

function pauseDeployment(id) {
	socket.emit("pauseDeployment", id);
}

function unpauseDeployment(id) {
	socket.emit("unpauseDeployment", id);
}

function stopDeployment(id) {
	socket.emit("stopDeployment", id);
}

function restartDeployment(id) {
	socket.emit("restartDeployment", id);
}

function removeDeployment(id) {
	socket.emit("removeDeployment", id);
}

function downloadDeploymentLogs(id) {
	socket.emit("getDeploymentLogs", id, (logs) => {
		download(id + ".log", logs);
	});
}

function streamDeploymentLogs(id) {
	socket.emit("getDeploymentLogStream", id, (terminalId) => {
		openInNewTab(`/terminal?id=${terminalId}`);
	});
}

function deploymentChangeState(node, state) {
	const restartBtn = node.querySelector(".deployment-restart");
	const togglePauseBtn = node.querySelector(".deployment-toggle-pause");
	const toggleStartBtn = node.querySelector(".deployment-toggle-start");
	switch (state) {
		case "created":
		case "exited":
			restartBtn.disabled = true;
			togglePauseBtn.disabled = true;
			toggleStartBtn.disabled = false;
			toggleStartBtn.innerHTML = "Start";
			toggleStartBtn.onclick = () => startDeployment(toggleStartBtn.name);
			break;
		case "restarting":
			restartBtn.disabled = true;
			togglePauseBtn.disabled = true;
			toggleStartBtn.disabled = true;
			break;
		case "running":
			restartBtn.disabled = false;
			togglePauseBtn.disabled = false;
			toggleStartBtn.disabled = false;
			togglePauseBtn.innerHTML = "Pause";
			togglePauseBtn.onclick = () => auseDeployment(toggleStartBtn.name);
			toggleStartBtn.innerHTML = "Stop";
			togglePauseBtn.onclick = () => stopDeployment(toggleStartBtn.name);
			break;
		case "paused":
			restartBtn.disabled = false;
			togglePauseBtn.disabled = false;
			toggleStartBtn.disabled = false;
			togglePauseBtn.innerHTML = "Unpause";
			togglePauseBtn.onclick = () => unpauseDeployment(toggleStartBtn.name);
			toggleStartBtn.innerHTML = "Stop";
			togglePauseBtn.onclick = () => stopDeployment(toggleStartBtn.name);
			break;
	}
}
