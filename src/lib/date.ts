import day from "dayjs";
import relative from "dayjs/plugin/relativeTime";
import "dayjs/locale/id";
import { id } from "date-fns/locale";

day.extend(relative);

// Indonesian month names
const indonesianMonths = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const formatDay = (date: string | Date, mode: string) => {
  if (date instanceof Date || typeof date === "string") {
    return day(date).format(mode);
  }
  return "-";
};

export const longDate = (date: string | Date) => {
  if (date instanceof Date || typeof date === "string") {
    return day(date).format("DD MMM YYYY - hh:mm");
  }
  return "-";
};

export const shortDate = (date: string | Date, locale?: any) => {
  if (date instanceof Date || typeof date === "string") {
    return day(date).locale("id").format("DD MMMM YYYY");
  }
  return "-";
};

export const timeAgo = (date: string | Date) => {
  if (date instanceof Date || typeof date === "string") {
    return day(date).fromNow();
  }
  return "-";
};

export const formatTime = (date: string | Date) => {
  if (date instanceof Date || typeof date === "string") {
    return day(date).format("hh:mm");
  }
  return "-";
};

export const indonesianDate = (date: string | Date) => {
  if (date instanceof Date || typeof date === "string") {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const day = dateObj.getDate();
    const month = indonesianMonths[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day} ${month} ${year}`;
  }
  return "-";
};
