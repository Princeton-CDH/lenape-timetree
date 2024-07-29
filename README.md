# Lunaapahkiing Princeton Timetree

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.8040363.svg)](https://doi.org/10.5281/zenodo.8040363)
[![DH community code review: v1.0.1, 2023](https://img.shields.io/badge/DHCodeReview-v1.0.1,_2023-green)](https://github.com/DHCodeReview/lenape-timetree/pull/2)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Hugo](https://img.shields.io/badge/hugo-0.117-blue.svg)](https://gohugo.io)
![Node version](https://img.shields.io/badge/node-18-blue)

This repository includes source code for the [CDH-sponsored Lunaapahkiing Princeton Timetree](https://cdh.princeton.edu/projects/lenape-timetree/) (LPT) research project. It consists of a custom Hugo theme, with HTML and JSON templates, JavaScript, SCSS, and other assets. It is used with [Princeton-CDH/lenape-timetree-content](https://github.com/Princeton-CDH/lenape-timetree-content) to build the [Lunaapahkiing Princeton Timetree web application](https://lenapetimetree.indigenous.princeton.edu/).

The timetree javascript code in v1.0.1 of this codebase was [reviewed](https://github.com/DHCodeReview/lenape-timetree/pull/2) by [Cole Crawford](https://github.com/ColeDCrawford) (Senior Software Engineer, Harvard Arts and Humanities Research Computing) and [Raff Viglianti](http://raffviglianti.com/) (Senior Research Software Developer, Maryland Institute for Technology in the Humanities) via [DHTech Community Code Review](https://dhcodereview.github.io/); review was faciliated by [Julia Damerow](https://github.com/jdamerow) (Lead Scientific Software Engineer, Arizona State University).

Note: this project was originally developed in a single git repository; in September 2023 the repository was split out to separate content and code to simplify maintenance and ownership. An archive of the original git repository with the combined history up to that point is available at [Princeton-CDH/lenape-timetree-archive](https://github.com/Princeton-CDH/lenape-timetree-archive).

## License

The software for this project is licensed under the [Apache 2.0 License](LICENSE).

## Developer + contributor setup instructions

For instructions on editing site content, refer to [CONTRIBUTING](CONTRIBUTING.md).
Local setup is not required for content editing.

### Hugo setup

To set the site up locally for development or content editing,
first follow the [instructions to install Hugo](https://gohugo.io/installation/).
You can check that Hugo is installed with:

```sh
hugo version
```

This should result in output something like this:

> hugo v0.101.0+extended darwin/amd64 BuildDate=unknown

Make sure the version you installed is at least as new as the version shown in the Hugo badge at the top of the project readme (this file).

Once hugo is installed, you'll need to install the javascript dependencies that are used to compile the site's javascript and scss resource files. To check if you have node installed:

```sh
node --version
```

This should output a version string that is at least as new as the version shown in the node badge at the top of this file. To install dependencies, run npm in the project's root directory:

```sh
npm install
```

If the install completes without errors, you're ready to run the site locally.

### Serving locally

To run a development server with auto-reload:

```sh
hugo server
```

You should see some debug output, followed by:

> Web Server is available at http://localhost:1313/ (bind address 127.0.0.1)
> Press Ctrl+C to stop

Open a web browser to the above address to see a local version of the site. When you make changes and save files locally, hugo will automatically refresh the page.

## Install pre-commmit hooks

Anyone planning to do development on the site (i.e., contributing to javascript,
scss, or templates), you need to install pre-commit hooks to automatically
ensure that code is consistently formatted. This step is not required
for anyone who is working on site content and not modifying code or templates.

Commit hooks are managed with [pre-commit](https://pre-commit.com/).
To install, run:

```{bash}
pre-commit install
```

Current hooks include [Black](https://github.com/psf/black) for python code formatting, [isort](https://pycqa.github.io/isort/) for standardized python imports, and [Prettier](https://prettier.io/) for javascript, css, markdown, and other supported file types.

Standardized code styles were instituted after some development was done on this project.
To configure `git blame` to ignore the styling commit, use the following:

```{bash}
git blame <FILE> --ignore-revs-file .git-blame-ignore-revs
```

Or configure git to always ignore the styling revision commit:

```{bash}
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

## Developing and testing with timetree content

To do development work on this theme with the corresponding content from this project, check out a copy of the timetree content repository [Princeton-CDH/lenape-timetree-content](https://github.com/Princeton-CDH/lenape-timetree-content). Modify (but do not change) your go modules configuration to run from your local copy of the theme as follows:

```{bash}
go mod edit -replace github.com/Princeton-CDH/lenape-timetree=../lenape-timetree
```

And then run `hugo` from the content repository to build the site.

## Shortcodes

The _timetree_ theme includes the following custom short codes.

### audio

A shortcode for including audio, which takes `src` and `caption` arguments, e.g.

```
{{<audio src="/audio/lunaapahkiing-pronunciation-mosko.mp3" caption="Listen to a pronunciation of *Lunaapahkiing* by Karen Mosko (Lunaape Language Teacher, Munsee-Delaware Nation)" >}}
```

[view source](layouts/shortcodes/audio.html)

### figure

This is a customized version of Hugo's default [figure shortcode](https://gohugo.io/content-management/shortcodes/#figure), adapted from [Startwords](https://github.com/Princeton-CDH/startwords) that rescales raster images using custom breakpoints and displays them with a caption.

**It's highly recommended to use `figure` rather than simple images via Markdown, so that images can be automatically sized and properly styled. Non-`figure` images may not display in a consistent manner.**

You can optionally provide an `attr` to add an attribution to the caption, and `attrlink` will make the attribution a link pointing to the given URL. If you need extra control over the height of the image, you can pass any valid CSS measurement to `max-height`, which will be applied via an inline style.

For assistive technology, an `alt` is required to describe the image. Optionally, you can associate the image with another element containing a visually hidden long description using `desc-id`, which will be the value used for `aria-describedby`.

Simple example:

```
{{< figure src="images/duck.jpg" alt="Rubber duck sitting in a bathtub." >}}
```

Example use for a photograph with attribution:

```
{{< figure src="images/duck.jpg" alt="Rubber duck sitting in a bathtub." caption="Gerald relaxing in the bath." attr="Photo by me." attrlink="http://example.com/" >}}
```

Example use for a chart or graph, with long description:

```
{{< figure src="images/chart.svg" alt="Bar chart showing sales growth for Q1 2020." caption="Sales are improving for our industry." desc-id="chart-desc" >}}
{{< wrap class="sr-only" id="chart-desc">}}Four different economic sectors are represented. The sector showing the most sales growth is the rubber duck industry, with growth approaching 25%.{{</ wrap >}}
```

#### parameters

- `src`, URL of the image in the figure.
- `alt`, text used by assistive technology to describe the content of the figure.
- `caption`, optional: descriptive text to be shown underneath the figure.
- `attr`, optional: attribution text to be shown underneath the figure.
- `attrlink`, optional: URL for making `attr` text a hyperlink.
- `desc-id`, optional: html id of an element containing longer descriptive text.

[view source](layouts/shortcodes/figure.html)

### project citation

A shortcode for generating a project citation based on publication information
in the site and theme config files. Project citation can be generated with or without authors:

```
{{< project_citation noAuthors=true >}}

{{< project_citation >}}
```

The citation uses the site title, and authors, version, publisher, publication date, and citation url from the site config. Authors should be listed in "Lastname, Firstname" format. For example:

```yaml
authors:
  - Lastname, First
  - Lastname, First
  - Lastname, First
publisher: Some group
publication_date: 2023
citation_url: https://project.example.edu/
```

[view source](layouts/shortcodes/project_citation.html)

### panel legend

This is a custom shortcode used to generate the branch legend in the opening panel of the timetree. Branches must be configured in site parameters.

[view source](layouts/shortcodes/panel-legend.html)
