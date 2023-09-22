// logic to generate a path for drawing leaves,
// and for managing leaf details and tag behavior in the timetree

import { select, selectAll } from "d3-selection";
import { line, curveNatural } from "d3-shape";

// combine into d3 object for convenience
const d3 = {
  line,
  curveNatural,
  select,
  selectAll,
};

// configuration for leaf sizes
// sizes are scaled from 40px width design:
//   min height and width: 40px; max height 100px;
//   max mid shift 34 (34px at most, 17 either way); max tip shift 12

let leafSize = {
  minHeight: 30,
  maxHeight: 75,
  width: 30,
  maxMidShift: 25,
  maxTipShift: 9,
};

// get a random number between a min and max
function randomNumBetween(max, min = 0) {
  // scale random value between 0 and 1 to desired scale, start at min value
  return Math.random() * (max - min) + min;
}

function plusOrMinus(x) {
  return randomNumBetween(x, -x);
}

function cointoss() {
  // randomly return true or false;
  // based on https://stackoverflow.com/a/60322877/9706217
  return Math.random() < 0.5;
}

const TagSelectEvent = new Event("tag-select");
const TagDeselectEvent = new Event("tag-deselect");

class Leaf {
  // constant for selection classname
  static selectedClass = "select";
  static highlightClass = "highlight";

  constructor(panel, ignore_ids, tags) {
    // store a reference to the panel object
    this.panel = panel;
    this.container = document.querySelector("aside");
    this.bindHandlers();
    // list of ids to ignore when loading leaf details
    // (known non-leaf elements, including branch start targets)
    this.ignore_ids = ignore_ids || [];
    this.tags = tags || [];
  }

  static isTag(element) {
    // check if an element is a tag
    return (
      element.tagName == "A" && element.parentElement.classList.contains("tags")
    );
  }

  bindHandlers() {
    // bind a delegated click handler to override tag link behavior;
    // delegated so it applies to tags in leaf details loaded after bound
    this.container.addEventListener("click", (event) => {
      let element = event.target;
      // if click target is a link in the tags section, select leaves for that tag
      if (Leaf.isTag(element)) {
        event.preventDefault();
        event.stopPropagation();
        this.currentTag = element.dataset.tag;
        element.classList.add(Leaf.selectedClass);
        this.container.dispatchEvent(TagSelectEvent);
      }
    });

    // bind handler to current tag x button to deactivate tag
    this.activeTagClose = document.querySelector("#current-tag .close");
    if (this.activeTagClose) {
      this.activeTagClose.addEventListener("click", (event) => {
        this.currentTag = null;
        this.container.dispatchEvent(TagDeselectEvent);
      });
    }

    // focus management for the full page / timetree and within the panel
    let body = document.querySelector("body");
    body.addEventListener("focusout", this.handleFocusOut.bind(this));

    // listen for hash change; update selected leaf on change
    window.addEventListener("hashchange", this.updateSelection.bind(this));

    // deselect current leaf when the panel is closed
    if (this.panel && this.panel.el) {
      // should only be undefined in tests
      this.panel.el.addEventListener(
        "panel-close",
        this.handleClosePanel.bind(this)
      );
    }
  }

  handleFocusOut(event) {
    if (!event.relatedTarget) {
      // if event doesn't have a next target for focus,
      // then we don't need to handle it
      return true;
    }
    if (event.relatedTarget.id == "panel") {
      // when code transfers focus to the panel, do nothing
      return true;
    }

    const body = document.querySelector("body");

    // boolean indicating whether a tag is active
    const tagActive = body.classList.contains("tag-active");
    // boolean indicating whether leaf details are visible
    const leafVisible = this.panel.detailsVisible;

    // when a leaf is visible and focus out event is inside panel,
    // keep focus contained within the panel (act like a modal)
    if (leafVisible && this.container.contains(event.target)) {
      // handle any tab that would move focus out of the container
      const closeButton = this.container.querySelector("button.close");
      if (
        event.relatedTarget &&
        !this.container.contains(event.relatedTarget)
      ) {
        // if the user is tabbing out of the container and
        // the close button is the element losing focus,
        // then this is a shift+tab; shift focus to the last tag
        if (event.target == closeButton) {
          this.container.querySelector(".tags a:last-child").focus();
        } else {
          // otherwise, user has tabbed through the last tag;
          // shift focus to the close button
          closeButton.focus();
        }
      } else if (event.relatedTarget == this.activeTagClose) {
        // when a tag is active, the tag close button is focusable
        // and inside the panel; skip it

        // if focus just left the close button,
        // move focus to beginning of the panel
        if (event.target == closeButton) {
          this.container.querySelector("#panel").focus();
        } else {
          // otherwise, move focus to the close button
          closeButton.focus();
        }
      }
    } else if (tagActive) {
      //  when a tag is active, treat the tree like a modal
      // and contain tabs within the tree + active tag close button

      const timetree = document.getElementById("timetree");
      if (event.target == this.activeTagClose) {
        const highlightedLeaves = timetree.querySelectorAll(
          "path.leaf.highlight"
        );
        const firstLeaf = highlightedLeaves[0];
        const lastLeaf = highlightedLeaves[highlightedLeaves.length - 1];
        // if the next target is inside the container, then it was a
        // tab forward and we tabbed into the intro; skip to first highlighted leaf
        if (this.container.contains(event.relatedTarget)) {
          firstLeaf.focus();
        } else {
          // otherwise, shift+tab; focus on the last highlighted leaf
          lastLeaf.focus();
        }
      } else if (!timetree.contains(event.relatedTarget)) {
        // if not tabbing from active tag close button and
        // next tab would move out of timetree container,
        // shift focus to active tag close button
        this.activeTagClose.focus();
      }
    }
  }

