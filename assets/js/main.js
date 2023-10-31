import { TimeTree } from "./timetree";

// load & parse leaf data from json embedded in the document
const data = JSON.parse(document.getElementById("leaf-data").text);
// load and parse tag list for label / slug lookup label based on slug
const tags = JSON.parse(document.getElementById("tag-data").text);
// determine if this is a production or development build
const params = JSON.parse(document.getElementById("env-data").text);

// pass in leaf data, tag list, and whether debugging should be enabled
let timetree = new TimeTree(data, tags, params);
