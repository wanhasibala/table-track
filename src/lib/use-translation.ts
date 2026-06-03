"use client";
import * as React from "react";
import Cookies from "js-cookie";

export function useTranslation() {
  const [messages, setMessages] = React.useState<Record<string, string>>({});
  const [locale, setLocale] = React.useState("en");

  React.useEffect(() => {
    const cookieLocale = Cookies.get("NEXT_LOCALE") || "en";
    setLocale(cookieLocale);

    fetch(`/messages/${cookieLocale}.json`)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch(() => setMessages({}));
  }, []);
  function t(key: string) {
    const keys = key.split(".");
    let value: any = messages;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key 
    }
    return value;
  }

  return { t, locale };
}