  handleClosePanel(event) {
    // if a leaf is selected, transfer focus back to leaf or dedication before closing
    if (this.currentLeaf != undefined) {
      document
        .querySelector(`[tabindex][data-id="${this.currentLeaf}"]`)
        .focus();
    }
    // then clear current leaf
    this.currentLeaf = event;
  }

  set currentLeaf(event) {
    // Are we deselecting a leaf?
    // deselect if called with no argument or on panel-close event
    if (event == undefined || event == null || event.type == "panel-close") {
      // remove hash
      let urlNoHash = window.location.pathname + window.location.search;
      history.replaceState(null, "", urlNoHash);
    } else {
      // get the actual leaf target from DOM
      let target = Leaf.getLeafTarget(event.target);
      // get leaf ID
      let leafID = target.dataset.id;
      // update URL to reflect the currently selected leaf;
      // replace the location & state to avoid polluting browser history
      history.replaceState(null, "", `#${leafID}`);
    }
    // regardless, update selection
    this.updateSelection();
  }

  set currentTag(tag) {
    // parse the curent url
    let url = new URL(window.location.href);
    // add/remove active tag indicator to container
    // so css can be used to disable untagged leaves

    // if no tag passed in, remove active tag param
    if (tag == undefined || tag == null) {
      url.searchParams.delete("tag");
      this.container.classList.remove("tag-active");
    } else {
      // if tag passed in, set it in url params
      url.searchParams.set("tag", tag);
      this.container.classList.add("tag-active");
    }
    // update url in history
    history.replaceState(null, "", url.toString());
    // update selection
    this.updateSelection();
  }

  static getLeafTarget(target) {
    // if the target is the tspan within text label, use parent element
    if (target.tagName == "tspan") {
      target = target.parentElement;
    }
    return target;
  }

  static targetLeafURL(target) {
    // both text and path have data-url set
    return Leaf.getLeafTarget(target).dataset.url;
  }

  static deselectCurrent() {
    // deselect all selected and highlighted leaves and their labels
    d3.selectAll(`.${Leaf.selectedClass}`).classed(Leaf.selectedClass, false);
    d3.selectAll(`.${Leaf.highlightClass}`).classed(Leaf.highlightClass, false);
  }

  get currentState() {
    // get selection information from URL
    let url = new URL(window.location.href);
    let tag = url.searchParams.get("tag");
    let leafHash = url.hash;

    // construct an object to track current state
    let currentState = {};
    if (tag) {
      currentState.tag = tag;
    }

    if (leafHash && leafHash.startsWith("#")) {
      currentState.leaf = leafHash.slice(1);
    }
    return currentState;
  }

  get currentLeaf() {
    return this.currentState.leaf;
  }

  get currentTag() {
    return this.currentState.tag;
  }

