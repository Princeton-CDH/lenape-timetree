const labelLineHeight = 18;
// multiplier to use for calculating size based on characters
const pixelsPerChar = 7;

function splitLabel(label = null) {
  // split a leaf label into words for wrapping
  // for now, splitting on whitespace, but could adjust
  if (label == null || label == undefined) {
    return ["no title"];
  }
  return label.split(" ");
}

function labelHeight(label = null) {
  // height is based on line height and number of words
  return splitLabel(label).length * labelLineHeight;
}

function labelRadius(label = null) {
  // calculate a label radius to use for avoiding collision in
  // the d3-force simulation

  const words = splitLabel(label);
  // width is based on the longest word
  const width = Math.max(...words.map((w) => w.length)) * pixelsPerChar;
  // height is based on line height and number of words
  const height = words.length * labelLineHeight;
  // whichever is bigger is the diameter; halve for radius
  return Math.max(width, height) / 2;
}

export { labelLineHeight, splitLabel, labelRadius, labelHeight, pixelsPerChar };
