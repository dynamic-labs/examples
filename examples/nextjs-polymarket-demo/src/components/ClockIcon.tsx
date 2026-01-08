/** biome-ignore-all lint/correctness/useUniqueElementIds: <> */

export default function ClockIcon() {
  const p22e71600 =
    "M7.99306 14.654C11.6718 14.654 14.654 11.6718 14.654 7.99309C14.654 4.31438 11.6718 1.33219 7.99306 1.33219C4.31435 1.33219 1.33216 4.31438 1.33216 7.99309C1.33216 11.6718 4.31435 14.654 7.99306 14.654Z";
  const p16170780 = "M7.99307 3.99655V7.99309L10.6574 9.32527";

  return (
    <div className="relative shrink-0 size-[15.986px]">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 16 16"
        aria-label="Clock icon"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Clock icon</title>
        <g clipPath="url(#clip0_clock)" id="Frame">
          <path
            d={p22e71600}
            fill="var(--fill-0, #474D68)"
            id="Vector"
            stroke="var(--stroke-0, #474D68)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7128"
          />
          <g id="Vector_2">
            <path d={p16170780} fill="var(--fill-0, #474D68)" />
            <path
              d={p16170780}
              stroke="var(--stroke-0, #DDE2F6)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7128"
            />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_clock">
            <rect fill="white" height="15.9862" width="15.9862" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
