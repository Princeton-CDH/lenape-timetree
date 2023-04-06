import { TimeTree } from "./timetree";

// load & parse leaf data from json embedded in the document
const data = JSON.parse(document.querySelector(".leaf-data").value);
// load and parse tag list for label / slug lookup label based on slug
const tags = JSON.parse(document.querySelector(".tag-data").value);

let timetree = new TimeTree(data.leaves, tags);
