# Princeton Lenape Timetree



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
