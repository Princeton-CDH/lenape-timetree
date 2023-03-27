# Contributing to Lenape Princeton Timetree

## Content editing

Content for this site can be edited on GitHub or locally, if you are
comfortable working with git and hugo. For local editing, first follow
the setup instructions in the [README](README.md).

All edits should be made on the `develop` branch so they can be reviewed
before being published on the main site. Using pull requests for edits
is recommended.

### Add and edit leaves

Leaf content is stored in [content/leaves][content/leaves]. Each leaf
is represented by a single Markdown file with yaml metadata for
sort and display dates, branch, title, and tags.

To add a new leaf, create a new file in the leaves directory; the filename
shoud be in "slug" format (lower case only, words separated by hyphens)
based on the leaf title, and ending in `.md`. For example, if the leaf
title is **Assunpink Trail** the filename should be `assunpink-trail.md`.
Shorter filenames are preferable; if a leaf has both short and full titles,
use the shorter title for the filename.

Add leaf metadata in this format at the top of the file:

```
---
branch:
display_date:
sort_date:
tags:
  - tag1
  - tag2
title:
display_title:
---
```

Display title is optional, and can be used to set a shorter title for display
in the timetree while using a longer, more detailed title in the leaf details.
If not specified, title will be used for both and display_title may be omitted.

### Adding images to leaves

To include an image in the detailed description for a leaf:

- Make sure the image file is named something readable and meaningful; preferably lower case only, no symbols or whitespace. It should have an appropriate extension based on the format of the image (e.g., .jpg, .jpeg, .png)
- Upload the image file to the appropriate directory under [assets/images](assets/images),
  based on the branch the leaf belongs to.
- Edit the markdown file for that leaf to add a figure "shortcode" at the desired place in the content. (A shortcode is a snippet of code in a content file that calls a custom template. See the [Hugo documentation on shortcodes](https://gohugo.io/content-management/shortcodes/) for more details.)
  Specify the path to the image relative to the `assets` directory. Add alternate text to briefly describe the image as used in context.

```
{{< figure src="images/branch/filename.jpg" alt="..." caption="..." attr="..." attrlink="..." >}}
```

Every image _must_ include alternate text, unless it is purely decorative.
For more information about how to write alternate text for images,
see the instructions in the [contributor guides for Startwords](https://startwords.cdh.princeton.edu/guides/style-guide/#images)

Images _may_ include `caption` text. 

To document the source of the image, use `attr` for attribution text
and `attrlink` for the source url, if available.

If no caption or attribution (source) do not include "=" see below.

```
{{< figure src="images/branch/filename.jpg" alt="..." >}}
```

### Image sizes

Portrait images
Recommended min height 1800px
Absolute min height 864px

Landscape images
Recommended min width 1440px
Absolute min width 700px

NOTE: When cropping a portrait image your image may become too narrow with respect to the recommended min height (1800px), therefore try to stick to a portrait 16:9 ratio.

