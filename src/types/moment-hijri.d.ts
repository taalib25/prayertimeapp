declare module 'moment-hijri' {
  import moment from 'moment';

  export interface MomentHijri extends moment.Moment {
    format(format: string): string; // Uses the format method with i-prefixed tokens
    locale(locale: string): MomentHijri; // Set locale for formatting
    locale(): string; // Get current locale
    iYear(): number;
    iYear(y: number): MomentHijri;
    iMonth(): number;
    iMonth(m: number): MomentHijri;
    iDate(): number;
    iDate(d: number): MomentHijri;
    iDayOfYear(): number;
    iWeek(): number;
    iWeekday(): number;
    iDayOfWeek(): number;
    iDaysInMonth(): number;
    startOf(units: string): MomentHijri; // Can use with i-prefixed units
    endOf(units: string): MomentHijri; // Can use with i-prefixed units
    iStartOf(units: string): MomentHijri;
    iEndOf(units: string): MomentHijri;
    add(
      amount: number,
      units: moment.unitOfTime.DurationConstructor,
    ): MomentHijri;
  }

  function hijri(
    inp?: moment.MomentInput,
    format?: moment.MomentFormatSpecification,
    strict?: boolean,
  ): MomentHijri;

  namespace hijri {
    export function iConvert(gregorianMoment: moment.Moment): MomentHijri;
    export function iMonths(): string[];
    export function iMonthsParse(): string[];
    export function iMonthsShort(): string[];
  }

  export default hijri;
}
