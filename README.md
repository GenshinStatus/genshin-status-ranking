# Genshin Status Ranking
## Introduction
This API is a ranking API developed for [Genshin-Status-Bot](https://github.com/CinnamonSea2073/Genshin-Discordbot), a service that allows users to generate cards based on the status of a character in Genshin Impact.
It works only with Cloudflare Workers and D1 Database and does not depend on anything else.

## Usage
### Generate a Ranking Card
POST `/api/gen_ranking`
- @param
	- uid: number
	- hp: number
	- attack: number
	- defense: number
	- element_mastery: number
	- critical_percent: number
	- critical_hurt_percent: number
	- element_charge_efficiency_percent: number
	- element_hurt_percent: number

### Get Ranking Lists
GET `/api/get_ranking`

### Get Ranking Data
GET `/api/get_report`
