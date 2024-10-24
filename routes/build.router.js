require("dotenv").config();
const express = require("express");
const docker = require("../docker");
const { Terminal, terminals } = require("../terminal");

const router = express.Router();

router.get("/", async (req, res) => {
	const builds = await docker.getBuilds();
	res.render("build", { builds });
});

router.get("/create", async (req, res) => {
	res.render("build/create", { projects: await docker.getProjects() });
});

module.exports = router;
