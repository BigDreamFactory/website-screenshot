import { instanceOfString } from './interfaces'

interface DateRange {
  start: Date
  end: Date
}

export type Period = 'day' | 'week' | 'month' | 'year'

const dateToISO = ({
  date,
  options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }
}: {
  date: Date
  options?: Intl.DateTimeFormatOptions
}) => {
  return date.toLocaleDateString('lt-LT', { ...options })
}

const unixToDate = (value: number, addMS = true) => {
  return new Date(value * (addMS ? 1000 : 1))
}

const iso8601ToDate = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Incorrect Format')
  }

  return new Date(date.replace(/-/g, '/'))
}

const getDate = (date: Date | string) => {
  if (instanceOfString(date)) {
    return new Date(date)
  } else {
    return date
  }
}

const getDateRange = ({
  date = new Date(),
  interval,
  type
}: {
  date?: Date
  interval: number
  type: 'hours' | 'days'
}): DateRange => {
  const start = new Date(date)
  const end = new Date(date)

  switch (type) {
    case 'hours':
      start.setHours(start.getHours(), 0, 0, 0)
      end.setHours(end.getHours() + interval, 0, 0, 0)
      break
    case 'days':
      end.setDate(start.getDate() + interval)
      break
  }

  return { start, end }
}

const isDateBetween = ({ date, range }: { date: Date; range: DateRange }) => {
  return range.start.getTime() <= date.getTime() && date.getTime() < range.end.getTime()
}

const calculateNextDate = ({
  date,
  period,
  interval
}: {
  date: Date
  period: Period
  interval: number
}) => {
  const nextDate = new Date(date)

  switch (period) {
    case 'day':
      nextDate.setDate(date.getDate() + interval)
      break
    case 'week':
      nextDate.setDate(date.getDate() + 7 * interval)
      break
    case 'month':
      nextDate.setMonth(date.getMonth() + interval)
      if (nextDate.getMonth() - date.getMonth() == interval + 1) {
        nextDate.setDate(0)
      }
      break
    case 'year':
      nextDate.setFullYear(date.getFullYear() + interval)
      if (nextDate.getMonth() - date.getMonth() == 1) {
        nextDate.setDate(0)
      }
      break
  }

  return nextDate
}

export {
  dateToISO,
  iso8601ToDate,
  isDateBetween,
  getDateRange,
  unixToDate,
  calculateNextDate,
  getDate
}
