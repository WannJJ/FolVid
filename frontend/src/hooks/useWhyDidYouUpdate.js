// hooks/useWhyDidYouUpdate.js
import { useEffect, useRef } from "react";

export function useWhyDidYouUpdate(name, props) {
  const prevProps = useRef();

  useEffect(() => {
    if (prevProps.current) {
      const allKeys = Object.keys({ ...prevProps.current, ...props });
      const changesObj = {};

      allKeys.forEach((key) => {
        if (prevProps.current[key] !== props[key]) {
          changesObj[key] = {
            from: prevProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changesObj).length) {
        console.log("[why-did-you-update]", name, changesObj);
      }
    }

    prevProps.current = props;
  });
}
