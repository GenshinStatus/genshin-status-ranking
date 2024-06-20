# Genshin Status Ranking
## Introduction
This API is a ranking API developed for [Genshin-Status-Bot](https://github.com/CinnamonSea2073/Genshin-Discordbot), a service that allows users to generate cards based on the status of a character in Genshin Impact.
It works only with Cloudflare Workers and D1 Database and does not depend on anything else.

## Usage
### Generate a Ranking Card
GET `/api/gen_ranking/:sortKey/:uid`
- `sortKey`: The key to sort the ranking. Available keys are `all`, `constellations`, `level`, `added_hp`, `added_attack`, `added_defense`, `critical_rate`, `critical_damage`, `charge_efficiency`, `elemental_mastery`, `elemental_value`.
- `uid`: The user ID to generate the ranking card.

If `all` is specified, the ranking is calculated based on the average of all elements. Basically, it is recommended to specify `all`.

#### Response
```json
{
    "status": "success",
    "message": "Ranking Generated",
    "ranking": [
        {
            "uid": [uid here],
            "character_id": 10000089,
            "constellations": 0,
            "level": 90,
            "added_hp": 24847,
            "added_attack": 532,
            "added_defense": 100,
            "critical_rate": 48.7,
            "critical_damage": 125.4,
            "charge_efficiency": 195.6,
            "elemental_mastery": 128,
            "elemental_name": Ice,
            "elemental_value": 0.466,
            "ranking": 1,
            "updated_at": "2024-06-20 17:09:27",
            "created_at": "2024-06-20 17:09:27",
            "all_users_count": 3,
            "all_characters_count": 8
        },
		...
	]
}
```
