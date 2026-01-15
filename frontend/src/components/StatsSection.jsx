// StatsSection.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useMotionValue, useSpring, useInView } from 'framer-motion';

const Counter = ({ value, suffix = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [springValue]);

  return <span ref={ref}>{displayValue.toLocaleString()}{suffix}</span>;
};

const StatsSection = () => {
  const stats = [
    { label: "Registered Users", value: 36, suffix: "M+" },
    { label: "Countries Supported", value: 178, suffix: "" },
    { label: "Quarterly Volume", value: 520, suffix: "B+" },
  ];

  return (
    <section className="bg-nirshux-dark py-24 border-y border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-2">
                <Counter value={stat.value} suffix={stat.suffix} />
              </h2>
              <p className="text-nirshux-accent font-bold tracking-widest uppercase text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;