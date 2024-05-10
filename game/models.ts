import {Schema} from "@effect/schema";
import {type Annotable, DateFromSelf, transform} from "@effect/schema/Schema";

export interface DateFromTime extends Annotable<DateFromTime, Date, number> {
}

export const DateFromTime: DateFromTime = transform(
    Schema.Number,
    DateFromSelf,
    {
        decode: (s) => new Date(s),
        encode: (n) => n.getTime()
    }
).annotations({identifier: "DateFromTime"})

export const Token = Schema.Struct({
    accessToken: Schema.String
})

export const Boost = Schema.Struct({
    _id: Schema.String,
    type: Schema.Enums({
        energy_max: "energy_max",
        energy_per_tap: "energy_per_tap",
        energy_per_second: "energy_per_second"
    }),
    level: Schema.Number,
})

export const Squad = Schema.Struct({
    id: Schema.Number,
    username: Schema.String,
    name: Schema.String,
    league: Schema.String,
    totalMembers: Schema.Number,
    totalEarnedScore: Schema.Number,
    earnedScoreToday: Schema.Number,
    earnedScoreTodayUpdatedAt: DateFromTime, // Date.getTime()
    earnedScoreThisWeek: Schema.Number,
    earnedScoreThisWeekUpdatedAt: DateFromTime, // Date.getTime()
})

export const Profile = Schema.Struct({
    id: Schema.Number,
    username: Schema.String,
    firstName: Schema.String,
    fullName: Schema.String,
    league: Schema.String,
    energyMax: Schema.Number,
    energyPerSecond: Schema.Number,
    energyPerTap: Schema.Number,
    boosts: Schema.Array(Boost),
    totalEarnedScore: Schema.Number,
    manualEarnedScore: Schema.Number,
    earnedScoreToday: Schema.Number,
    earnedScoreTodayUpdatedAt: DateFromTime, // Date.getTime()
    earnedScoreThisWeek: Schema.Number,
    earnedScoreThisWeekUpdatedAt: DateFromTime, // Date.getTime()
    invitedUsersCount: Schema.Number,
    score: Schema.Number,
    lastUpdateTimestamp: Schema.Number, // Date.getTime()
    energyLeft: Schema.Number,
    isTurboAvailable: Schema.Boolean,
    rank: Schema.Number,
    squad: Schema.NullishOr(Squad),
    autoBotEarnedScore: Schema.Number,
    currentTimestamp: Schema.Number, // Date.getTime()
})