  updateSelection() {
    // get selection information from URL
    let currentState = this.currentState;

    // deselect any current
    Leaf.deselectCurrent();

    // undo selection for any previously active tags
    d3.selectAll(".tags a").classed(Leaf.selectedClass, false);
    // if a tag is active
    if (currentState.tag) {
      d3.selectAll(`.${currentState.tag}`).classed(Leaf.highlightClass, true);

      // disable all leaves and dedication for both mouse and keyboard users
      d3.selectAll(
        `svg [tabindex]:not(.${currentState.tag}):not(.branch-start)`
      )
        .attr("tabindex", -1)
        .attr("aria-disabled", true);

      // add indicator to container to dim the untagged portions of the tree
      document.querySelector("body").classList.add("tag-active");

      let activeTag = document.querySelector("#current-tag span");
      // display the tag name based on the slug;
      // as fallback, display the tag id if there is no name found
      let previousActiveTag = activeTag.textContent;
      activeTag.textContent = this.tags[currentState.tag] || currentState.tag;
      // when tag filter changes, announce for screen readers that
      // the tree is filtered and how many leaves are highlighted
      if (activeTag.textContent != previousActiveTag) {
        let leafCount = document.querySelectorAll(
          `path.${currentState.tag}`
        ).length;
        this.panel.announce(
          `Filtering by tag ${activeTag.textContent}; ${leafCount} leaves highlighted`
        );
      }

      // enable tag close button
      let closeTag = document.querySelector("#current-tag button");
      if (closeTag) {
        closeTag.removeAttribute("disabled");
      }
    } else {
      // otherwise, remove active tag
      const body = document.querySelector("body");
      if (body.classList.contains("tag-active")) {
        // announce when tag filter is removed
        this.panel.announce("Tag filtering removed");
      }

      body.classList.remove("tag-active");

      // disable active tag close button
      let tagClose = document.querySelector("#current-tag button");
      if (tagClose) {
        // not included in all unit test fixtures
        tagClose.setAttribute("disabled", "true");
      }

      // re-enable all active leaves and dedication;
      // do NOT activate branch-start pseudo-headers
      d3.selectAll("svg [tabindex][aria-disabled=true]:not(.branch-start)")
        .attr("tabindex", 0)
        .attr("aria-disabled", null);
    }

    // if hash set, select leaf; unless it is in the list of ignored ids
    // (load leaf first so if there is a current tag it can be set to active)
    if (currentState.leaf && !this.ignore_ids.includes(currentState.leaf)) {
      let leafTarget = document.querySelector(
        `path[data-id="${currentState.leaf}"], image[data-id="${currentState.leaf}"]`
      );
      // if path is not found, look for an image (= dedication)

      // if hash id corresponds to a leaf, select it
      if (leafTarget != undefined) {
        // actually make selection
        Leaf.setLeafLabelClass(leafTarget.dataset.url, Leaf.selectedClass);
        // open panel
        this.openLeafDetails(leafTarget, currentState.tag);

        // fixme: shouldn't need to be set here
        document.body.dataset.panelvisible = true;
      }
    }

    // return an object indicating current state
    return currentState;
  }

  openLeafDetails(leafTarget, activeTag) {
    this.panel.loadURL(leafTarget.dataset.url, (article) => {
      // if an active tag is specifed, mark as selected
      if (activeTag != undefined) {
        let articleTag = article.querySelector(
          `.tags a[data-tag=${activeTag}]`
        );
        if (articleTag) {
          articleTag.classList.add(Leaf.selectedClass);
        }
      }
    });
  }

  static highlightLeaf(event) {
    // visually highlight both leaf & label when corresponding one is hovered
    Leaf.setLeafLabelClass(Leaf.targetLeafURL(event.target), "hover");
  }

  static unhighlightLeaf(event) {
    // turn off visual highlight for both when hover ends
    Leaf.setLeafLabelClass(Leaf.targetLeafURL(event.target), "hover", false);
  }

  static setLeafLabelClass(leafURL, classname, add = true) {
    // set a class on leaf and corresponding label based on data url
    d3.selectAll(`[data-url="${leafURL}"]`).classed(classname, add);
  }
}

class LeafPath {
  x = 0;
  static curve = d3.line().curve(d3.curveNatural);
  // stem = [];
  leftPoints = [];
  rightPoints = [];
  // tip = [];

