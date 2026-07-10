import { DateTime, Duration } from 'luxon';
import type { IDateDuration, IDateFixed } from './dateUtils.api';

export interface IValidateDurationParams {
    /**
     * Value to be validated.
     */
    value: IDateDuration | number;
    /**
     * Minimum duration to check.
     */
    minDuration?: IDateDuration;
}

export interface IValidateFixedTimeParams {
    /**
     * Value to be validated.
     */
    value: IDateFixed;
    /**
     * Value must be greater than the minimum time set.
     */
    minTime: DateTime;
    /**
     * When set, the value must be greater than the minTime + minDuration.
     */
    minDuration?: IDateDuration;
}

class DateUtils {
    secondsToDuration = (seconds: number) => {
        const duration = Duration.fromObject({ seconds }).shiftTo('days', 'hours', 'minutes');
        const { days, hours, minutes } = duration;

        return { days, hours, minutes };
    };

    durationToSeconds = (duration: IDateDuration) => Duration.fromObject(duration).as('seconds');

    parseFixedDate = ({ date, time }: IDateFixed): DateTime => {
        const parsedTime = DateTime.fromISO(time);

        if (!parsedTime.isValid) {
            return DateTime.invalid(`Invalid time format: "${time}"`);
        }

        const parsedDate = DateTime.fromISO(date);

        if (!parsedDate.isValid) {
            return DateTime.invalid(`Invalid date format: "${date}"`);
        }

        const { hour, minute } = parsedTime;
        return parsedDate.set({ hour, minute });
    };

    dateToFixedDate = (date: DateTime): IDateFixed | null => {
        const isoDate = date.toISODate();
        const isoTime = date.toFormat('HH:mm');

        return isoDate == null ? null : { date: isoDate, time: isoTime };
    };

    validateDuration = ({ value, minDuration }: IValidateDurationParams) => {
        if (!minDuration) {
            return true;
        }

        const normalizeValue = (input?: number | string) => {
            if (input == null) {
                return 0;
            }

            const numericValue =
                typeof input === 'string' ? Number(input.replace(/[^\d.-]/g, '')) : input;
            return Number.isFinite(numericValue) ? numericValue : 0;
        };

        const valueObject =
            typeof value === 'number'
                ? { seconds: value }
                : typeof value === 'string'
                  ? { seconds: normalizeValue(value) }
                  : {
                        days: normalizeValue(value.days),
                        hours: normalizeValue(value.hours),
                        minutes: normalizeValue(value.minutes),
                        seconds: normalizeValue((value as { seconds?: number | string }).seconds),
                    };
        const valueMs = Duration.fromObject(valueObject).as('milliseconds');
        const minMs = Duration.fromObject(minDuration).as('milliseconds');
        const isValid = valueMs >= minMs;

        return isValid;
    };

    validateFixedTime = ({ value, minTime, minDuration }: IValidateFixedTimeParams) => {
        const { date, time } = value;

        const isDateValid = date.length > 0 && time.length > 0;

        if (!isDateValid) {
            return false;
        }

        const parsedValue = this.parseFixedDate(value);
        const parsedMs = parsedValue.toMillis();
        const minTimeMs = minTime.toMillis();
        const minDurationMs = minDuration == null ? undefined : minTime.plus(minDuration).toMillis();

        const isMinTimeValid = parsedMs >= minTimeMs;
        const isMinDurationValid = minDurationMs == null || parsedMs >= minDurationMs;

        return isMinTimeValid && isMinDurationValid;
    };

    compareDuration = (first?: IDateDuration, second?: IDateDuration) =>
        Duration.fromObject(first ?? {}).equals(Duration.fromObject(second ?? {}));
}

export const dateUtils = new DateUtils();
