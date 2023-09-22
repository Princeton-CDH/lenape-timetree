/* mixin for keypress management */

import { select, selectAll } from "d3-selection";
// combine into d3 object for convenience
const d3 = {
  select,
  selectAll,
};

// mixin extends syntax from
// https://blog.bitsrc.io/inheritance-abstract-classes-and-class-mixin-in-javascript-c636ac00f5a9

const TimeTreeKeysMixin = (Base) =>
  class extends Base {
    bindKeypressHandler() {
      // make panel object available in event handler context
      let panel = this.panel;

      document.onkeydown = function (evt) {
        // Get event object
        evt = evt || window.event;

        // Keypress switch logic
        switch (evt.key) {
          // Escape key closes the panel
          case "Escape":
          case "Esc":
            panel.close();
            break;

          // Enter or space key activates focused element with button role
          case "Enter":
          case " ":
            // if target element has role=button (i.e. leaves in the tree),
            // trigger click behavior
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
    }
  };

export { TimeTreeKeysMixin };
