const { withTransaction } = require("../config/db");
const AppError = require("../utils/AppError");
const { validateReadingDate } = require("../utils/validators");

const getUserTimezone = async (client, userId) => {
    const result = await client.query(
        "SELECT timezone FROM public.users WHERE id = $1",
        [userId]
    );

    if (result.rows.length === 0) {
        throw new AppError("Authenticated user was not found", 401);
    }

    return result.rows[0].timezone;
};

const getCalendarParts = (timezone) => {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    return Object.fromEntries(
        parts
            .filter(({ type }) => type !== "literal")
            .map(({ type, value }) => [type, Number(value)])
    );
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const getReportPeriod = (
    timezone,
    previousMonth = false,
    selectedDate = null
) => {
    const calendar = selectedDate
        ? {
            year: Number(selectedDate.slice(0, 4)),
            month: Number(selectedDate.slice(5, 7)),
            day: Number(selectedDate.slice(8, 10))
        }
        : getCalendarParts(timezone);
    const { year, month, day } = calendar;
    const currentMonthStart = new Date(Date.UTC(year, month - 1, 1));
    const start = previousMonth
        ? new Date(Date.UTC(year, month - 2, 1))
        : currentMonthStart;
    const end = previousMonth
        ? currentMonthStart
        : selectedDate
            ? new Date(Date.UTC(year, month - 1, day + 1))
            : new Date(Date.UTC(year, month, 1));

    return {
        start: formatDate(start),
        end: formatDate(end),
        year: start.getUTCFullYear(),
        month: start.getUTCMonth() + 1,
        label: `${start.getUTCFullYear()}-${String(
            start.getUTCMonth() + 1
        ).padStart(2, "0")}`
    };
};

const getDailyPeriod = (timezone, selectedDate = null) => {
    const { year, month, day } = selectedDate
        ? {
            year: Number(selectedDate.slice(0, 4)),
            month: Number(selectedDate.slice(5, 7)),
            day: Number(selectedDate.slice(8, 10))
        }
        : getCalendarParts(timezone);
    const start = new Date(Date.UTC(year, month - 1, day));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return {
        start: formatDate(start),
        end: formatDate(end),
        date: formatDate(start)
    };
};

const getSelectedDate = (req, timezone) => {
    if (req.query.date === undefined) {
        return null;
    }

    if (Array.isArray(req.query.date)) {
        throw new AppError("Report date must use YYYY-MM-DD format", 400);
    }

    return validateReadingDate(req.query.date, timezone);
};

const toNumberOrNull = (value) => (
    value === null || value === undefined ? null : Number(value)
);

const normalizeStats = (row) => ({
    total_readings: Number(row.total_readings),
    average_glucose: toNumberOrNull(row.average_glucose),
    minimum_glucose: toNumberOrNull(row.minimum_glucose),
    maximum_glucose: toNumberOrNull(row.maximum_glucose)
});

const getDailyReport = async (req, res, next) => {
    try {
        const result = await withTransaction(
            async (client) => {
                const timezone = await getUserTimezone(client, req.user.id);
                const selectedDate = getSelectedDate(req, timezone);
                const period = getDailyPeriod(timezone, selectedDate);

                const queryResult = await client.query(
                    `WITH period_readings AS (
                        SELECT reading_date, time_slot, glucose_value
                        FROM public.glucose_readings
                        WHERE reading_date >= $1::date
                          AND reading_date < $2::date
                    ),
                    statistics AS (
                        SELECT
                            COUNT(*)::int AS total_readings,
                            AVG(glucose_value) AS average_glucose,
                            MIN(glucose_value) AS minimum_glucose,
                            MAX(glucose_value) AS maximum_glucose
                        FROM period_readings
                    )
                    SELECT
                        statistics.*,
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'date', reading_date,
                                        'time_slot', time_slot,
                                        'glucose_value', glucose_value
                                    )
                                    ORDER BY time_slot
                                )
                                FROM period_readings
                            ),
                            '[]'::json
                        ) AS readings
                    FROM statistics`,
                    [period.start, period.end]
                );

                return {
                    period,
                    report: {
                        date: period.date,
                        ...normalizeStats(queryResult.rows[0]),
                        readings: queryResult.rows[0].readings
                    }
                };
            },
            req.user.id
        );

        res.status(200).json({
            success: true,
            report: result.report
        });
    } catch (error) {
        next(error);
    }
};

const getMonthReport = async (
    client,
    timezone,
    previousMonth,
    selectedDate = null
) => {
    const period = getReportPeriod(timezone, previousMonth, selectedDate);
    const queryResult = await client.query(
        `WITH period_readings AS (
                        SELECT reading_date, time_slot, glucose_value
                        FROM public.glucose_readings
                        WHERE reading_date >= $1::date
                          AND reading_date < $2::date
                    )
                    SELECT
                        (
                            SELECT COUNT(*)::int
                            FROM period_readings
                        ) AS total_readings,
                        (
                            SELECT AVG(glucose_value)
                            FROM period_readings
                        ) AS average_glucose,
                        (
                            SELECT MIN(glucose_value)
                            FROM period_readings
                        ) AS minimum_glucose,
                        (
                            SELECT MAX(glucose_value)
                            FROM period_readings
                        ) AS maximum_glucose,
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'date', daily.reading_date,
                                        'total_readings', daily.total_readings,
                                        'average_glucose', daily.average_glucose,
                                        'minimum_glucose', daily.minimum_glucose,
                                        'maximum_glucose', daily.maximum_glucose
                                    )
                                    ORDER BY daily.reading_date
                                )
                                FROM (
                                    SELECT
                                        reading_date,
                                        COUNT(*)::int AS total_readings,
                                        AVG(glucose_value) AS average_glucose,
                                        MIN(glucose_value) AS minimum_glucose,
                                        MAX(glucose_value) AS maximum_glucose
                                    FROM period_readings
                                    GROUP BY reading_date
                                ) AS daily
                            ),
                            '[]'::json
                        ) AS daily_summaries,
                        COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'time_slot', slots.time_slot,
                                        'count', slots.count
                                    )
                                    ORDER BY slots.time_slot
                                )
                                FROM (
                                    SELECT time_slot, COUNT(*)::int AS count
                                    FROM period_readings
                                    GROUP BY time_slot
                                ) AS slots
                            ),
                            '[]'::json
                        ) AS time_slot_counts`,
            [period.start, period.end]
        );

    return { period, row: queryResult.rows[0] };
};

const sendMonthReport = async (req, res, next, previousMonth) => {
    try {
        const result = await withTransaction(
            async (client) => {
                const timezone = await getUserTimezone(client, req.user.id);
                const selectedDate = previousMonth
                    ? null
                    : getSelectedDate(req, timezone);
                return getMonthReport(
                    client,
                    timezone,
                    previousMonth,
                    selectedDate
                );
            },
            req.user.id
        );

        res.status(200).json({
            success: true,
            report: {
                month: result.period.label,
                year: result.period.year,
                ...normalizeStats(result.row),
                daily_summaries: result.row.daily_summaries,
                time_slot_counts: result.row.time_slot_counts
            }
        });
    } catch (error) {
        next(error);
    }
};

const getMonthlyReport = (req, res, next) =>
    sendMonthReport(req, res, next, false);

const getPreviousMonthReport = (req, res, next) =>
    sendMonthReport(req, res, next, true);

module.exports = {
    getDailyReport,
    getMonthlyReport,
    getPreviousMonthReport
};
