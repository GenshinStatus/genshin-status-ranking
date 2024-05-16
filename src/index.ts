import { Hono } from "hono";
import { Env as BaseEnv } from "hono/dist/types/types";

type Env = BaseEnv & {
	DB: D1Database;
}

const app = new Hono<Estringnv>();


/*
	ランキングの生成 POST /api/gen_ranking
	@param uid: number, hp: number, attack: number, defense: number, element_mastery: number, critical_percent: number, critical_hurt_percent: number, element_charge_efficiency_percent: number, element_hurt_percent: number
*/
app.get("/api/gen_ranking/:uid",  async (c) => {
	const uid:number = Number(c.req.param("uid"));
	let nickname: string  = "";
	let hp: number = 0;
	let attack: number = 0;
	let defense: number = 0;
	let element_mastery: number = 0;
	let critical_percent: number = 0;
	let critical_hurt_percent: number = 0;
	let element_charge_efficiency_percent: number = 0;
	let element_hurt_percent: number = 0;

	// ユーザーのデータを取得
	const averageData = await getAverageStatus(uid);
	console.log(averageData);
	nickname = averageData.nickname;
	hp = averageData.hp;
	attack = averageData.attack;
	defense = averageData.defense;
	element_mastery = averageData.element_mastery;
	critical_percent = averageData.critical_percent;
	critical_hurt_percent = averageData.critical_hurt_percent;
	element_charge_efficiency_percent = averageData.element_charge_efficiency_percent;
	element_hurt_percent = averageData.element_hurt_percent;

	console.log(uid, hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent);

	// D1Databaseのデータを取得
	const stmt = c.env.DB.prepare("SELECT * FROM userdata WHERE uid = ?");
	const { results } = await stmt.bind(uid).all();
	console.log(results);

	if (results.length === 0) {
		// ユーザーが存在しない
		try {
			// ユーザーのデータを挿入
			const stmt = await c.env.DB.prepare("INSERT INTO userdata (uid, nickname, hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
			await stmt.bind(uid, nickname, hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent).run();
		} catch (e: unknown) {
			console.log(e);
			return c.json({ status: "error", message: "Internal Server Error" });
		}
	}else {
		// ユーザーは存在する
		const update_at: any = new Date(results[0].updated_at);
		const now: any = new Date();
		console.log(now, update_at);

		if (now - update_at > 3600000) {
			// 1時間以上経過しているデータは更新
			const stmt = await c.env.DB.prepare("UPDATE userdata SET nickname = ?, hp = ?, attack = ?, defense = ?, element_mastery = ?, critical_percent = ?, critical_hurt_percent = ?, element_charge_efficiency_percent = ?, element_hurt_percent = ?, updated_at = DATETIME('now', 'localtime') WHERE uid = ?");
			await stmt.bind(nickname, hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent, uid).run();
		}
	}

	// ランキングの生成
	try {
		// 当該uidの相対ランキングを取得
		const stmt = c.env.DB.prepare("SELECT uid, nickname, hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent, DENSE_RANK() over(ORDER BY hp DESC, attack DESC, defense DESC, element_mastery DESC, critical_percent DESC, critical_hurt_percent DESC, element_charge_efficiency_percent DESC, element_hurt_percent DESC) AS `rank`, updated_at, created_at FROM userdata");
		const allResults = await stmt.all();

		const all_user_count = allResults.length;

		// 取得結果から当該uidを探索
		for (let i = 0; i < allResults.results.length; i++) {
			if (allResults.results[i].uid === uid) {
				// all_user_countの追加
				let data = allResults.results[i];
				data["all_user_count"] = all_user_count;
				return c.json({ status: "success", message: "Ranking Generated", data: data });
			}
		}
	} catch (e: unknown) {
		console.log(e);
		return c.json({ status: "error", message: "Internal Server Error" });
	}
});

/*
	ランキングの取得 GET /api/get_ranking
*/
app.get("/api/get_ranking", async (c) => {
	try {
		const stmt = c.env.DB.prepare("SELECT uid, nickname hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent, DENSE_RANK() over(ORDER BY hp DESC, attack DESC, defense DESC, element_mastery DESC, critical_percent DESC, critical_hurt_percent DESC, element_charge_efficiency_percent DESC, element_hurt_percent DESC) AS `rank`, updated_at, created_at FROM userdata LIMIT 100");
		const allResults = await stmt.all();

		return c.json({ status: "success", message: "Ranking Generated", data: allResults.results });
	} catch (e: unknown) {
		console.log(e);
		return c.json({ status: "error", message: "Internal Server Error" });
	}
});

/*
	データレポートの取得 GET /api/get_report
*/
app.get("/api/get_report", async (c) => {
	// 各パラメータのユーザー均値を取得
	try {
		const stmt = c.env.DB.prepare("SELECT AVG(hp) AS hp, AVG(attack) AS attack, AVG(defense) AS defense, AVG(element_mastery) AS element_mastery, AVG(critical_percent) AS critical_percent, AVG(critical_hurt_percent) AS critical_hurt_percent, AVG(element_charge_efficiency_percent) AS element_charge_efficiency_percent, AVG(element_hurt_percent) AS element_hurt_percent, COUNT( * ) AS `all_user_count` FROM userdata");
		const allResults = await stmt.all();

		let rsp_data: any = {
			"hp": allResults.results[0].hp,
			"attack": allResults.results[0].attack,
			"defense": allResults.results[0].defense,
			"element_mastery": allResults.results[0].element_mastery,
			"critical_percent": allResults.results[0].critical_percent,
			"critical_hurt_percent": allResults.results[0].critical_hurt_percent,
			"element_charge_efficiency_percent": allResults.results[0].element_charge_efficiency_percent,
			"element_hurt_percent": allResults.results[0].element_hurt_percent,
			"all_user_count": allResults.results[0].all_user_count
		}

		return c.json({ status: "success", message: "Report Generated", data: rsp_data });
	} catch (e: unknown) {
		console.log(e);
		return c.json({ status: "error", message: "Internal Server Error" });
	}
});



async function getAverageStatus(uid: number) {
	// 当該uidの詳細取得
	const response = await fetch(`https://enka.network/api/uid/${uid}`, {
		method: 'GET',
		headers: {
			"User-Agent": "Genshin-Status-Ranking/1.6.7 (Linux;Ubuntu22.04; discord:@mai_llj)"
		}
	}
	);
	const data: any = await response.json();
	// 各値の処理
	const nickname = data["playerInfo"]["nickname"];
	let avaterHpList: any = {};
	let avaterAttackPowerList: any = {};
	let avaterDefensePowerList: any = {};
	let avaterElementMasteryList: any = {};
	let avaterCriticalPercentList: any = {};
	let avaterCriticalHurtPercentList: any = {};
	let avaterElementChargeEfficiencyPercentList: any = {};
	let avaterElementHurtPercentList: any = {};

	// data["avatarInfoList"]の中身を順次処理
	data["avatarInfoList"].forEach((element: any) => {
		const avaterId = element["avatarId"];
		// HP
		avaterHpList[avaterId] = element["fightPropMap"][2000];
		// 攻撃力
		avaterAttackPowerList[avaterId] = element["fightPropMap"][2001];
		// 防御力
		avaterDefensePowerList[avaterId] = element["fightPropMap"][2002];
		// 元素熟知
		avaterElementMasteryList[avaterId] = element["fightPropMap"][28];
		// 会心率
		avaterCriticalPercentList[avaterId] = element["fightPropMap"][20];
		// 会心ダメージ
		avaterCriticalHurtPercentList[avaterId] = element["fightPropMap"][22];
		// 元素チャージ効率
		avaterElementChargeEfficiencyPercentList[avaterId] = element["fightPropMap"][23];
		// 任意元素ダメージ
		if(element["fightPropMap"][30] !== 0) {
			avaterElementHurtPercentList[avaterId] = element["fightPropMap"][30];
		} else if(element["fightPropMap"][40] !== 0 ) {
			avaterElementHurtPercentList[avaterId] = element["fightPropMap"][40];
		} else if(element["fightPropMap"][41] !== 0 ) {
			avaterElementHurtPercentList[avaterId] = element["fightPropMap"][41];
		} else if(element["fightPropMap"][42] !== 0 ) {
			avaterElementHurtPercentList[avaterId] = element["fightPropMap"][42];
		} else if(element["fightPropMap"][43] !== 0 ) {
			avaterElementHurtPercentList[avaterId] = element["fightPropMap"][43];
		} else if(element["fightPropMap"][44] !== 0 ) {
			avaterElementHurtPercentList[avaterId] = element["fightPropMap"][44];
		} else if(element["fightPropMap"][45] !== 0 ) {
			avaterElementHurtPercentList[avaterId] = element["fightPropMap"][45];
		} else if(element["fightPropMap"][46] !== 0 ) {
			avaterElementHurtPercentList[avaterId] = element["fightPropMap"][46];
		}
	});

	// 各連想配列の平均値を算出
	let averageHp: number = 0;
	let averageAttackPower: number = 0;
	let averageDefensePower: number = 0;
	let averageElementMastery: number = 0;
	let averageCriticalPercent: number = 0;
	let averageCriticalHurtPercent: number = 0;
	let averageElementChargeEfficiencyPercent: number = 0;
	let averageElementHurtPercent: number = 0;

	// HP
	for (let key in avaterHpList) { averageHp! += avaterHpList[key]; }
	console.log(averageHp);
	averageHp = Math.round(averageHp! / Object.keys(avaterHpList).length * 1000) / 1000;
	// 攻撃力
	for (let key in avaterAttackPowerList) { averageAttackPower! += avaterAttackPowerList[key]; }
	averageAttackPower = Math.round(averageAttackPower! / Object.keys(avaterAttackPowerList).length * 1000) / 1000;
	// 防御力
	for (let key in avaterDefensePowerList) { averageDefensePower! += avaterDefensePowerList[key]; }
	averageDefensePower = Math.round(averageDefensePower! / Object.keys(avaterDefensePowerList).length * 1000) / 1000;
	// 元素熟知
	for (let key in avaterElementMasteryList) { averageElementMastery! += avaterElementMasteryList[key]; }
	averageElementMastery = Math.round(averageElementMastery! / Object.keys(avaterElementMasteryList).length * 1000) / 1000;
	// 会心率
	for (let key in avaterCriticalPercentList) { averageCriticalPercent! += avaterCriticalPercentList[key]; }
	averageCriticalPercent = Math.round(averageCriticalPercent! / Object.keys(avaterCriticalPercentList).length * 1000) / 1000;
	// 会心ダメージ
	for (let key in avaterCriticalHurtPercentList) { averageCriticalHurtPercent! += avaterCriticalHurtPercentList[key]; }
	averageCriticalHurtPercent = Math.round(averageCriticalHurtPercent! / Object.keys(avaterCriticalHurtPercentList).length * 1000) / 1000;
	// 元素チャージ効率
	for (let key in avaterElementChargeEfficiencyPercentList) { averageElementChargeEfficiencyPercent! += avaterElementChargeEfficiencyPercentList[key]; }
	averageElementChargeEfficiencyPercent = Math.round(averageElementChargeEfficiencyPercent! / Object.keys(avaterElementChargeEfficiencyPercentList).length * 1000) / 1000;
	// 任意元素ダメージ
	for (let key in avaterElementHurtPercentList) { averageElementHurtPercent! += avaterElementHurtPercentList[key]; }
	averageElementHurtPercent = Math.round(averageElementHurtPercent! / Object.keys(avaterElementHurtPercentList).length * 1000) / 1000;

	return {
		"nickname": nickname,
		"hp": averageHp,
		"attack": averageAttackPower,
		"defense": averageDefensePower,
		"element_mastery": averageElementMastery,
		"critical_percent": averageCriticalPercent,
		"critical_hurt_percent": averageCriticalHurtPercent,
		"element_charge_efficiency_percent": averageElementChargeEfficiencyPercent,
		"element_hurt_percent": averageElementHurtPercent
	}
}

export default app
