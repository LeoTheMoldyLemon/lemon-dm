const docker = require("../docker");
const { terminals, Terminal } = require("../terminal");

const emitters = (io) => {};
const listeners = (socket) => {
	socket.on("createBuild", async (buildData) => {
		docker.ignoreError(
			docker.createBuild,
			[buildData.name, buildData.branch, buildData.args],
			socket.terminal
		);
	});
	socket.on("getBranches", async (name, callback) => {
		const branches = await docker.ignoreError(
			docker.getBranches,
			[name],
			socket.terminal
		);
		callback(branches);
	});
};

module.exports = { listeners, emitters };
