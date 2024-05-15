import { Hono } from "hono";
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Env as BaseEnv } from "hono/dist/types/types";

type Env = BaseEnv & {
	DB: D1Database;
}

const app = new Hono<Env>();

/*
HP : hp
攻撃力 : attack
防御力 : defense
元素熟知 : element_mastery
会心率 : critical_percent
会心ダメージ : critical_hurt_percent
元素チャージ効率 : element_charge_efficiency_percent
任意元素ダメージ : element_hurt_percent
*/
const schema = z.object({
	uid: z.number(),
	hp: z.number(),
	attack: z.number(),
	defense: z.number(),
	element_mastery: z.number(),
	critical_percent: z.number(),
	critical_hurt_percent: z.number(),
	element_charge_efficiency_percent: z.number(),
	element_hurt_percent: z.number(),
})

/*
	ランキングの生成 POST /api/gen_ranking
	@param uid: number, hp: number, attack: number, defense: number, element_mastery: number, critical_percent: number, critical_hurt_percent: number, element_charge_efficiency_percent: number, element_hurt_percent: number
*/
app.post("/api/gen_ranking", zValidator('json', schema), async (c) => {
	const body = await c.req.json()
	const { uid, hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent } = body

	console.log(uid, hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent);

	// D1Databaseのデータを取得
	const stmt = c.env.DB.prepare("SELECT * FROM userdata WHERE uid = ?");
	const { results } = await stmt.bind(uid).all();
	console.log(results);

	if (results.length === 0) {
		// ユーザーが存在しない
		try {
			// ユーザーのデータを挿入
			const stmt = await c.env.DB.prepare("INSERT INTO userdata (uid, hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
			await stmt.bind(uid, hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent).run();
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
			const stmt = await c.env.DB.prepare("UPDATE userdata SET hp = ?, attack = ?, defense = ?, element_mastery = ?, critical_percent = ?, critical_hurt_percent = ?, element_charge_efficiency_percent = ?, element_hurt_percent = ?, updated_at = DATETIME('now', 'localtime') WHERE uid = ?");
			await stmt.bind(hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent, uid).run();
		}
	}

	// ランキングの生成
	try {
		// 当該uidの相対ランキングを取得
		const stmt = c.env.DB.prepare("SELECT uid, hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent, DENSE_RANK() over(ORDER BY hp DESC, attack DESC, defense DESC, element_mastery DESC, critical_percent DESC, critical_hurt_percent DESC, element_charge_efficiency_percent DESC, element_hurt_percent DESC) AS `rank`, updated_at, created_at FROM userdata");
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
		const stmt = c.env.DB.prepare("SELECT uid, hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent, DENSE_RANK() over(ORDER BY hp DESC, attack DESC, defense DESC, element_mastery DESC, critical_percent DESC, critical_hurt_percent DESC, element_charge_efficiency_percent DESC, element_hurt_percent DESC) AS `rank`, updated_at, created_at FROM userdata LIMIT 100");
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
	// 各パラメータの平均値を取得
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

export default app