  constructor() {
    this.height = this.getHeight();
    this.halfHeight = this.height / 2;

    // center of leaf should be at 0,0
    // middle of the leaf can be shifted +/-
    let midXShift = plusOrMinus(leafSize.maxMidShift);
    // left middle is center of leaf + half leaf width + random shift
    this.leftMid = this.x - leafSize.width / 2 + midXShift;
    let rightMid = this.leftMid + leafSize.width;

    this.tip = this.getTip();

    // can we just add points to both sides and then sort by Y ?

    // generate points for left and right sides programmatically from
    // top to bottom (stem to tip) with some randomness

    // collect leaf points as we go for the two sides of the leaf in tandem
    // left side starts at the stem; append new points after
    this.leftPoints = [
      this.stem, // top (stem)
    ];
    // right side ends up at the stem; insert new points before
    this.rightPoints = [this.stem];

    // if leaf is long enough, do two mid points
    if (this.height > 50) {
      // two mid points around thirds
      let midY1 = -this.height / 2 + this.height * 0.33 - randomNumBetween(7);
      let midY2 = -this.height / 2 + this.height * 0.66 - randomNumBetween(7);

      // should we adjust the upper width?
      if (cointoss()) {
        // yes, adjust the first
        // should we adjust the left or the right?
        if (cointoss()) {
          // left
          // shrink width by adjustment on the leftside
          let adjustment = randomNumBetween(7);
          this.leftPoints.push([this.leftMid + adjustment, midY1]);
        } else {
          this.leftPoints.push([this.leftMid, midY1]);
        }

        if (cointoss()) {
          // right
          let adjustment = randomNumBetween(7);
          this.rightPoints.unshift([this.rightMid - adjustment, midY1]);
        } else {
          this.rightPoints.unshift([this.rightMid, midY1]);
        }
      } else {
        // push first width without adjusting
        this.leftPoints.push([this.leftMid, midY1]);
        this.rightPoints.unshift([this.rightMid, midY1]);

        // adjust the second; should we adjust the left or the right?
        let adjustment = randomNumBetween(5);
        if (cointoss()) {
          // left
          // shrink width by adjustment on the leftside
          this.leftPoints.push([this.leftMid + adjustment, midY2]);
        } else {
          this.leftPoints.push([this.leftMid, midY2]);
        }
        if (cointoss()) {
          // right
          this.rightPoints.unshift([this.rightMid - adjustment, midY2]);
        } else {
          this.rightPoints.unshift([this.rightMid, midY2]);
        }
      }
    } else {
      // for shorter leaves, only one set of midpoints
      // Y-axis midpoint is 0
      this.leftPoints.push([this.leftMid, 0]);
      this.rightPoints.unshift([rightMid, 0]);
    }

    // how pointy is the tail? add points relative to the tail
    // at 80% of the height, leaf should be on average 60% of the width; adjust randomly
    let nearTailWidth = leafSize.width * 0.6 - randomNumBetween(7);
    // let nearTailX = tailX - nearTailWidth; // randomNumBetween(nearTailWidth, - nearTailWidth);
    // unadajusted tailx
    let nearTailX = this.leftMid + leafSize.width / 2 - nearTailWidth / 2; // randomNumBetween(nearTailWidth, -
    // let nearTailY = this.height * 0.8 - this.height/2;
    let nearTailY = this.tip[1] - this.height * 0.2;
    if (cointoss()) {
      this.leftPoints.push([nearTailX, nearTailY]);
    } else {
      if (cointoss()) {
        this.rightPoints.unshift([nearTailX + nearTailWidth, nearTailY]);
      }
    }

    // tail only needs to be added once
    this.leftPoints.push(this.tip); //[tailX, leafHeight]);

    this.rightPoints.unshift(this.tip); //[tailX, leafHeight]);
  }

  get stem() {
    // stem is half the leaf height above 0
    return [this.x, -this.halfHeight];
  }

  getHeight() {
    // generate a random height somewhere between our min and max
    return randomNumBetween(leafSize.maxHeight, leafSize.minHeight);
  }

  getTip() {
    // tail of the leaf does not need to be centered
    // start with midpoint of shifted middle, then shift slightly more
    let tailX =
      this.leftMid + leafSize.width / 2 + plusOrMinus(leafSize.maxTipShift);
    return [tailX, this.halfHeight];
  }

  get rightMid() {
    return this.leftMid + leafSize.width;
  }

  get points() {
    return [
      this.stem,
      [this.leftMid, 0],
      this.tip,
      [this.rightMid, 0],
      this.stem,
    ];
  }

  // get leftPoints() {
  //   return [this.stem, [this.leftMid, 0], this.tip];
  // }

  // get rightPoints() {
  //   return [this.tip, [this.rightMid, 0], this.stem];
  // }

  get path() {
    // combine two curves so the tip doesn't get too curved
    return LeafPath.curve(this.leftPoints) + LeafPath.curve(this.rightPoints);
    // NOTE: two paths makes the outlines visibly disconnected...
    // return LeafPath.curve(this.points);
  }
}

export { cointoss, leafSize, plusOrMinus, randomNumBetween, Leaf, LeafPath };
