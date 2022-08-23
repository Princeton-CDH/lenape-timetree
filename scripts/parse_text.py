#!/usr/bin/env python

# pip install pyyaml

import sys

import yaml


def parse_file(filepath):
    datapoints = []

    with open(filepath) as inputfile:
        data = {}
        for line in inputfile:
            # strip whitespace before processing
            line = line.strip()

            # blank line indicates section break; save any parsed data
            if line  == "":
                if data:
                    datapoints.append(data)
                    data = {}

            elif ":" in line:
                label, value = line.split(':')
                # convert readable label to data variable
                label = label.strip().lower().replace(' ', '_')
                value = value.strip()

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
                data['text'] = line

        # add last section to list
        if data:
            datapoints.append(data)

    return datapoints


def generate_leaf_pages(datapoints):
    # expects a list of dictionaries
    for i, data in enumerate(datapoints):
        # TODO: need short names to use for file names & page titles
        title = data.get('title', '')
        slug = title.lower().replace(' ', '-')
        if not slug:
            # use index as fallback for now now
            slug = '%s-leaf' % i

        with open('content/leaves/%s.md' % slug, 'w') as outfile:
            # remove text from the dictionary
            text = data.pop('text')
            # output remaining info as yaml
            yaml.dump(data, explicit_start=True, stream=outfile)
            # then finish the content file with text
            outfile.write('---\n\n%s' % text)



if __name__ ==  "__main__":
    try:
        input_file = sys.argv[1]
    except IndexError:
        print('Input file is required')
        exit(-1)


    datapoints = parse_file(sys.argv[1])
    generate_leaf_pages(datapoints)