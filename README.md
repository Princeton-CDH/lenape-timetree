# Princeton Lenape Timetree

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Hugo](https://img.shields.io/badge/hugo-0.101-blue.svg)](https://gohugo.io)
![Node version](https://img.shields.io/badge/node-18-blue)
[![visual regression testing](https://percy.io/static/images/percy-badge.svg)](https://percy.io/2cf28a24/lenape-timetree)



## scripts

Setup for running python script:

- Recommended: create and activate a python 3.7 or higher virtualenv

- Install required python dependencies:
```sh
pip install -r requirements/dev.txt
```

- Run the script to parse input text files and generate Hugo content files.
Provide a list of all text files to be imported.

```sh
./scripts/parse_text.py Leaf\ Data\ -\ *.txt
```
