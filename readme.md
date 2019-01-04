# Project Excalibur: Chromium-powered SIS Crawler
> The ultimate weapon against ever changing, hard to reverse-engineer crawling targets

This project is an experiment to see whether we should deploy headless chrome in our web crawler development workflow, so as to reduce workload on reverse engineering and long term maintainence. The product, if successful, could replace our current php-based ~~spaghetti-ish~~ SIS crawler.

## TODO
- [ ] Page Crawling Logic
  - [x] Login
  - [ ] Courses
  - [ ] Exams
  - [x] Grades
  - [x] Program Information
- [ ] Data Parsing and Web API
  - [x] Login
  - [ ] Courses
  - [ ] Exams
  - [x] Grades
  - [x] Program Information
- [ ] Quality of Life
  - [x] Cookie forwarding: working except cas cookie expires after session, so program info breaks on 2nd request
  - [ ] 2FA remember me: somehow can't tick the box on chrome, investigation needed
- [ ] Benchmarks vs current crawler
- [ ] Docker Image
- [ ] Lambda Function Friendliness
- [ ] CLI Interface

## Usage
### Setup
```sh
$ npm i
$ npm run dev
```
### Web API
#### GET /:scope
- pass list of requesting data scopes separated by comma, e.g. `/grades,program_info`
- valid scopes: `grades`, `program_info`
#### Auth
- pass username and password via Basic Auth header (use https on prod!)
- 2FA approval on duo app required
### Config
- add credenitals to `config.sample.json` and rename the file to `config.json`, this is for debugging until a web api is developed

## Contributing
- Open Issue -> Discussion -> Pull Request -> Merge after Review -> Our world made better :)
- Please use StandardJS linting and async-await

## License
Open sourced under MIT License
