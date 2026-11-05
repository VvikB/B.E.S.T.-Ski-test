import { useId } from "react";
export function AlpinePanorama({ kids = false }: { kids?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className="alpine-panorama"
      viewBox="0 0 1000 340"
      role="img"
      aria-label="Оригинальный альпийский пейзаж: снежные вершины, ледниковая долина и хвойный лес"
    >
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor={kids ? "#d8eaf2" : "#c4dfed"} />
          <stop offset="1" stopColor="#f6fbff" />
        </linearGradient>
        <linearGradient id={id + "snow"} x2="1" y2="1">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#c7dce8" />
        </linearGradient>
      </defs>
      <rect width="1000" height="340" fill={`url(#${id})`} />
      <circle cx="820" cy="65" r="34" fill="#f1d6a2" />
      <path
        d="M0 227 95 128 172 198 291 44 408 197 519 99 640 210 748 65 905 224 1000 141V340H0Z"
        fill="#81a7bf"
      />
      <path
        d="m172 198 119-154 117 153-62-47-33 12-28-68-47 78-28-8Zm468 12L748 65 905 224l-92-42-28 10-41-81-32 65-25-7Z"
        fill="#f6fcff"
      />
      <path
        d="m291 44 117 153-62-47-33 12-28-68Zm457 21 157 159-92-42-28 10-41-81Z"
        fill="#c2d7e6"
      />
      <path
        d="M0 309 148 215 302 296 463 164 659 305 816 230 1000 305V340H0Z"
        fill={`url(#${id + "snow"})`}
      />
      <path
        d="m463 164 40 93 47 7 109 41-196-141ZM148 215l31 76 123 5Z"
        fill="#a8c6d9"
      />
      <path d="M0 329Q240 286 441 316T1000 311V340H0" fill="#fff" />
      <path
        d="M654 291Q499 300 527 322T422 340"
        fill="none"
        stroke="#d1a25b"
        strokeWidth="3"
        strokeDasharray="5 9"
      />
      {[34, 70, 96, 865, 894, 930, 956].map((x, i) => (
        <g key={x} transform={`translate(${x} ${300 + (i % 3) * 9})`}>
          <path
            d="m0-46-17 31h10l-16 25h46L7-15h10Z"
            fill={i % 2 ? "#315b70" : "#477a8b"}
          />
          <path d="M0 5v15" stroke="#315b70" strokeWidth="4" />
        </g>
      ))}
    </svg>
  );
}
export function Bestik({ pose = "welcome" }: { pose?: "welcome" | "explain" }) {
  return (
    <svg
      className={`bestik bestik-${pose}`}
      viewBox="0 0 280 290"
      role="img"
      aria-label={
        pose === "welcome"
          ? "Бестик приветствует: оригинальный лисёнок в синем шарфе машет лапкой"
          : "Бестик объясняет: оригинальный лисёнок указывает на две лыжи"
      }
    >
      <ellipse cx="138" cy="272" rx="94" ry="10" fill="#c8dce8" />
      <path d="M166 221Q264 243 253 164q-50 9-65 46" fill="#d46b31" />
      <path d="M253 164q-7 43-34 49l-12-19q19-23 46-30" fill="#fff3e3" />
      <path d="M95 182q43-21 83 0l12 68H83Z" fill="#ef9751" />
      <path d="M111 199q25-14 51 0l11 47h-70Z" fill="#fff3e3" />
      <path d="m100 241-9 22h32l5-19m25-1 1 20h34l-12-23" fill="#173d58" />
      <path
        d="M85 191 60 210 46 192"
        fill="none"
        stroke="#de813c"
        strokeWidth="20"
        strokeLinecap="round"
      />
      {pose === "welcome" ? (
        <path
          d="M180 191q35-25 23-55"
          fill="none"
          stroke="#de813c"
          strokeWidth="20"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path
            d="m180 195 37 11 20-13"
            fill="none"
            stroke="#de813c"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M216 236h44m-44 13h44"
            stroke="#173d58"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      )}
      <path
        d="M72 88 74 24 116 59q23-6 47 0l42-35 3 68 19 53-85 51-90-51Z"
        fill="#e68941"
      />
      <path d="m85 48 2 45 22-22m84-23-2 45-22-22" fill="#8c422b" />
      <path d="m70 118 65 29 72-29-12 39-54 27-56-27Z" fill="#fff4e5" />
      <ellipse cx="107" cy="116" rx="7" ry="10" fill="#173d58" />
      <ellipse cx="170" cy="116" rx="7" ry="10" fill="#173d58" />
      <circle cx="109" cy="113" r="2.5" fill="white" />
      <circle cx="172" cy="113" r="2.5" fill="white" />
      <path d="m130 144 10 9 11-9q-11-9-21 0" fill="#173d58" />
      <path
        d="M129 163q11 9 22-1"
        fill="none"
        stroke="#8c422b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M89 179q48 25 100 0l-6 21q-47 20-93-1Z" fill="#1b5878" />
      <path d="m167 197 14 29 19-9-18-29" fill="#1b5878" />
      <path d="m179 213 17-7" stroke="#d8b575" strokeWidth="4" />
    </svg>
  );
}
export function MountainArt({ kids = false }: { kids?: boolean }) {
  return (
    <div className={`mountain-scene ${kids ? "fox-scene" : ""}`}>
      <AlpinePanorama kids={kids} />
      {kids && <Bestik />}
    </div>
  );
}
export function SkiViews({
  view,
  selected = false,
}: {
  view: "top" | "side" | "front";
  selected?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 180 125"
      role="img"
      aria-label={`Условная схема: ${view === "top" ? "вид сверху, две лыжи" : view === "side" ? "вид сбоку, лыжи перекрываются" : "вид спереди, короткая проекция лыж"}`}
    >
      <rect
        x="2"
        y="2"
        width="176"
        height="121"
        rx="18"
        fill={selected ? "#e5f0e9" : "#f1f5f4"}
      />
      {view === "top" ? (
        <g fill="#3d7167">
          <rect x="59" y="12" width="15" height="102" rx="8" />
          <rect x="106" y="12" width="15" height="102" rx="8" />
          <rect x="60" y="54" width="13" height="23" rx="4" fill="#f0a36b" />
          <rect x="107" y="54" width="13" height="23" rx="4" fill="#f0a36b" />
        </g>
      ) : view === "side" ? (
        <g fill="none" strokeLinecap="round">
          <path d="M32 105H144l9-5" stroke="#3d7167" strokeWidth="7" />
          <path d="m95 96-23-27 15-31" stroke="#314b54" strokeWidth="12" />
          <circle cx="92" cy="23" r="12" fill="#e5945e" />
          <path d="m87 43 21 23" stroke="#e5945e" strokeWidth="9" />
        </g>
      ) : (
        <g strokeLinecap="round">
          <path
            d="m70 98 3-36h34l4 36"
            fill="none"
            stroke="#314b54"
            strokeWidth="12"
          />
          <path d="M72 61V42h35v19Z" fill="#e5945e" />
          <circle cx="89" cy="25" r="13" fill="#314b54" />
          <path d="M61 105h23m16 0h23" stroke="#3d7167" strokeWidth="8" />
        </g>
      )}
    </svg>
  );
}
