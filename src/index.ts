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
			const stmt = await c.env.DB.prepare("UPDATE userdata SET hp = ?, attack = ?, defense = ?, element_mastery = ?, critical_percent = ?, critical_hurt_percent = ?, element_charge_efficiency_percent = ?, element_hurt_percent = ? WHERE uid = ?");
			await stmt.bind(hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent, uid).run();
		}
	}

	// ランキングの生成
	try {
		// 当該uidの相対ランキングを取得
		const stmt = c.env.DB.prepare("SELECT *, DENSE_RANK() over(order by hp, attack, defense, element_mastery, critical_percent, critical_hurt_percent, element_charge_efficiency_percent, element_hurt_percent) AS `rank`, COUNT( * ) AS `all_user_count` FROM userdata WHERE uid = ?");
		const allResults = await stmt.bind(uid).all();

		return c.json({ status: "success", message: "Ranking Generated", data: allResults.results[0] });
	} catch (e: unknown) {
		console.log(e);
		return c.json({ status: "error", message: "Internal Server Error" });
	}

});


export default app
