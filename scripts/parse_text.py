#!/usr/bin/env python

# pip install pyyaml

import sys
import os.path

import yaml


def parse_file(filepath):
    datapoints = []

    # branch can be inferred from filename
    base_filename = os.path.splitext(os.path.basename(filepath))[0]
    branch = base_filename.split("-")[1].strip()

    with open(filepath) as inputfile:
        data = {}
        for line in inputfile:
            # strip whitespace before processing
            line = line.strip()

            # blank line indicates section break; save any parsed data
            if line == "":
                if data:
                    # add the branch label before saving
                    data["branch"] = branch
                    datapoints.append(data)
                    data = {}

            elif ":" in line:
                label, value = line.split(":")
                # convert readable label to data variable

                label = label.strip().lower().replace(" ", "_")
                value = value.strip()

                # records may include a colon in the text; if the label
                # is not one we know about, assume the line is text
                if label not in [
                    # "branch",
                    "display_date",
                    "sort_date",
                    "tags",
                    "title",
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
        # not all records have them yet
        title = data.get("title", "")
        # TODO: slugify method? or use a library?
        slug = title.lower().replace(" ", "-").replace(".", "").replace(",", "")
        if not slug:
            # use index + offset as fallback filename for now
            slug = "%s-leaf" % (i + offset)

        with open("content/leaves/%s.md" % slug, "w") as outfile:
            # remove text from the dictionary
            text = data.pop("text")
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
