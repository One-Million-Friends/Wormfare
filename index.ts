import {BunRuntime} from "@effect/platform-bun";
import {ConfigProvider, Effect, pipe, Schedule} from "effect";
import {Telegram} from "./telegram/client.ts";
import {click, getAccessToken, getProfile} from "./game/api.ts";

const miner = Effect.gen(function* (_) {
    const client = yield* _(Telegram);
    const peerId = yield* _(client.getPeerId('wormfare_slap_bot'));

    const webViewResultUrl = yield* _(client.requestWebView({
        url: 'https://clicker.wormfare.com/',
        bot: peerId,
        peer: peerId
    }));

    const tgWebAppData = webViewResultUrl.searchParams.get('tgWebAppData')!
    if (!tgWebAppData) {
        return Effect.none
    }

    const token = yield* getAccessToken(webViewResultUrl.searchParams.get('tgWebAppData')!);

    let profile = yield* getProfile(token)

    const now = Date.now();
    const timeDiff = (now - profile.lastUpdateTimestamp) / 1000;
    const energyGain = timeDiff * profile.energyPerSecond;

    let turbo = profile.isTurboAvailable
    let energy = Math.min(profile.energyMax, profile.energyLeft + energyGain);
    console.log("ENERGY:", energy)

    while (Math.floor(energy) > 10 * profile.energyPerSecond) {
        const count = Math.floor(Math.min(energy, profile.energyMax * 0.39));

        profile = yield* click(token, count, turbo)
        turbo = profile.isTurboAvailable
        energy = profile.energyLeft

        console.log("ENERGY:", profile.energyLeft)

        if (!turbo) {
            yield* Effect.sleep((profile.energyLeft / 360) * 1000)
        }
    }

    console.log("CIRCLE FINISHED...")
})

const policy = Schedule.addDelay(Schedule.forever, () => "5 minutes")

pipe(
    Effect.repeat(miner, policy),
    Effect.provide(Telegram.live),
    Effect.withConfigProvider(ConfigProvider.fromEnv()),
    BunRuntime.runMain
)