import { BunRuntime } from '@effect/platform-bun'
import chalk from 'chalk'
import { Config, ConfigProvider, Effect, pipe, Schedule } from 'effect'
import { constVoid } from 'effect/Function'
import { click, getAccessToken, getProfile } from './game/api.ts'
import { fmt } from './game/fmt.ts'
import { Telegram } from './telegram/client.ts'

type State = {
	token: string
	turbo: boolean
	power: number
	energy: number
	balance: number
}

const miner = Effect.gen(function* (_) {
	const client = yield* _(Telegram)
	const peerId = yield* _(client.getPeerId('wormfare_slap_bot'))

	const webViewResultUrl = yield* _(
		client.requestWebView({
			url: 'https://clicker.wormfare.com/',
			bot: peerId,
			peer: peerId,
		})
	)

	const tgWebAppData = webViewResultUrl.searchParams.get('tgWebAppData')!
	if (!tgWebAppData) {
		return Effect.none
	}

	const state: State = {
		token: '',
		turbo: false,
		power: 0,
		energy: 0,
		balance: 0,
	}

	const sync = Effect.gen(function* (_) {
		state.token = yield* getAccessToken(tgWebAppData)

		const result = yield* getProfile(state.token)
		const timeDiff = (result.currentTimestamp - result.lastUpdateTimestamp) / 1000
		const energyGain = timeDiff * result.energyPerSecond

		state.turbo = result.isTurboAvailable
		state.power = result.energyPerTap
		state.energy = Math.min(result.energyMax, result.energyLeft + energyGain)
		state.balance = result.score
	})

	const mine = Effect.gen(function* (_) {
		const multiplier = yield* Config.number('GAME_TURBO_MULTIPLIER').pipe(Config.withDefault(300))

		const result = yield* click(state.token, (state.turbo ? multiplier : 1) * state.power, state.turbo)
		const timeDiff = (result.currentTimestamp - result.lastUpdateTimestamp) / 1000
		const energyGain = timeDiff * result.energyPerSecond

		const energyDiff = result.energyLeft - state.energy
		const balanceDiff = result.score - state.balance

		state.turbo = result.isTurboAvailable
		state.power = result.energyPerTap
		state.energy = Math.floor(Math.min(result.energyMax, result.energyLeft + energyGain))
		state.balance = Math.floor(result.score)

		console.log(
			chalk.bold(new Date().toLocaleTimeString()),
			'|⚡️'.padEnd(4),
			chalk.bold(`${state.energy}`.padEnd(4)),
			chalk.bold[energyDiff > 0 ? 'green' : 'red'](fmt(energyDiff).padEnd(4)),
			'|🪙'.padEnd(4),
			chalk.bold(fmt(state.balance).slice(1).padEnd(8)),
			chalk.bold[balanceDiff > 0 ? 'green' : 'red'](fmt(balanceDiff).padEnd(4))
		)
	})

	const mineInterval = yield* Config.duration('GAME_MINE_INTERVAL').pipe(Config.withDefault('1 seconds'))
	const syncInterval = yield* Config.duration('GAME_SYNC_INTERVAL').pipe(Config.withDefault('60 seconds'))

	const miner = Effect.repeat(
		mine,
		Schedule.addDelay(Schedule.forever, () => mineInterval)
	)

	const syncer = Effect.repeat(
		sync,
		Schedule.addDelay(Schedule.forever, () => syncInterval)
	)

	yield* sync
	yield* Effect.all([miner, syncer], { concurrency: 'unbounded' })
})

const policy = Schedule.addDelay(Schedule.forever, () => '15 seconds')

const program = Effect.match(miner, {
	onSuccess: constVoid,
	onFailure: (err) => {
		console.error(chalk.bold(new Date().toLocaleTimeString()), '‼️FAILED:', err._tag)
	},
})

pipe(
	Effect.all([Effect.repeat(program, policy), Effect.sync(() => process.stdout.write('\u001Bc\u001B[3J'))], {
		concurrency: 'unbounded',
	}),
	Effect.provide(Telegram.live),
	Effect.withConfigProvider(ConfigProvider.fromEnv()),
	BunRuntime.runMain
)
