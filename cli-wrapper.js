const childProcess = require("child_process");

function promisifyStream(log, error, errOutput) {
	return (stream) =>
		new Promise((resolve, reject) => {
			stream.on("exit", resolve);
			stream.on("error", reject);
			if (log) stream.stdout?.on("data", (data) => log(data.toString()));
			if (error || errOutput)
				stream.stderr?.on("data", (data) => {
					if (error) error(data.toString());
					errOutput?.push(data.toString());
				});
		});
}

class streamCollector {
	log(data) {
		this.logData.push(data);
	}

	error(data) {
		this.errData.push(data);
	}

	constructor() {
		this.logData = [];
		this.errData = [];
		this.log = this.log.bind(this);
		this.error = this.error.bind(this);
	}
}

async function run(command, args = [], { logger, ignoreCode, ignoreError, controller } = {}) {
	let errOutput = [];
	let streamReader = promisifyStream(logger?.log, logger?.error, errOutput);
	const spawnedProcess = childProcess.spawn(command, args, { shell: true });
	if (controller) controller.kill = spawnedProcess.kill;
	await streamReader(spawnedProcess)
		.catch((error) => {
			if (!ignoreError)
				throw new Error(
					// prettier-ignore
					`Command "${command} ${args.join(" ")}" returned error ${error}\n${errOutput.join("\n")}`
				);
		})
		.then((res) => {
			if (res != 0 && !ignoreCode)
				throw new Error(
					// prettier-ignore
					`Command "${command} ${args.join(" ")}" returned status code ${res}\n${errOutput.join("\n")}`
				);
		});
}

module.exports = { run, promisifyStream, streamCollector };
