const { v4: uuidv4 } = require("uuid");
uuidv4();

class Terminal {
	log(data) {
		data = data.toString();
		if (this.socket) this.socket.emit("stdout", data);
		this.buffer.push(data);
	}
	error(data) {
		data = data.toString();
		if (this.socket) this.socket.emit("stderr", data);
		this.buffer.push(data);
	}
	connect(socket) {
		this.socket = socket;
		this.socket.emit("buffer", this.buffer);
		this.socket.on("disconnect", () => {
			if (this.kill) this.kill();
			delete terminals[this.id];
		});
	}
	constructor() {
		this.id = uuidv4();
		terminals[this.id] = this;
		this.buffer = [];
		this.log = this.log.bind(this);
		this.error = this.error.bind(this);
		this.connect = this.connect.bind(this);
	}
}

if (!terminals) var terminals = {};
module.exports = { Terminal, terminals };
