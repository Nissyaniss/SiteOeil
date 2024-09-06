import express, { json } from "express";
import cookieParser from "cookie-parser";
import fs from "node:fs/promises"
import path from "node:path";

// create the app
const app = express();

app.use(cookieParser());

interface User {
	firstName?: string;
	lastName?: string;
	yearGroup?: string;
	profilePicture?: string
}

var isLoggedIn = "false";
var currentProfile: User = {
	firstName: undefined,
	lastName: undefined,
	yearGroup: undefined,
	profilePicture: undefined,
};

// for the events you need a json with informations organized like this
// 	{
// 		"name": "test",
// 		"description": "a description",
// 		"date": "01/01/1970",
// 		"place": "a place"
// 	}
// small warning the field 'description' mustn't have a word that has more than 16 characters without space

import { credentials } from "./_credentials";
import { log } from "node:console";

import { cas_login, get_moodle_courses, login_check, cas_oauth2_authorize, cas_oauth2_token, get_user_profile } from "pawnilim";

async function connect(username: string, password: string): Promise<User> {
	const cas_token = await cas_login(username, password);
	const code = await cas_oauth2_authorize(cas_token);
	const { access_token } = await cas_oauth2_token(code);
	const { token } = await login_check(access_token);

	const profile = await get_user_profile(token, username);

	return {
		firstName: profile.find(entry => entry.name === 'firstname').value,
		lastName: profile.find(entry => entry.name === 'lastname').value,
		yearGroup: "WIP - WIP",
		profilePicture: profile.find(entry => entry.name === 'avatar').value
	};
};

async function getEvents() {
	// get the path of the json file
	const filePath = path.join(__dirname, "../event.json");
	// get the json from the file
	const events = await fs.readFile(filePath, "utf-8");
	// parse and return the json
	return JSON.parse(events);
}

// enable usage of EJS (Embedded JavaScript Templates)
app.set('view engine', 'ejs');

// uses the folder public for css and images
app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));

// when route / is called by the user
app.get("/", async (req, res) => {
	// get the events
	const events = await getEvents();
	// render the ejs with the informations of events

	let user: User | undefined;
	const isLoggedIn = "user" in req.cookies;
	if (isLoggedIn) {
		user = JSON.parse(decodeURIComponent(atob(req.cookies.user)));
	}

	let timetableA1;
	let timetableA2;
	let timetableA3;

	const edtA1 = await (await fetch("https://edt-iut-info-limoges.vercel.app/api/timetables/A1")).json();
	const edtA2 = await (await fetch("https://edt-iut-info-limoges.vercel.app/api/timetables/A2")).json();
	const edtA3 = await (await fetch("https://edt-iut-info-limoges.vercel.app/api/timetables/A3")).json();

	const date = new Date().getTime();

	const edtA1Date = new Date(edtA1.data[edtA1.data.length - 1].start_date).getTime();
	const edtA2Date = new Date(edtA2.data[edtA2.data.length - 1].start_date).getTime();
	const edtA3Date = new Date(edtA3.data[edtA3.data.length - 1].start_date).getTime();

	if (edtA1Date > date) {
		timetableA1 = edtA1.data[edtA1.data.length - 2];
	} else {
		timetableA1 = edtA1.data[edtA1.data.length - 1];
	}

	if (edtA2Date > date) {
		timetableA2 = edtA2.data[edtA2.data.length - 2];
	} else {
		timetableA2 = edtA2.data[edtA2.data.length - 1];
	}

	if (edtA3Date > date) {
		timetableA3 = edtA3.data[edtA3.data.length - 2];
	} else {
		timetableA3 = edtA3.data[edtA3.data.length - 1];
	}

	const currentWeekA1 = await (await fetch("https://edt-iut-info-limoges.vercel.app/api/timetable/A1/" + timetableA1.week_number)).json();
	const currentWeekA2 = await (await fetch("https://edt-iut-info-limoges.vercel.app/api/timetable/A2/" + timetableA2.week_number)).json();
	const currentWeekA3 = await (await fetch("https://edt-iut-info-limoges.vercel.app/api/timetable/A3/" + timetableA3.week_number)).json();

	log(currentWeekA3.data.lessons.filter((lesson: any) => {
		const today = new Date();
		const lessonDate = new Date(lesson.start_date);
		return today.getDate() === lessonDate.getDate() && today.getMonth() === lessonDate.getMonth();
	}));

	res.render("index.ejs", { events, isLoggedIn, firstName: user?.firstName, lastName: user?.lastName, yearGroup: user?.yearGroup });
})

// when route /help is called by the user
app.get("/help", function (req, res) {
	// send the help page
	res.sendFile(path.join(__dirname, "../views/help.html"));
});

// when route /partnership is called by the user
app.get("/partnership", function (req, res) {
	// send the partnership page
	res.sendFile(path.join(__dirname, "../views/partnership.html"));
});

app.get("/login", function (req, res) {
	res.sendFile(path.join(__dirname, "../views/login.html"));
});

app.post('/login', async function (req, res) {
	const { username, password } = req.body;
	const events = await getEvents();
	const { profilePicture, ...user } = await connect(username, password);
	res.set("Set-Cookie", "user=" + btoa(JSON.stringify(user)) + "; Path=/; HttpOnly");
	res.send(profilePicture);
});

// launch on http://localhost:9000
app.listen(9000);