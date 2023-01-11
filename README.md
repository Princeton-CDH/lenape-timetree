# Princeton Lenape Timetree

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Hugo](https://img.shields.io/badge/hugo-0.101-blue.svg)](https://gohugo.io)
![Node version](https://img.shields.io/badge/node-18-blue)
[![visual regression testing](https://percy.io/static/images/percy-badge.svg)](https://percy.io/2cf28a24/lenape-timetree)

# Developer setup

## Install pre-commmit hooks

We use [pre-commit](https://pre-commit.com/) to install and manage commit hooks
to ensure that code is consistently formatted. To install, run:

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

## scripts

Setup for running python script:

- Recommended: create and activate a python 3.7 or higher virtualenv

- Install required python dependencies:

```sh
pip install -r requirements.txt
```

- Run the script to parse input text files and generate Hugo content files.
  Provide a list of all text files to be imported.

```sh
./scripts/parse_text.py Leaf\ Data\ -\ *.txt
```
