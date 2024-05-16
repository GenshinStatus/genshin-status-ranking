# Genshin Status Ranking
## Introduction
This API is a ranking API developed for [Genshin-Status-Bot](https://github.com/CinnamonSea2073/Genshin-Discordbot), a service that allows users to generate cards based on the status of a character in Genshin Impact.
It works only with Cloudflare Workers and D1 Database and does not depend on anything else.

## Usage
### Generate a Ranking Card
GET `/api/gen_ranking/:uid`

### Get Ranking Lists
GET `/api/get_ranking`

### Get Ranking Data
GET `/api/get_report`
