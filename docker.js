require("dotenv").config();
const fs = require("fs");
const cli = require("./cli-wrapper");

if (!data) var data;
loadData();

async function ignoreError(func, args, logger) {
	try {
		return await func(...[...args, logger]);
	} catch (e) {
		logger?.error(e.message);
	}
}

function formatDate(dateString) {
	let formattedDate = dateString.split(" ");
	formattedDate.pop();
	return new Date(formattedDate.join(" "));
}

function loadData() {
	data = JSON.parse(fs.readFileSync(process.env.DATA_FILE_PATH));
}

function saveData() {
	fs.writeFileSync(process.env.DATA_FILE_PATH, JSON.stringify(data, null, 2));
}

async function getBuilds(logger) {
	const builds = [];
	for (const buildData of data) {
		builds.push(await getBuild(buildData.name, buildData.version, logger));
	}
	return builds;
}

async function getBuild(name, version, logger) {
	const logCollector = new cli.streamCollector();

	await cli.run(
		"docker",
		["image", "ls", "-a", "--format", "json", `--filter=reference=${name}:${version}`],
		{ logger: { log: logCollector.log, error: logger?.error } }
	);

	const build = data.find((build) => build.name == name && build.version == version);
	if (!build) return null;

	build.image = JSON.parse(logCollector.logData[0]);
	build.image.CreatedAt = formatDate(build.image.CreatedAt);
	return build;
}

async function createBuild(name, version, gitUrl, logger) {
	if (data.find((buildData) => buildData.name == name && buildData.version == version))
		throw new Error("Build with that name and ID already exists.");

	await cli.run("docker", ["build", "-t", `${name}:${version}`, gitUrl], { logger });

	const buildData = { name, version, gitUrl };
	data.push(buildData);
	saveData();

	return buildData;
}

async function removeBuild(name, version, logger) {
	await cli.run("docker", ["image", "rm", `${name}:${version}`], {
		logger,
		ignoreCode: true,
	});
	data.splice(
		data.findIndex(
			(buildData) => buildData.name == name && buildData.version == version
		),
		1
	);
	saveData();
}

async function removeAllDeployments(name, version, logger) {
	await cli.run(
		"docker",
		[
			"rm",
			...`$(docker ps -a --filter ancestor=${name}:${version} --format "{{.ID}}")`.split(
				" "
			),
		],
		{ logger }
	);
}

async function createDeployment(name, version, ports = [], logger) {
	const logCollector = new cli.streamCollector();

	const portList = [];
	for (const portPair of ports) {
		portList.push("-p");
		portList.push(`${portPair.host}:${portPair.container}`);
	}

	await cli.run("docker", ["container", "create", ...portList, `${name}:${version}`], {
		logger: { log: logCollector.log, error: logger?.error },
	});

	//docker logs the container ID after creating it
	return logCollector.logData[0];
}

async function getDeployments(name, version, logger) {
	const logCollector = new cli.streamCollector();
	await cli.run(
		"docker",
		[
			"container",
			"ls",
			"-a",
			"--format",
			"json",
			`--filter=ancestor=${name}:${version}`,
		],
		{ logger: { log: logCollector.log, error: logger?.error } }
	);
	const deployments = [];
	if (logCollector.logData[0])
		for (const deplyomentData of logCollector.logData[0].split("\n")) {
			if (deplyomentData) {
				deplyomentData.CreatedAt = formatDate(deplyomentData.CreatedAt);
				deployments.push(JSON.parse(deplyomentData));
			}
		}
	return deployments;
}
async function getDeployment(id, logger) {
	const logCollector = new cli.streamCollector();

	await cli.run(
		"docker",
		["container", "ls", "-a", "--format", "json", `--filter=id=${id}`],
		{ logger: { log: logCollector.log, error: logger?.error } }
	);

	const deployment = JSON.parse(logCollector.logData[0]);
	deployment.CreatedAt = formatDate(deployment.CreatedAt);
	return deployment;
}

async function startDeployment(id, logger) {
	await cli.run("docker", ["start", id], { logger });
}

async function pauseDeployment(id, logger) {
	await cli.run("docker", ["pause", id], { logger });
}

async function unpauseDeployment(id, logger) {
	await cli.run("docker", ["unpause", id], { logger });
}

async function restartDeployment(id, logger) {
	await cli.run("docker", ["restart", id], { logger });
}

async function removeDeployment(id, logger) {
	await cli.run("docker", ["rm", id], { logger });
}

module.exports = {
	data,
	createBuild,
	removeBuild,
	createDeployment,
	getDeployments,
	getDeployment,
	removeAllDeployments,
	startDeployment,
	pauseDeployment,
	unpauseDeployment,
	restartDeployment,
	removeDeployment,
	getBuild,
	getBuilds,
	formatDate,
	ignoreError,
};
