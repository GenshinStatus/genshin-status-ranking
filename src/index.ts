import { Hono } from "hono";
import { Env as BaseEnv } from "hono/dist/types/types";

type Env = BaseEnv & {
	DB: D1Database;
}
const app = new Hono<Env>();
const genshinImageApiUrl = "https://genshin-status-api-dev.cinnamon.works";

/*
	ランキングの生成 POST /api/gen_ranking
	@param uid: number, hp: number, attack: number, defense: number, element_mastery: number, critical_percent: number, critical_hurt_percent: number, element_charge_efficiency_percent: number, element_hurt_percent: number
*/
app.get("/api/gen_ranking/:uid",  async (c) => {
	const uid: number = Number(c.req.param("uid"));
	let nickname: string  = "";

	// ユーザーのデータをimageAPIから取得
	const user: any = await fetch(`${genshinImageApiUrl}/status/uid/${uid}`);
	const data: any = await user.json();
	nickname = data.nickname;

	const characters = data.characters;

	console.log(nickname, uid, data.level);
	console.log("characterId", "constellations", "level", "addedHp", "addedAttack", "addedDefense", "criticalRate", "criticalDamage", "chargeEfficiency", "elementalMastery", "elementalName", "elementalValue");
	// キャラクターのデータをDBに追加
	characters.forEach((character: any) => {
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

	});

});

export default app;
