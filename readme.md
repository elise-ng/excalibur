# Project Excalibur
> The ultimate weapon against ever changing crawling targets

This project is an experiment to see whether we can deploy headless chrome in our web crawler development workflow, so as to reduce workload on reverse engineering and long-term maintainence. The product, if successful, could replace our current php-based ~~spaghetti-ish~~ SIS crawler.

## TODO
- [ ] Page Crawling Logic
  - [x] Login
  - [ ] Courses
  - [ ] Exams
  - [x] Grades
  - [ ] Program Information
- [ ] Data Parsing and Web API
  - [x] Login
  - [ ] Courses
  - [ ] Exams
  - [x] Grades
  - [x] Program Information
- [ ] Quality of Life
  - [ ] Cookie forwarding: working except cas cookie expires after session
  - [ ] 2FA remember me: somehow can't tick the box on chrome, investigation needed
- [ ] Benchmarks vs current crawler
- [ ] CLI Interface

## Usage
### Setup
```sh
$ npm i
$ npm run dev
```
### Web API
#### Endpoint /:scope
- pass list of required data scopes separated by comma, e.g. `/grades,program_info`
- valid scopes: `grades`, `program_info`
#### Auth
- pass username and password via Basic Auth header (use https on prod!)
- 2FA approval on duo app required
### Config
- add credenitals to `config.sample.json` and rename the file to `config.json`, this is for debugging until a web api is developed