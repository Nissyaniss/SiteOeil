import express, { json } from "express";
import fs from "node:fs/promises"
import path from "node:path";

const app = express();

async function test() {
	const filePath = path.join(__dirname, "../event.json");
	const events = await fs.readFile(filePath, "utf-8");
	return JSON.parse(events);
}

app.set('view engine', 'ejs');

app.get("/", async (req, res) => {
	const events = await test();
	res.render("index.ejs", { events });
})

app.listen(9000);