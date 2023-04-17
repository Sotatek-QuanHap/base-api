## Framework

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Requirment

- [node v16.15.1](https://nodejs.org/dist/v16.15.1/)
- npm 
- [yarn](https://classic.yarnpkg.com/lang/en/docs/)
- [docker](https://docs.docker.com/engine/install/)
- [docker-compose](https://docs.docker.com/compose/install/)

## Installation

```bash
# setup env

$ cp .env.default .env

# change content of .env file

# install liblaries
$ yarn

# init env
$ docker-compose up -d
```

## Running the app

```bash
# development
$ yarn start:dev
```
## Access database

- connect with [phpmyadmin](http://localhost:8156)
```
username: root
password: config at .env file with field 'DB_ROOT'
```


## Migrate db

```bash
# migrate
$ npx prisma migrate dev
```

## Generate prisma
```bash
# generate
$ npx prisma generate
```
## License

Nest is [MIT licensed](LICENSE).
