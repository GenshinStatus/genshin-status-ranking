DROP TABLE IF EXISTS userdata;
CREATE TABLE userdata (
    uid INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
    hp NUMBER NOT NULL,
	attack NUMBER NOT NULL,
	defense NUMBER NOT NULL,
	element_mastery NUMBER NOT NULL,
	critical_percent NUMBER NOT NULL,
	critical_hurt_percent NUMBER NOT NULL,
	element_charge_efficiency_percent NUMBER NOT NULL,
	element_hurt_percent NUMBER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime'))
);
