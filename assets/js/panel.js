import { Leaf } from "./leaves";

class Panel {
  /*
    The panel is used to display the project introduction on page load
    and leaf details as leaves are selected.
    On desktop, leaf details can be closed but the panel is always visible.
    On mobile, the panel can be closed completely; there is an info
    button to redisplay the project introduction.

    The class `closed`` is used to indicate the panel is closed
    (hidden on mobile, display introduction on desktop); the class
    `show-details` is used to indicate whether leaf details are visible or not.`

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
    let container = this.el.parentElement;
    if (showDetails) {
      container.classList.add("show-details");
    } else {
      // when show details is not true, ensure leaf details are hidden
      container.classList.remove("show-details");
    }
    container.classList.remove("closed");
    this.infoButton.disabled = true;
  }

  close() {
    // close the panel and enable the info button
    let container = this.el.parentElement;
    container.classList.add("closed");
    this.infoButton.disabled = false;

    // if leaf details are currently displayed, close that also
    // (has a side effect of also removing any currently selected tag)
    if (container.classList.contains("show-details")) {
      container.classList.remove("show-details");
      Leaf.closeLeafDetails();
    }
  }

  showIntro() {
    // special case: showing the intro means opening the panel
    // but not showing leaf details section
    this.open(false);
  }

  bindHandlers() {
    // bind click event handler for panel close button
    document
      .querySelector("aside .close")
      .addEventListener("click", this.close.bind(this));

    this.infoButton.addEventListener("click", this.showIntro.bind(this));

    // bind keyboard handler

    // Also allow Escape key to close window
    // Along with (potentially) other keyboard commands
    document.onkeydown = function (evt) {
      // Get event object
      evt = evt || window.event;

      // Keypress switch logic
      switch (evt.key) {
        // Escape key
        case "Escape":
        case "Esc":
          // Closes the detail panel
          panel.close();
          break;

        // ... Add other cases here for more keyboard commands ...

        // Otherwise
        default:
          return; // Do nothing
      }
    };
  }
}

export { Panel };
