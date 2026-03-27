import { useEffect } from "react";

const APP_TITLE = "Essay AI";

function usePageTitle(title) {
  useEffect(() => {
    const nextTitle = title ? `${title} | ${APP_TITLE}` : APP_TITLE;
    document.title = nextTitle;
  }, [title]);
}

export default usePageTitle;
