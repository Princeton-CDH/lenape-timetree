import { Leaf } from "./leaves";

const PanelCloseEvent = new Event("panel-close");

class Panel {
  /*
    The panel is used to display the project introduction on page load
    and leaf details as leaves are selected.
    On desktop, leaf details can be closed but the panel is always visible.
    On mobile, the panel can be closed completely; there is an info
    button to redisplay the project introduction.

    The class `closed` is used to indicate the panel is closed
    (hidden on mobile, display introduction on desktop); the class
    `show-details` is used to indicate whether leaf details are visible or not.

    */

  constructor() {
    // get a reference to the panel element
    this.el = document.querySelector("#leaf-details");
    this.infoButton = document.querySelector("header .info");
    this.bindHandlers();
  }

  open(showDetails = true) {
    // open the panel; show leaf details by default
    // disable the info button
    document.body.dataset.panelvisible = true;

    let container = this.el.parentElement;
    if (showDetails) {
      container.classList.add("show-details");
    } else {
      // when show details is not true, ensure leaf details are hidden
      container.classList.remove("show-details");
    }
    container.classList.remove("closed");
    // disable the info button; inactive when the intro is visible
    this.infoButton.disabled = true;

    // fixme: doesn't work ?
    document.body.dataset.panelvisible = true;
  }

  close(closeDetails = true) {
    // close the intro and enable the info button
    // by default, closes panel entireuly
    let container = this.el.parentElement;
    // determine if leaf details are currently displayed
    let leafVisible = container.classList.contains("show-details");

    // if leaf details are visible and close details is true,
    // deselect the leaf currently displayed, close that also,
    // unless closeDetails has been disabled;
    // (has a side effect of also removing any currently selected tag)
    if (leafVisible && closeDetails) {
      container.classList.remove("show-details");
      Leaf.closeLeafDetails();
      this.el.dispatchEvent(PanelCloseEvent);
    }

    // if we are closing everything or no leaf is visible, close the panel
    if (closeDetails || !leafVisible) {
      container.classList.add("closed");
      // update attribute on body to control overflow behavior
      document.body.dataset.panelvisible = false;
    }

    // enable the info button;
    // provides a way to get back to the intro on mobile
    this.infoButton.disabled = false;
  }

  showIntro() {
    // showing the intro implies closing leaf details (if a leaf is selected)
    Leaf.closeLeafDetails();
    this.el.dispatchEvent(PanelCloseEvent);
    // open the panel without showing leaf details section
    this.open(false);
  }

  closeIntro() {
    // close the panel without closing leaf details
    this.close(false);
  }

  bindHandlers() {
    // bind click event handler for panel close button
    document
      .querySelector("aside .close")
      .addEventListener("click", this.close.bind(this));

    this.infoButton.addEventListener("click", this.showIntro.bind(this));

    let container = this.container;

    // bind a delegated click handler to handle scrolling on fotnote links
    const asideContainer = document.querySelector("aside");
    asideContainer.addEventListener(
      "click",
      this.handleFootnoteLinkClick.bind(this)
    );

    // bind keyboard handler

    // Also allow Escape key to close window
    // Along with (potentially) other keyboard commands

    // TODO: move this to the timetree code
    // check the document.activeElement for focus
    // bind enter & space to leaf click when focused

    document.onkeydown = function (evt) {
      // Get event object
      evt = evt || window.event;

      // Keypress switch logic
      switch (evt.key) {
        // Escape key
        case "Escape":
        case "Esc":
          // Closes the detail panel
          // fixme: panel ref is broken here
          panel.close();
          break;

        // ... Add other cases here for more keyboard commands ...

        // Otherwise
        default:
          return; // Do nothing
      }
    };
  }

  handleFootnoteLinkClick(event) {
    // control scrolling for footnote links, since on mobile
    // in some browsers it scrolls the entire page rather than the article div
    let element = event.target;
    if (
      element.tagName == "A" &&
      (element.classList.contains("footnote-ref") ||
        element.classList.contains("footnote-backref"))
    ) {
      event.preventDefault();
      event.stopPropagation();
      let ref = element.getAttribute("href").slice(1);
      let el = document.getElementById(ref);
      el.closest("article").scrollTop = el.offsetTop - 70;
    }
  }
}

export { Panel };
