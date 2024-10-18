module.exports = (socket) => {
	socket.on("createBuild", async (buildData) => {
		const build = docker.ignoreError(
			docker.createBuild,
			[buildData.name, buildData.version, buildData.gitUrl],
			socket.terminal
		);
	});

	socket.on("buildData", async (buildData, callback) => {
		const build = await docker.ignoreError(
			docker.getBuild,
			[buildData.name, buildData.version],
			socket.terminal
		);
		callback(build);
	});
};
