declare module "lunar-javascript" {
  export const Solar: {
    fromYmd(
      year: number,
      month: number,
      day: number,
    ): {
      getLunar(): {
        getYear(): number;
        getMonth(): number;
        getDay(): number;
        getMonthInChinese(): string;
        getDayInChinese(): string;
      };
    };
  };
}
