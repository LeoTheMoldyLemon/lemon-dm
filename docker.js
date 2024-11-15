require("dotenv").config();
const fs = require("fs");
const cli = require("./cli-wrapper");

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

function collectLogData(logCollector, mapper) {
	const res = [];
	if (logCollector.logData[0])
		for (const rawData of logCollector.logData[0].split("\n")) {
			if (rawData) {
				const data = mapper(rawData);
				res.push(data);
			}
		}
	return res;
}

async function getBranches(name, logger) {
	const projects = await getProjects();
	const project = projects[name];
	if (!project) throw new Error(`Project named "${name}" not found.`);
	const logCollector = new cli.streamCollector();

	await cli.run("git", ["ls-remote", project.gitUrl, "'refs/heads/*'"], {
		logger: {
			log: (data) => {
				logCollector.log(data);
				logger?.log(data);
			},
			error: logger?.error,
		},
	});

	const branches = collectLogData(logCollector, (rawData) => {
		return rawData.split("\t")[1].replace("refs/heads/", "");
	});

	return branches;
}

async function getProjects() {
	const projects = JSON.parse(fs.readFileSync("./projects.json"));
	return projects;
}

async function createProject(name, gitUrl, dockerfilePath) {
	const projects = JSON.parse(fs.readFileSync("./projects.json"));

	if (projects[name]) throw new Error(`Project with that name already exists.`);

	projects[name] = { name, gitUrl, dockerfilePath };

	fs.writeFileSync(JSON.stringify(projects));
}

async function editProject(name, gitUrl, dockerfilePath) {
	const projects = JSON.parse(fs.readFileSync("./projects.json"));

	if (!projects[name]) throw new Error(`Project named ${name} that name doesn't exists.`);

	projects[name] = { name, gitUrl, dockerfilePath };

	fs.writeFileSync(JSON.stringify(projects));
}

async function removeProject(name) {
	const projects = JSON.parse(fs.readFileSync("./projects.json"));

	if (!projects[name]) throw new Error(`Project named ${name} that name doesn't exists.`);

	projects[name] = undefined;

	fs.writeFileSync(JSON.stringify(projects));
}

async function getBuilds(logger) {
	const logCollector = new cli.streamCollector();

	await cli.run("docker", ["image", "ls", "-a", "--format", "json"], {
		logger: {
			log: (data) => {
				logCollector.log(data);
				logger?.log(data);
			},
			error: logger?.error,
		},
	});

	const builds = collectLogData(logCollector, (rawData) => {
		const data = JSON.parse(rawData);
		data.CreatedAt = formatDate(data.CreatedAt);
		return data;
	});

	return builds;
}

async function getBuild(name, branch, logger) {
	const logCollector = new cli.streamCollector();

	await cli.run(
		"docker",
		["image", "ls", "-a", "--format", "json", `--filter=reference=${name}:${branch}`],
		{
			logger: {
				log: (data) => {
					logCollector.log(data);
					logger?.log(data);
				},
				error: logger?.error,
			},
		}
	);

	const build = JSON.parse(logCollector.logData[0]);
	build.CreatedAt = formatDate(build.CreatedAt);
	return build;
}

async function createBuild(name, branch, args, logger) {
	const projects = await getProjects();
	const project = projects[name];

	await cli.run(
		"docker",
		[
			"build",
			...(args?.split(" ") ?? []),
			"-t",
			`${name}:${branch.replaceAll("/", "__")}`,
			`${project.gitUrl}#${branch}`,
			"-f",
			`${project.dockerfilePath}/Dockerfile`,
		],
		{ logger }
	);
}

async function removeBuild(name, branch, logger) {
	await cli.run("docker", ["image", "rm", `${name}:${branch}`], {
		logger,
	});
}

async function removeAllDeployments(name, branch, logger) {
	await cli.run(
		"docker",
		[
			"rm",
			...`$(docker ps -a --filter ancestor=${name}:${branch} --format "{{.ID}}")`.split(
				" "
			),
		],
		{ logger }
	);
}

async function createDeployment(name, branch, ports = [], envVars = [], args = "", logger) {
	const logCollector = new cli.streamCollector();

	const portList = [];
	for (const portPair of ports) {
		portList.push("-p");
		portList.push(`${portPair.host}:${portPair.container}`);
	}

	const envList = [];
	for (const envVar of envVars) {
		envList.push("-e");
		envList.push(envVar);
	}

	await cli.run(
		"docker",
		[
			"container",
			"create",
			...portList,
			...envList,
			...(args?.split(" ") ?? []),
			`${name}:${branch}`,
		],
		{
			logger: {
				log: (data) => {
					logCollector.log(data);
					logger?.log(data);
				},
				error: logger?.error,
			},
		}
	);

	//docker logs the container ID after creating it
	return logCollector.logData[0];
}

async function getDeployments(name, branch, logger) {
	const logCollector = new cli.streamCollector();
	await cli.run(
		"docker",
		[
			"container",
			"ls",
			"-a",
			"--format",
			"json",
			`--filter=ancestor=${name}:${branch}`,
		],
		{
			logger: {
				log: (data) => {
					logCollector.log(data);
					logger?.log(data);
				},
				error: logger?.error,
			},
		}
	);

	const deployments = collectLogData(logCollector, (rawData) => {
		const data = JSON.parse(rawData);
		data.CreatedAt = formatDate(data.CreatedAt);
		return data;
	});

	return deployments;
}

async function getDeployment(id, logger) {
	const logCollector = new cli.streamCollector();

	await cli.run(
		"docker",
		["container", "ls", "-a", "--format", "json", `--filter=id=${id}`],
		{
			logger: {
				log: (data) => {
					logCollector.log(data);
					logger?.log(data);
				},
				error: logger?.error,
			},
		}
	);
	if (!logCollector.logData[0]) return null;
	const deployment = JSON.parse(logCollector.logData[0]);
	deployment.CreatedAt = formatDate(deployment.CreatedAt);
	return deployment;
}

async function startDeployment(id, logger) {
	await cli.run("docker", ["start", id], { logger });
}

async function stopDeployment(id, logger) {
	await cli.run("docker", ["stop", id], { logger });
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

async function getDeploymentEvents(logger, controller) {
	await cli.run(
		"docker",
		["system", "events", "--filter", "type=container", "--format", "json"],
		{ logger, controller, ignoreCode: true }
	);
}

async function getDeploymentLogs(id, logger) {
	const logCollector = new cli.streamCollector();

	await cli.run("docker", ["logs", id], {
		logger: {
			log: (data) => {
				logCollector.log(data);
				logger?.log(data);
			},
			error: logger?.error,
		},
	});

	return logCollector.logData.join("\n");
}

async function getDeploymentLogStream(id, controller, logger) {
	await cli.run("docker", ["logs", id, "-f"], {
		logger,
		controller,
	});
	return;
}

module.exports = {
	createBuild,
	removeBuild,
	createDeployment,
	getDeployments,
	getDeployment,
	removeAllDeployments,
	startDeployment,
	stopDeployment,
	pauseDeployment,
	unpauseDeployment,
	restartDeployment,
	removeDeployment,
	getBuild,
	getBuilds,
	formatDate,
	ignoreError,
	getDeploymentEvents,
	getDeploymentLogs,
	getDeploymentLogStream,
	getBranches,
	createProject,
	removeProject,
	getProjects,
	editProject,
};
