import { EdhrecTopWindow } from "@/generated/prisma/client";

import type { EdhrecTopWindowParam } from "@/lib/edhrec/top-window";

export function topWindowParamToEnum(window: EdhrecTopWindowParam): EdhrecTopWindow {
  switch (window) {
    case "week":
      return EdhrecTopWindow.WEEK;
    case "month":
      return EdhrecTopWindow.MONTH;
    case "all":
      return EdhrecTopWindow.ALL;
    case "year":
    default:
      return EdhrecTopWindow.YEAR;
  }
}

export function topWindowEnumToParam(window: EdhrecTopWindow): EdhrecTopWindowParam {
  switch (window) {
    case EdhrecTopWindow.WEEK:
      return "week";
    case EdhrecTopWindow.MONTH:
      return "month";
    case EdhrecTopWindow.ALL:
      return "all";
    case EdhrecTopWindow.YEAR:
    default:
      return "year";
  }
}
