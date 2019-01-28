# Project Excalibur: Chromium-powered HKUST SIS Crawler
> The ultimate weapon against ever changing, hard to reverse-engineer crawling targets

This project is an experiment to see whether we should deploy headless chrome at [USThing](https://github.com/USThing), so as to reduce workload on reverse engineering and long term maintainence. The product, if successful, could replace our current php-based ~~spaghetti-ish~~ SIS crawler.

## THIS IS STILL WIP!

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
  - [x] Cookie forwarding: working except cas cookie expires after session, so program info breaks on 2nd request
  - [ ] 2FA remember me: somehow can't tick the box on chrome, investigation needed
- [ ] Benchmarks vs current crawler
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
```sh
$ serverless deploy # you will need to setup an aws account and serverless client beforehand
```

### Web API
#### GET /:scopes
- list of requested data scopes
- separated by `+`, e.g. `/grades+program_info`
- valid scopes: `all`, `grades`, `program_info`, `schedule` (more to come)
#### GET /login
- *this endpoint is unnecessary for vanilla usage, request `/:scopes` directly with auth headers set.*
- special endpoint for AWS Lambda usage, where timeout is limited to 29s (just enough for login/2FA step alone)
- return response immediately after login (with forwarded cookies to preserve login state)
- actual data requests can be done in subsequent requests
#### Auth
- pass username and password via `X-Excalibur-Username` and `X-Excalibur-Password`
- 2FA approval on duo app required during first request
- cookies received from source sites are forwarded so login state is retained
- for `program_info` scope, cookie forwarding is not working due to short-lived cas cookies. fresh login is required.
#### Parameters
##### course_status
- filter for `schedule` scope
- possible values: `enrolled`, `dropped`, `waitlisted`
- separated by `+`, e.g. `/schedule?course_status=enrolled+waitlisted`
- default: `enrolled`

### Config
- add credenitals to `config.sample.json` and rename the file to `config.json`, this was for debugging until a web api is developed

## Contributing
- Open Issue -> Discussion -> Pull Request -> Merge after Review -> Our world made better :)
- Please use StandardJS linting and async-await

## License
Open sourced under MIT License

Seriously, good luck on creating a "smart campus" without open data (yes i'm looking at you dear ISO staff and uni management) Bureaucracy and paperwork is ~never~ probably not the way to promote innovation :)
