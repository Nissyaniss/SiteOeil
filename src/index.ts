import express from "express";
import fs from "node:fs/promises"
import path from "node:path";

// create the app
const app = express();

// for the events you need a json with informations organized like this
// 	{
// 		"name": "test",
// 		"description": "a description",
// 		"date": "01/01/1970",
// 		"place": "a place"
// 	}
// small warning the field description must not have a word that has more than 16 characters without space

async function getEvents() {
	// get the path of the json file
	const filePath = path.join(__dirname, "../event.json");
	// get the json from the file
	const events = await fs.readFile(filePath, "utf-8");
	// parse and retuurn the json
	return JSON.parse(events);
}

// enable usage of EJS (Embedded JavaScript Templates)
app.set('view engine', 'ejs');

// uses the folder public for css and images
app.use(express.static('public'));

// when route / is called by the user
app.get("/", async (req, res) => {
	// get the events
	const events = await getEvents();
	// render the ejs with the informations of events
	res.render("index.ejs", { events });
})

app.get("/help", function (req, res) {
	res.sendFile(path.join(__dirname, "../views/help.html"));
});

app.get("/partnership", function (req, res) {
	res.sendFile(path.join(__dirname, "../views/partnership.html"));
});

// launch on https://localhost:9000
app.listen(9000);