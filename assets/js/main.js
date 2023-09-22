import { TimeTree } from "./timetree";

// load & parse leaf data from json embedded in the document
const data = JSON.parse(document.querySelector(".leaf-data").value);
// load and parse tag list for label / slug lookup label based on slug
const tags = JSON.parse(document.querySelector(".tag-data").value);
// determine if this is a production or development build
const params = JSON.parse(document.querySelector(".env-data").value);

// pass in leaf data, tag list, and whether debugging should be enabled
let timetree = new TimeTree(data, tags, params);
