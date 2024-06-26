DROP TABLE IF EXISTS userdata;
CREATE TABLE userdata (
    uid INTEGER PRIMARY KEY AUTOINCREMENT,
	nickname TEXT NOT NULL,
	level INTEGER NOT NULL,
	world_level INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime'))
);

DROP TABLE IF EXISTS characters;
CREATE TABLE characters (
	character_id INTEGER PRIMARY KEY,
	uid INTEGER NOT NULL,
	constellations INTEGER NOT NULL,
	level INTEGER NOT NULL,
	added_hp INTEGER NOT NULL,
	added_attack INTEGER NOT NULL,
	added_defense INTEGER NOT NULL,
	critical_rate INTEGER NOT NULL,
	critical_damage INTEGER NOT NULL,
	charge_efficiency INTEGER NOT NULL,
	elemental_mastery INTEGER NOT NULL,
	elemental_name TEXT NULL,
	elemental_value INTEGER NULL,
	created_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
	updated_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
	FOREIGN KEY (uid) REFERENCES userdata(uid)
);
