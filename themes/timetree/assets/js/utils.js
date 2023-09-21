// base SVG class with common functionality for timetree and roots
class BaseSVG {
  // create a media query element to check for mobile / desktop
  // using breakpoint-s (tablet in portrait orientation)
  mobileQuery = window.matchMedia("(max-width: 790px)");

  isMobile() {
    return this.mobileQuery.matches; // true if our query matches
  }

  width_opts = {
    mobile: 800,
    desktop: 1200,
  };

  getSVGWidth() {
    return this.isMobile() ? this.width_opts.mobile : this.width_opts.desktop;
  }
}

export { BaseSVG };
