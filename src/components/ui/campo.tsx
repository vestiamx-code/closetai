import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  ayuda?: string;
};

export function Campo({ etiqueta, ayuda, id, ...props }: Props) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {etiqueta}
      </label>
      <input
        id={inputId}
        {...props}
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-base outline-none transition placeholder:text-text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      {ayuda ? <p className="text-xs text-text-muted">{ayuda}</p> : null}
    </div>
  );
}
