"use client";

import * as React from "react";
import { useActionState } from "react";
import { placesAutocomplete, placeDetails } from "@/actions/places";
import { Input } from "@/components/ui/input";

interface AddressAutocompleteProps {
  country?: string; // ISO-2 to restrict
  onPick: (details: {
    line1: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: string;
  }) => void;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export function AddressAutocomplete({
  country,
  onPick,
  defaultValue = "",
  onChange,
}: AddressAutocompleteProps) {
  const [query, setQuery] = React.useState(defaultValue);
  React.useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);
  const [token] = React.useState(() => crypto.randomUUID());
  const [predictions, submitSearchAction] = useActionState(
    placesAutocomplete as any,
    [] as any
  );

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const timer = React.useRef<number | null>(null);

  function debounceSearch(value: string) {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const fd = new FormData();
      fd.set("q", value);
      fd.set("token", token);
      if (country) fd.set("country", country);
      setLoading(true);
      const res = await (placesAutocomplete as any)(undefined, fd);
      setLoading(false);
      (predictions as any).splice(0, (predictions as any).length, ...res);
      setOpen(true);
    }, 300);
  }

  async function handlePick(placeId: string, description: string) {
    setOpen(false);
    const fd = new FormData();
    fd.set("placeId", placeId);
    fd.set("token", token);
    const res = await (placeDetails as any)(undefined, fd);
    if (res) {
      setQuery(res.line1);
      onPick(res);
    } else {
      // Fallback: keep minimal street text if details fail
      setQuery(description.split(",")[0] || description);
    }
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          onChange?.(val);
          if (val.length >= 3) debounceSearch(val);
          else setOpen(false);
        }}
        placeholder="Start typing address…"
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          {loading && (
            <div className="p-3 text-sm text-muted-foreground">Searching…</div>
          )}
          {!loading && (predictions as any).length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">No results</div>
          )}
          {!loading &&
            (predictions as any).map((p: any) => (
              <button
                key={p.place_id}
                type="button"
                className="w-full cursor-pointer p-3 text-left text-sm hover:bg-accent"
                onClick={() => handlePick(p.place_id, p.description)}
              >
                {p.description}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
