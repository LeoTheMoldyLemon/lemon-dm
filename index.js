require("dotenv").config();
const express = require("express");
const http = require("node:http");
const { Server } = require("socket.io");
const docker = require("./docker.js");
const fs = require("fs");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const { terminals, Terminal } = require("./terminal");

app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "ejs");

app.get("/", (req, res) => {
	res.redirect("/build");
});

const buildRouter = require("./routes/build.router");
const buildSocket = require("./routes/build.socket");
const deploymentRouter = require("./routes/deployment.router");
const deploymentSocket = require("./routes/deployment.socket");

app.use("/build", buildRouter);
app.use("/deployment", deploymentRouter);
app.get("/sshPublicKey", (req, res) => {
	res.download(process.env.SSH_PUBLIC_KEY_PATH);
});

app.get("/terminal", (req, res) => {
	res.render("terminal");
});

io.on("connection", (socket) => {
	socket.on("connectTerminal", (id, callback) => {
		if (!terminals[id]) callback("Failed to connect to remote terminal...");
		else {
			callback("Connected to terminal.");
			terminals[id].connect(socket);
		}
	});
	socket.on("getTerminal", (callback) => {
		const terminal = new Terminal();
		socket.terminal = terminal;
		callback(terminal.id);
	});

	buildSocket(socket);
	deploymentSocket(socket);
});

function startServer() {
	server.listen(process.env.PORT, () => {
		console.log(`Server running on port ${process.env.PORT}`);
	});
}

async function main() {
	startServer();
}
main();

/*
build needs:
    id
    name
    version
    git repository
    branch

deployment needs:
    id
    build_id
    ports
*/
