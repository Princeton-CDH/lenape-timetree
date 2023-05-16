/* mixin for keypress management */

import { select, selectAll } from "d3-selection";
// combine into d3 object for convenience
const d3 = {
  select,
  selectAll,
};

let timetreeKeys = {
  // assumes access to panel object via timetree

  bindKeypressHandler() {
    document.onkeydown = function (evt) {
      // Get event object
      evt = evt || window.event;

      // Keypress switch logic
      switch (evt.key) {
        // Escape key closes the panel
        case "Escape":
        case "Esc":
          // Closes the detail panel
          this.panel.close();
          break;

        // enter or space key activate button-like elements
        case "Enter":
        case " ":
          // if target element has role=button (i.e. leaves in the tree),
          // trigger click behavior when activated
          if (evt.target.getAttribute("role", "button")) {
            d3.select(evt.target).dispatch("click");
          }
          break;

        // ... Add other cases here for more keyboard commands ...

        // Otherwise
        default:
          return; // Do nothing
      }
    };
  },
};

export { timetreeKeys };
