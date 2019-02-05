# Project Excalibur: Serverless, Chromium-powered HKUST SIS Scraper

[![USThing](https://badgen.net/badge/%E2%99%A5/USThing/blue)](https://github.com/USThing)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

> The ultimate weapon against ever changing, hard to reverse-engineer scraping targets

This personal project is an experiment to see whether headless chrome and serverless architecture could be deployed at USThing, so as to reduce workload on reverse engineering and long term maintainence. The product, if successful, could replace our current php-based ~~spaghetti-ish~~ SIS scraper. 

## TODO
- [ ] Page Crawling Logic
  - [x] Login
  - [x] Courses
  - [ ] Exams
  - [x] Grades
  - [x] Program Information
- [ ] Data Parsing and Web API
  - [x] Login
  - [x] Courses
  - [ ] Exams
  - [x] Grades
  - [x] Program Information
- [ ] Quality of Life
  - [x] Cookie forwarding: working except cas cookie expires after session, so `program_info` breaks on 2nd request
  - [ ] 2FA remember me: somehow can't tick the box on chrome, investigation needed
- [x] Benchmarks vs current scraper
- [ ] Docker Image
- [x] Serverless Config
- [ ] CLI Interface

## Usage
### Local Development / Trial
```sh
$ npm i
$ npm run dev
```
### Deploy to AWS
- Deploys to ap-southeast-1 (Singapore) 512MB ram lambda instances
- You will need to create an aws account (free tier?) and setup serverless client beforehand
```sh
$ serverless deploy
```

### REST API
#### GET /:scopes
- list of requested data scopes
- separated by `+`, e.g. `/grades+program_info`
- valid scopes: `all`, `grades`, `program_info`, `schedule` (more to come)
##### Parameters
###### course_status
- filter for `schedule` scope
- possible values: `enrolled`, `dropped`, `waitlisted`
- separated by `+`, e.g. `/schedule?course_status=enrolled+waitlisted`
- default: `enrolled`
#### GET /login
- **this endpoint is unnecessary for vanilla usage,** request `/:scopes` directly with auth headers set.
- special endpoint for AWS Lambda usage, where timeout is limited to 29s (just enough for login/2FA step alone)
- return response immediately after login (with forwarded cookies to preserve login state)
- actual data requests can be done in subsequent requests
#### Authenication
- pass itsc username and password via `X-Excalibur-Username` and `X-Excalibur-Password` headers
- 2FA approval on duo app required during first request
- cookies received from source sites are forwarded so login state is retained
- for `program_info` scope, cookie forwarding is not working due to short-lived cas cookies. fresh login is required.


### Config
- this was for debugging before web api is developed, leaving it here for possible cli development
- add credenitals to `config.sample.json` and rename the file to `config.json`

## Benchmarks
The following benchmark was measured from an off-campus location. Excalibur instance was hosted on AWS Lambda in Tokyo and PHP API was hosted on USThing server at HKUST campus (with Cloudflare CDN in between, ~5ms taken)

(Note: Appearently Singapore region has better ping to HK, will revisit this later)

|  |Excalibur|  |  |  |PHP API  |  |  |  |
|--|---------|--|--|--|---------|--|--|--|
|(response time in ms)|run 1|run 2|run 3|mean|run 1|run 2|run 3|mean|
|Ping|55.469|57.405|56.426|56.433|7.201|6.431|6.541|6.724|
|Login with cookie cached|3016|5937|3066|4006.333|2622|2679|2224|2508.333|
|Timetable|7677|7321|7107|7368.333|816|893|850|853|
|Grades|14713|14866|14375|14651.333|838|861|753|817.333|

### Discussion
- compared to php-based api, excalibur responses were much slower especially in Grades
- this is probably due to time consumed by real browser rendering and lack of result caching (PHP API cache past grades for quick re-access)
- another major factor is the physical distance between AWS datacenters and Hong Kong, where the performance penalty were multiplied by number of pages fetched
- further enhancements can be done on Excalibur e.g. filters for fetching data of latest semester only (useful for grades / waitlist refresh; or in the use case of USThing past data were stored on client)
- TODO: re-run benchmarks for Excalibur on a local server

## Contributing
- Open Issue -> Discussion -> Pull Request -> Merge after Review -> Our world made better :)
- Please use StandardJS linting and async-await

## License
Open sourced under MIT License
