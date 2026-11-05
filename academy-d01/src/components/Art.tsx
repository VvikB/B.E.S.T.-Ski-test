export function MountainArt({ kids = false }: { kids?: boolean }) {
  return (
    <svg
      className="mountain-art"
      viewBox="0 0 580 390"
      role="img"
      aria-label={
        kids
          ? "Оригинальная иллюстрация: лисёнок на фоне условных гор"
          : "Оригинальная иллюстрация альпийского маршрута"
      }
    >
      <defs>
        <linearGradient id={kids ? "sky-k" : "sky-s"} x2="0" y2="1">
          <stop stopColor={kids ? "#fce8cb" : "#dbe9e9"} />
          <stop offset="1" stopColor="#f7faf8" />
        </linearGradient>
      </defs>
      <rect
        width="580"
        height="390"
        rx="26"
        fill={`url(#${kids ? "sky-k" : "sky-s"})`}
      />
      <circle cx="452" cy="82" r="38" fill={kids ? "#f2b64e" : "#eab788"} />
      <path
        d="M0 280 122 98 194 206 282 58 438 270 510 160 580 240V390H0Z"
        fill="#9cb6b5"
      />
      <path
        d="m87 150 35-52 72 108-47-26-23-42-15 27Zm142-19 53-73 59 80-37-18-22-27-21 46Z"
        fill="#f9fcfa"
      />
      <path d="M0 333 140 240 230 278 330 204 580 328V390H0Z" fill="#c7d7ce" />
      <path d="M0 369 Q138 307 281 318 T580 371V390H0Z" fill="#f9fcfa" />
      <path
        d="M316 239C440 277 166 285 263 328S396 354 331 386"
        fill="none"
        stroke="#e48a59"
        strokeWidth="3"
        strokeDasharray="6 7"
      />
      {[58, 472, 514].map((x, i) => (
        <g key={x} transform={`translate(${x} ${281 + i * 12})`}>
          <path d="m0-39-19 38h38Zm0-22-14 27h28Z" fill="#40655c" />
          <path d="M0 0v12" stroke="#40655c" strokeWidth="4" />
        </g>
      ))}
      {kids ? (
        <g transform="translate(295 210)">
          <path
            d="m-39-26 7-61 31 33 33-33 8 61 12 40-50 40-54-40Z"
            fill="#de8148"
          />
          <path d="m-28-25 27 18 28-18-11 49-18 12-17-13Z" fill="#fff3dc" />
          <path d="m-27-63 4 25 11-9Zm47 0-3 25-10-9Z" fill="#70453c" />
          <circle cx="-18" cy="-12" r="4" fill="#253e43" />
          <circle cx="17" cy="-12" r="4" fill="#253e43" />
          <path
            d="m-6 8 5 5 6-5"
            stroke="#253e43"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M-26 41Q0 25 27 41L44 92H-42Z" fill="#477773" />
          <path
            d="M-30 51 23 55"
            stroke="#f2b64e"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g transform="translate(300 247) rotate(14)">
          <path
            d="m-13 48 25-1m-17-4L-9 7 12 12 4 45"
            fill="none"
            stroke="#263d45"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path d="M-10 7-14-18 4-23 15 9Z" fill="#e78b58" />
          <path
            d="m-7-13-22 16m31-20 23 9"
            stroke="#e78b58"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cy="-37" r="12" fill="#263d45" />
          <path
            d="m-29 52 60-4m-53 13 62-4"
            stroke="#477773"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}
      <circle
        cx="316"
        cy="239"
        r="6"
        fill="#e48a59"
        stroke="white"
        strokeWidth="3"
      />
    </svg>
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
