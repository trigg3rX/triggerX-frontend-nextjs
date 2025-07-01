import { useEffect, useState } from "react";

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      if (elapsed < duration) {
        const progress = elapsed / duration;
        setCount(Math.floor(progress * target));
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    }
    requestAnimationFrame(animate);
    // Reset on target change
    return () => setCount(0);
  }, [target, duration]);
  return count;
}

export default useCountUp;
