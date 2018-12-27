# Project Excalibur
> The ultimate weapon against ever changing crawling targets

This project is an experiment to see whether we can deploy headless chrome in our web crawler development workflow, so as to reduce workload on reverse engineering and long-term maintainence. The product, if successful, could replace our current php-based ~~spaghetti-ish~~ SIS crawler.

## TODO
- [ ] Page Crawling Logic
  - [x] Login
  - [ ] Courses
  - [ ] Exams
  - [ ] Grades
- [ ] Data Parsing and Web API
  - [ ] Login
  - [ ] Courses
  - [ ] Exams
  - [ ] Grades

## Usage
### Setup
```sh
$ npm i
$ npm run build
```
### Config
- add credenitals to `config.sample.json` and rename the file to `config.json`, this is for debugging until a web api is developed