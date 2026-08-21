type Props = { tipo?: "error" | "info"; children: React.ReactNode };

export function Aviso({ tipo = "error", children }: Props) {
  const estilos =
    tipo === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
      : "border-border bg-surface-2 text-text-muted";

  return (
    <p role={tipo === "error" ? "alert" : "status"} className={`rounded-lg border px-3.5 py-2.5 text-sm ${estilos}`}>
      {children}
    </p>
  );
}
