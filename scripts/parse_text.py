#!/usr/bin/env python

# see requirements.txt for python dependencies

import os.path
import sys

import yaml
from slugify import slugify


def parse_file(filepath):
    datapoints = []

    with open(filepath) as inputfile:
        data = {}
        for line in inputfile:
            # strip whitespace before processing
            line = line.strip()

            # blank line indicates section break; save any parsed data
            if line == "":
                if data:
                    datapoints.append(data)
                    data = {}

            # skip empty display title with : and no space
            elif line.endswith(":"):
                continue

            # look for colon in first few characters, indicating a labeled field
            elif ": " in line[:20]:
                # only split once
                label, value = line.split(": ", 1)
                # convert readable label to data variable

                label = label.strip().lower().replace(" ", "_")
                value = value.strip()

                # records may include a colon in the text; if the label
                # is not one we know about, assume the line is text
                if label not in [
                    "branch",
                    "display_date",
                    "sort_date",
                    "tags",
                    "title",
                    "display_title",
                ]:
                    data["text"] = line.strip()

                # split tags out into a list
                if label == "tags":
                    # omit empty tags
                    value = [v.strip() for v in value.split(",") if v.strip()]

                # convert tags to numeric when possible
                elif "date" in label:
                    try:
                        value = int(value)
                    except ValueError:
                        pass

                data[label] = value
            # non-empty line without : is text content
            else:
                data["text"] = line

        # add last section to list
        if data:
            datapoints.append(data)

    return datapoints


def generate_leaf_pages(datapoints, offset=0):
    # expects a list of dictionaries
    for i, data in enumerate(datapoints):
        # NOTE: need short names to use for file names & page titles,
        # but not all records have them yet
        # use display title first, if set, since it will be shorter
        title = data.get("display_title", "")
        if not title:
            title = data.get("title", "")
        # slugify title to use as basis for filename
        slug = slugify(title)
        if not slug:
            # use index + offset as fallback filename for now
            slug = "%s-leaf" % (i + offset)

        with open("content/leaves/%s.md" % slug, "w") as outfile:
            # remove text from the dictionary
            try:
                text = data.pop("text")
            except KeyError:
                text = ""  # don't use text from preceeding entry
                print("no text")
                print(data)
            # output remaining info as yaml
            yaml.dump(data, explicit_start=True, stream=outfile)
            # then finish the content file with text
            outfile.write("---\n\n%s" % text)


if __name__ == "__main__":
    input_files = sys.argv[1:]
    if not input_files:
        print("At least one input file is required")
        exit(-1)

    leaf_offset = 0
    # handle multiple input files; use an offset to ensure
    # numeric filenames don't collide
    for infile in input_files:
        print("Processing %s" % infile)
        datapoints = parse_file(infile)
        generate_leaf_pages(datapoints, offset=leaf_offset)
        print("  parsed %d datapoints" % len(datapoints))
        leaf_offset += len(datapoints)
