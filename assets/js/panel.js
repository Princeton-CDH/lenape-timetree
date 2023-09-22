import { select, selectAll } from "d3-selection";

import { Leaf } from "./leaves";

// combine into d3 object for convenience
const d3 = {
  select,
  selectAll,
};

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
    this.container = this.el.parentElement;
    this.infoButton = document.querySelector("header .info");
    this.bindHandlers();
    // aria live container for updates in status
    this.status = this.container.querySelector("[role=status]");
  }

  open(showDetails = true) {
    // on mobile, ensure the body is scrolled to the top before opening
    window.scrollTo(0, 0);

    // open the panel; show leaf details by default
    // disable the info button
    document.body.dataset.panelvisible = true;

    // when show details is not true, ensure leaf details are hidden
    d3.select(this.container)
      .classed("show-details", showDetails)
      .classed("closed", false);

    // disable the info button; inactive when the intro is visible
    this.infoButton.disabled = true;

    // transfer focus to the panel
    this.container.querySelector("#panel").focus();

    // fixme: doesn't work ?
    document.body.dataset.panelvisible = true;
  }

  get detailsVisible() {
    return this.container.classList.contains("show-details");
  }

  close(closeDetails = true) {
    // close the intro and enable the info button
    // by default, closes panel entireuly

    // determine if leaf details are currently displayed
    // use dataset.showing ?
    let leafVisible = this.detailsVisible;

    // if leaf details are visible and close details is true,
    // deselect the leaf currently displayed, close that also,
    // unless closeDetails has been disabled;
    // (has a side effect of also removing any currently selected tag)
    if (leafVisible && closeDetails) {
      this.container.classList.remove("show-details");
      // clear out stored value for loaded url
      delete this.el.dataset.showing;
      this.el.dispatchEvent(PanelCloseEvent);
    }

    // if we are closing everything or no leaf is visible, close the panel
    if (closeDetails || !leafVisible) {
      this.container.classList.add("closed");
      // update attribute on body to control overflow behavior
      document.body.dataset.panelvisible = false;
    }

    // enable the info button;
    // provides a way to get back to the intro on mobile
    this.infoButton.disabled = false;
  }

  showIntro() {
    // dispatch panel-close event;
    // handler in leaf code will close leaf details
    // (showing the intro implies closing leaf details if a leaf is selected)
    this.el.dispatchEvent(PanelCloseEvent);
    // open the panel without showing leaf details section
    this.open(false);
  }

  closeIntro() {
    // close the panel without closing leaf details
    this.close(false);
  }

  announce(content) {
    // update the contents of the aria live region
    // to make polite announcements for screen reader users
    this.status.textContent = content;
  }

  loadURL(url, callback) {
    // load specified url; display article contents in the panel
    // takes an optional callback; if defined, will be applied to
    // the url contents before inserting

    // if the requested url is already showing, do nothing
    if (this.el.dataset.showing && this.el.dataset.showing == url) {
      return;
    }
    // If you need to test load failure, uncomment this
    // if (Math.random() < 0.5) {
    //   url = url + "xxx";
    // }
    // console.log("fetching:", url);

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          return Promise.reject(response);
        }
        return response;
      })
      .then((response) => response.text())
      .then((html) => {
        let parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        // Get the article content and insert into panel
        const article = doc.querySelector("article");
        if (callback != undefined) {
          callback(article);
        }
        this.el.querySelector("article").replaceWith(article);
        // store loaded url in data attribute for reload check
        this.el.dataset.showing = url;
      })
      .catch((response) => {
        // if the request failed, display error article
        let errorArticle = document.querySelector("#loaderror").cloneNode(true);
        this.el.querySelector("article").replaceWith(errorArticle);
      });

    // scroll to the top, in case previous leaf was scrolled
    this.el.scrollTop = 0;

    // ensure the panel is open with details shown
    this.open();
  }

  bindHandlers() {
    // bind click event handler for panel close button
    document
      .querySelector("aside .close")
      .addEventListener("click", this.close.bind(this));

    this.infoButton.addEventListener("click", this.showIntro.bind(this));

    // bind a delegated click handler to handle scrolling on footnote links
    const asideContainer = document.querySelector("aside");
    asideContainer.addEventListener(
      "click",
      this.handleFootnoteLinkClick.bind(this)
    );
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
