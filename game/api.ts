import * as Http from '@effect/platform/HttpClient'
import { Effect } from 'effect'
import { Profile, Token } from './models.ts'

export const getAccessToken = (tgWebAppData: string) =>
	Http.request.post('https://elcevb3oz4.execute-api.eu-central-1.amazonaws.com/auth/login').pipe(
		Http.request.jsonBody({ initData: tgWebAppData }),
		Effect.andThen(Http.client.fetchOk),
		Effect.andThen(Http.response.schemaBodyJson(Token)),
		Effect.map((r) => r.accessToken),
		Effect.scoped
	)

export const getProfile = (accessToken: string) =>
	Http.request
		.get('https://elcevb3oz4.execute-api.eu-central-1.amazonaws.com/user/profile')
		.pipe(
			Http.request.setHeader('Authorization', 'Bearer ' + accessToken),
			Http.request.setHeader('X-Api-Key', '9m60AhO1I9JmrYIsWxMnThXbF3nDW4GHFA1rde5PKzJmRA9Dv6LZ2YXSM6vvwigC'),
			Http.client.fetchOk,
			Effect.andThen(Http.response.schemaBodyJson(Profile)),
			Effect.scoped
		)

export const click = (accessToken: string, count: number, turbo = false) =>
	Http.request.post('https://elcevb3oz4.execute-api.eu-central-1.amazonaws.com/game/save-clicks').pipe(
		Http.request.setHeader('Authorization', 'Bearer ' + accessToken),
		Http.request.setHeader('X-Api-Key', '9m60AhO1I9JmrYIsWxMnThXbF3nDW4GHFA1rde5PKzJmRA9Dv6LZ2YXSM6vvwigC'),
		Http.request.jsonBody({
			startTimestamp: Math.floor(Date.now() - (count / 360) * 1000),
			amount: count,
			isTurbo: turbo,
		}),
		Effect.andThen(Http.client.fetchOk),
		Effect.andThen(Http.response.schemaBodyJson(Profile)),
		Effect.scoped
	)
