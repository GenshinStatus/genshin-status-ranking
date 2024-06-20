import { Hono } from "hono";
import { Env as BaseEnv } from "hono/dist/types/types";
import { Context } from "vitest";

type Env = BaseEnv & {
	DB: D1Database;
}
const app = new Hono<Env>();
const genshinImageApiUrl = "https://genshin-status-api-dev.cinnamon.works";

/*
	ランキングの生成 POST /api/gen_ranking
	@param uid: number, hp: number, attack: number, defense: number, element_mastery: number, critical_percent: number, critical_hurt_percent: number, element_charge_efficiency_percent: number, element_hurt_percent: number
*/
app.get("/api/gen_ranking/:sortKey/:uid",  async (c) => {
	const sortKey: string = c.req.param("sortKey");
	const uid: number = Number(c.req.param("uid"));
	let nickname: string;
	let level: number;
	let worldLevel: number;

	// ソートキーがcharactersに存在しない場合
	if(sortKey != "all" && sortKey != "constellations" && sortKey != "level" && sortKey != "added_hp" && sortKey != "added_attack" && sortKey != "added_defense" && sortKey != "critical_rate" && sortKey != "critical_damage" && sortKey != "charge_efficiency" && sortKey != "elemental_mastery" && sortKey != "elemental_value") {
		return c.json({ status: "error", message: "Invalid Sort Key" });
	}
	/*
	*==============
	*　各パラメタの
	*==============
	* all : 総合平均算出
	* constellations : コンステレーション
	* level : レベル
	* added_hp : 追加HP
	* added_attack : 追加攻撃力
	* added_defense : 追加防御力
	* critical_rate : クリティカル率
	* critical_damage : クリティカルダメージ
	* charge_efficiency : 元素チャージ効率
	* elemental_mastery : 元素熟知
	* elemental_value : 元素ダメージ
	*/

	// ユーザーのデータをimageAPIから取得
	const user: any = await fetch(`${genshinImageApiUrl}/status/uid/${uid}`);
	const data: any = await user.json();
	nickname = data.nickname;
	level = data.level;
	worldLevel = data.world_level;

	const characters = data.characters;

	console.log(nickname, uid, data.level);
	//console.log("characterId", "constellations", "level", "addedHp", "addedAttack", "addedDefense", "criticalRate", "criticalDamage", "chargeEfficiency", "elementalMastery", "elementalName", "elementalValue");

	// ユーザーのデータをDBから取得
	const stmt = await c.env.DB.prepare("SELECT * FROM userdata WHERE uid = ?");
	const dbuser = await stmt.bind(uid).all();
	//console.log(dbuser.results);

	if(dbuser.results == null || dbuser.results.length == 0) {
		console.log("user not exist");
		// 存在しない
		try {
			const stmt = await c.env.DB.prepare("INSERT INTO userdata (uid, nickname, level, world_level) VALUES (?, ?, ?, ?)");
			await stmt.bind(uid, nickname, level, worldLevel).run();
		} catch (e: unknown) {
			console.error(e);
			return c.json({ status: "error", message: "Internal Server Error" });
		}
	} else {
		console.log("user exist");
		// 存在する
		try {
			const stmt = await c.env.DB.prepare("UPDATE userdata SET nickname = ?, level = ?, world_level = ?, updated_at = DATETIME('now', 'localtime') WHERE uid = ?");
			await stmt.bind(nickname, level, worldLevel, uid).run();
		} catch (e: unknown) {
			console.error(e);
			return c.json({ status: "error", message: "Internal Server Error" });
		}
	}
	// characterデータが原スタbot側に保持されているか確認
	if (characters == null || characters.length == 0) {
		// キャラクターデータが原神statusAPIに存在しない場合
		return c.json({ status: "error", message: "User Data Not Found" });
	} else {
		// キャラクターデータが原神statusAPIに存在する場合

		// 過去のキャラクターデータがあれば削除
		try {
			const stmt = await c.env.DB.prepare("DELETE FROM characters WHERE uid = ?");
			await stmt.bind(uid).run();
		} catch (e: unknown) {
			console.error(e);
			return c.json({ status: "error", message: "Internal Server Error" });
		}

		// キャラクターのデータをDBに追加
		characters.forEach(async (character: any) => {
			let characterId: number;
			let constellations: number;
			let level: number;
			let addedHp: number;
			let addedAttack: number;
			let addedDefense: number;
			let criticalRate: number;
			let criticalDamage: number;
			let chargeEfficiency: number;
			let elementalMastery: number;
			let elementalName: string;
			let elementalValue: number;

			// 必要データの取得
			characterId = character.id;
			constellations = character.constellations;
			level = character.level;
			addedHp = character.added_hp;
			addedAttack = character.added_attack;
			addedDefense = character.added_defense;
			criticalRate = character.critical_rate;
			criticalDamage = character.critical_damage;
			chargeEfficiency = character.charge_efficiency;
			elementalMastery = character.elemental_mastery;
			elementalName = character.elemental_name;
			if(character.elemental_value != null) elementalValue = Number(character.elemental_value.replace("%", ""))/ 100; else elementalValue = 0;
			console.log(characterId, constellations, level, addedHp, addedAttack, addedDefense, criticalRate, criticalDamage, chargeEfficiency, elementalMastery, elementalName, elementalValue);

			// DBに追加
			try {
				const stmt = await c.env.DB.prepare("INSERT INTO characters (uid, character_id, constellations, level, added_hp, added_attack, added_defense, critical_rate, critical_damage, charge_efficiency, elemental_mastery, elemental_name, elemental_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
				await stmt.bind(uid, characterId, constellations, level, addedHp, addedAttack, addedDefense, criticalRate, criticalDamage, chargeEfficiency, elementalMastery, elementalName, elementalValue).run();
			} catch (e: unknown) {
				console.error(e);
				return c.json({ status: "error", message: "Internal Server Error" });
			}
		});

		// ランキング生成
		const ranking = await genRanking(sortKey, uid, c);
		console.log(ranking);

		if (ranking == null || ranking.length == 0) {
			return c.json({ status: "error", message: "Ranking Generate Error" });
		} else {
			return c.json({ status: "success", message: "Ranking Generated", ranking: ranking });
		}
	}


});

export default app;


// ランキング生成関数
const genRanking = async (sortKey: string, uid: number, c: any) => {
	// ソートキーに応じたクエリを生成
	let query: string;
	if(sortKey == "all") {
		query = "SELECT data.*, (SELECT COUNT(*) FROM userdata) AS all_users_count, (SELECT COUNT(*) FROM characters) AS all_characters_count FROM (SELECT uid, character_id, constellations, level, added_hp, added_attack, added_defense, critical_rate, critical_damage, charge_efficiency, elemental_mastery, elemental_name, elemental_value, DENSE_RANK() over (ORDER BY constellations DESC, level DESC, added_hp DESC, added_attack DESC, added_defense DESC, critical_rate DESC, critical_damage DESC, charge_efficiency DESC, elemental_mastery DESC, elemental_value DESC) AS `ranking`, updated_at, created_at FROM characters) AS data WHERE data.uid = ?";
	} else {
		query = `SELECT data.*, (SELECT COUNT(*) FROM userdata) AS all_users_count, (SELECT COUNT(*) FROM characters) AS all_characters_count FROM (SELECT uid, character_id, constellations, level, added_hp, added_attack, added_defense, critical_rate, critical_damage, charge_efficiency, elemental_mastery, elemental_name, elemental_value, DENSE_RANK() over (ORDER BY ${sortKey} DESC) AS 'ranking', updated_at, created_at FROM characters) AS data WHERE data.uid = ?`;
	}

	try {
		// クエリを実行
		const stmt = await c.env.DB.prepare(query);
		const res = await stmt.bind(uid).all();
		return res.results;
	} catch (e: unknown) {
		console.error(e);
		return c.json({ status: "error", message: "Internal Server Error" });
	}
}
