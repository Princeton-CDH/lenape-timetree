import { Leaf } from "./leaves";

const PanelCloseEvent = new Event("panel-close");

class Panel {
  constructor() {
    // get a reference to the panel element
    this.el = document.querySelector("#leaf-details");
    this.bindHandlers();
  }

  close() {
    // close the panel
    this.el.parentElement.classList.remove("show-details");
    this.el.parentElement.classList.add("closed");
    Leaf.closeLeafDetails();
    this.el.dispatchEvent(PanelCloseEvent);
  }

  bindHandlers() {
    // bind click event handler for panel close button
    let panel = this;
    document
      .querySelector("aside .close")
      .addEventListener("click", (event) => {
        // Close panel and deselect leaves
        panel.close();
      });

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
