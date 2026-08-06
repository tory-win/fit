declare module 'lunar-javascript' {
  interface EightChar {
    getYearGan(): string
    getYearZhi(): string
    getMonthGan(): string
    getMonthZhi(): string
    getDayGan(): string
    getDayZhi(): string
  }

  interface LunarDate {
    getEightChar(): EightChar
  }

  interface SolarDate {
    getLunar(): LunarDate
  }

  export const Solar: {
    fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): SolarDate
  }
}
