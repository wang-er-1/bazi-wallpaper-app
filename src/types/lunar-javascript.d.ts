declare module "lunar-javascript/lunar" {
  export const Solar: {
    fromDate(date: Date): {
      getLunar(): LunarDate;
      toYmdHms(): string;
    };
    fromYmdHms(
      year: number | string,
      month: number | string,
      day: number | string,
      hour: number | string,
      minute: number | string,
      second: number | string,
    ): {
      getLunar(): LunarDate;
      toYmdHms(): string;
    };
  };

  export const Lunar: {
    fromYmdHms(
      year: number | string,
      month: number | string,
      day: number | string,
      hour: number | string,
      minute: number | string,
      second: number | string,
    ): LunarDate;
  };

  type LunarDate = {
    getEightChar(): EightChar;
  };

  type EightChar = {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
  };
}
