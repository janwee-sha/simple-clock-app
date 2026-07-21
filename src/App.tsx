import { useEffect, useMemo, useState, type CSSProperties } from "react";

const TICK_MARKS = Array.from({ length: 60 }, (_, index) => index);
const HOUR_NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1);

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

export default function App() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateClock = () => setNow(new Date());

    updateClock();
    const timer = window.setInterval(updateClock, 100);

    return () => window.clearInterval(timer);
  }, []);

  const clock = useMemo(() => {
    if (!now) {
      return {
        hourAngle: 0,
        minuteAngle: 0,
        secondAngle: 0,
        timeText: "--:--:--",
        dateText: "正在同步本地时间",
        machineTime: undefined,
        accessibleTime: "当前本地时间：正在同步",
      };
    }

    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();
    const preciseSeconds = seconds + milliseconds / 1000;

    return {
      hourAngle: hours * 30 + minutes * 0.5 + preciseSeconds / 120,
      minuteAngle: minutes * 6 + preciseSeconds * 0.1,
      secondAngle: preciseSeconds * 6,
      timeText: timeFormatter.format(now),
      dateText: dateFormatter.format(now),
      machineTime: now.toISOString(),
      accessibleTime: `当前本地时间：${timeFormatter.format(now)}，${dateFormatter.format(now)}`,
    };
  }, [now]);

  return (
    <main className="clock-page">
      <section className="clock-shell" aria-labelledby="clock-title">
        <header className="clock-heading">
          <p className="eyebrow">
            <span className="status-dot" aria-hidden="true" />
            LOCAL TIME
          </p>
          <h1 id="clock-title">此刻</h1>
        </header>

        <div className="clock-face" role="img" aria-label={clock.accessibleTime}>
          <div className="ticks" aria-hidden="true">
            {TICK_MARKS.map((tick) => (
              <i
                className={tick % 5 === 0 ? "tick tick-hour" : "tick"}
                key={tick}
                style={{ "--tick-angle": `${tick * 6}deg` } as CSSProperties}
              />
            ))}
          </div>

          <div className="numbers" aria-hidden="true">
            {HOUR_NUMBERS.map((hour) => {
              const angle = (hour * 30 * Math.PI) / 180;
              const style = {
                left: `${(50 + Math.sin(angle) * 36).toFixed(4)}%`,
                top: `${(50 - Math.cos(angle) * 36).toFixed(4)}%`,
              };

              return (
                <span className="hour-number" key={hour} style={style}>
                  {hour}
                </span>
              );
            })}
          </div>

          <div
            className="hand hour-hand"
            style={{ transform: `translateY(-50%) rotate(${clock.hourAngle - 90}deg)` }}
            aria-hidden="true"
          />
          <div
            className="hand minute-hand"
            style={{ transform: `translateY(-50%) rotate(${clock.minuteAngle - 90}deg)` }}
            aria-hidden="true"
          />
          <div
            className="hand second-hand"
            style={{ transform: `translateY(-50%) rotate(${clock.secondAngle - 90}deg)` }}
            aria-hidden="true"
          />
          <span className="center-pin" aria-hidden="true" />
        </div>

        <footer className="clock-readout">
          <time className="digital-time" dateTime={clock.machineTime}>
            {clock.timeText}
          </time>
          <p className="date-line">{clock.dateText}</p>
        </footer>
      </section>
    </main>
  );
}
