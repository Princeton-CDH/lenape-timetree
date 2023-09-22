// const labelLineHeight = 18;
// multiplier to use for calculating size based on characters
// const pixelsPerChar = 7;

class LeafLabel {
  static lineHeight = 18;
  // multiplier to use for calculating size based on characters
  static pixelsPerChar = 7;

  constructor(label = null) {
    this.text = label;
    // always need parts and want to calculate once, so getter doesn't make sense
    this.parts = this.splitLabel();
  }

  splitLabel() {
    // split a leaf label into words for wrapping
    // for now, splitting on whitespace, but could adjust
    if (this.text == null || this.text == undefined) {
      return ["no title"];
    }
    return this.text.split(" ");
  }

  get height() {
    // height is based on line height and number of words
    return this.parts.length * LeafLabel.lineHeight;
  }

  get width() {
    // width is based on the longest word
    return (
      Math.max(...this.parts.map((w) => w.length)) * LeafLabel.pixelsPerChar
    );
  }

  get radius() {
    // calculate radius based on text content, for avoiding collision in
    // the d3-force simulation
    // determine whichever is bigger is the diameter; halve for radius
    return Math.max(this.width, this.height) / 2.0;
  }
}

export { LeafLabel };
