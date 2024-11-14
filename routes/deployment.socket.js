const docker = require("../docker");
const { terminals, Terminal } = require("../terminal");

class EventEmitter {
	log(data) {
		try {
			data = JSON.parse(data);
		} catch (e) {}
		this.io.to(this.roomId).emit(this.logEventName, data);
	}
	error(data) {
		try {
			data = JSON.parse(data);
		} catch (e) {}
		this.io.to(this.roomId).emit(this.errorEventName, data);
	}
	constructor(io, roomId, logEventName, errorEventName) {
		this.roomId = roomId;
		this.io = io;
		this.logEventName = logEventName;
		this.errorEventName = errorEventName;
		this.log = this.log.bind(this);
		this.error = this.error.bind(this);
	}
}

const emitters = (io) => {
	const eventEmitter = new EventEmitter(
		io,
		"deploymentEvents",
		"deploymentEventLog",
		"deploymentEventError"
	);
	docker.getDeploymentEvents(eventEmitter);
};

const listeners = (socket) => {
	socket.on("getBuildData", async (buildData, callback) => {
		const build = await docker.ignoreError(
			docker.getBuild,
			[buildData.name, buildData.branch],
			socket.terminal
		);
		callback(build);
	});

	socket.on("getDeployments", async (buildData, callback) => {
		const deployments = await docker.ignoreError(
			docker.getDeployments,
			[buildData.name, buildData.branch],
			socket.terminal
		);
		callback(deployments);
	});

	socket.on("getDeployment", async (id, callback) => {
		const deployment = await docker.ignoreError(
			docker.getDeployment,
			[id],
			socket.terminal
		);
		callback(deployment);
	});

	socket.on("pauseDeployment", async (id) => {
		await docker.ignoreError(docker.pauseDeployment, [id], socket.terminal);
	});

	socket.on("unpauseDeployment", async (id) => {
		await docker.ignoreError(docker.unpauseDeployment, [id], socket.terminal);
	});

	socket.on("startDeployment", async (id) => {
		await docker.ignoreError(docker.startDeployment, [id], socket.terminal);
	});

	socket.on("stopDeployment", async (id) => {
		await docker.ignoreError(docker.stopDeployment, [id], socket.terminal);
	});

	socket.on("restartDeployment", async (id) => {
		await docker.ignoreError(docker.pauseDeployment, [id], socket.terminal);
	});

	socket.on("removeDeployment", async (id) => {
		await docker.ignoreError(docker.removeDeployment, [id], socket.terminal);
	});

	socket.on("deploymentEventsRoomJoin", () => {
		socket.join("deploymentEvents");
	});

	socket.on("rebuild", async (buildData, callback) => {
		await docker.ignoreError(
			docker.removeBuild,
			[buildData.name, buildData.branch],
			socket.terminal
		);
		try {
			await docker.createBuild(buildData.name, buildData.branch, socket.terminal);
			callback(true);
		} catch (e) {
			socket.terminal.log(e);
			callback(false);
		}
	});

	socket.on("getDeploymentLogs", async (id, callback) => {
		const logs = await docker.ignoreError(
			docker.getDeploymentLogs,
			[id],
			socket.terminal
		);
		callback(logs);
	});

	socket.on("deleteBuild", async (buildData) => {
		await docker.ignoreError(
			docker.removeBuild,
			[buildData.name, buildData.branch],
			socket.terminal
		);
	});

	socket.on("deleteAllDeployments", async (buildData) => {
		await docker.ignoreError(
			docker.removeAllDeployments,
			[buildData.name, buildData.branch],
			socket.terminal
		);
	});

	socket.on("createDeployment", async (buildData, ports, envVars) => {
		await docker.ignoreError(
			docker.createDeployment,
			[buildData.name, buildData.branch, ports, envVars],
			socket.terminal
		);
	});

	socket.on("getDeploymentLogStream", async (id, callback) => {
		const terminal = new Terminal();
		docker.ignoreError(docker.getDeploymentLogStream, [id, terminal], terminal).then(
			() => {
				terminal.log("Process ended, log stream closed...");
			}
		);
		callback(terminal.id);
	});
};

module.exports = { listeners, emitters };
