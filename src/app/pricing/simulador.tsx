"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  calcular,
  ESCENARIOS,
  pesos,
  porcentaje,
  SEGMENTOS,
  SUPUESTOS_INICIALES,
  type Escenario,
  type Segmento,
  type Supuestos,
} from "@/lib/precios";

import { guardarEscenario, type EstadoGuardado } from "./actions";

const INICIAL: EstadoGuardado = { estado: "vacio" };

/**
 * The simulator. It calculates in the browser so the number moves while the
 * control moves; when saving, the server does the same calculation and saves its
 * own. Both call the same function: `src/lib/precios.ts`.
 */
export function Simulador() {
  const [s, setS] = useState<Supuestos>(SUPUESTOS_INICIALES);
  const [estado, accion, guardando] = useActionState(guardarEscenario, INICIAL);
  const router = useRouter();

  const r = useMemo(() => calcular(s), [s]);
  const comparacion = useMemo(
    () => ESCENARIOS.map((e) => ({ ...e, neto: calcular({ ...s, escenario: e.id }).total.ingresoNeto })),
    [s],
  );
  const mayor = Math.max(...comparacion.map((c) => Math.abs(c.neto)), 1);

  const cambiarRegistros = (seg: Segmento, valor: number) =>
    setS((p) => ({ ...p, registros: { ...p.registros, [seg]: Math.max(0, Math.round(valor)) } }));
  const cambiarTasa = (campo: "compranCompleto" | "compranRecarga", seg: Segmento, pct: number) =>
    setS((p) => ({ ...p, [campo]: { ...p[campo], [seg]: Math.min(1, Math.max(0, pct / 100)) } }));

  return (
    <div data-testid="simulador" className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* ----------------------------------------------------- The controls */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs tracking-[0.14em] text-text-muted uppercase">Assumptions</p>

        <div role="group" aria-label="Scenario" className="mt-4 flex flex-wrap gap-2">
          {ESCENARIOS.map((e) => (
            <button
              key={e.id}
              type="button"
              data-escenario={e.id}
              aria-pressed={s.escenario === e.id}
              onClick={() => setS((p) => ({ ...p, escenario: e.id as Escenario }))}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                s.escenario === e.id ? "border-text bg-bg font-medium" : "border-border text-text-muted hover:border-text"
              }`}
            >
              {e.nombre}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-text-muted">
          {ESCENARIOS.find((e) => e.id === s.escenario)?.nota} The scenario moves conversion, never the
          price.
        </p>

        <div className="mt-6 space-y-5">
          {SEGMENTOS.map((seg) => (
            <fieldset key={seg.id} className="rounded-xl border border-border p-4">
              <legend className="px-1.5 text-sm font-medium">{seg.nombre}</legend>
              <p className="text-sm text-text-muted">{seg.detalle}</p>

              <Campo
                id={`registros-${seg.id}`}
                etiqueta="New sign-ups per month"
                valor={s.registros[seg.id]}
                min={0}
                max={5000}
                paso={10}
                onChange={(v) => cambiarRegistros(seg.id, v)}
              />
              <Campo
                id={`completo-${seg.id}`}
                etiqueta="Out of 100, how many buy the Complete plan"
                sufijo="%"
                valor={Number((s.compranCompleto[seg.id] * 100).toFixed(1))}
                min={0}
                max={100}
                paso={0.5}
                onChange={(v) => cambiarTasa("compranCompleto", seg.id, v)}
              />
              <Campo
                id={`recarga-${seg.id}`}
                etiqueta="Out of 100 who paid, how many buy a top-up each month"
                sufijo="%"
                valor={Number((s.compranRecarga[seg.id] * 100).toFixed(1))}
                min={0}
                max={100}
                paso={0.5}
                onChange={(v) => cambiarTasa("compranRecarga", seg.id, v)}
              />
            </fieldset>
          ))}

          <Campo
            id="creditos"
            etiqueta="Try-on credits a paying customer uses per month"
            valor={s.creditosAlMes}
            min={0}
            max={60}
            paso={1}
            onChange={(v) => setS((p) => ({ ...p, creditosAlMes: Math.max(0, v) }))}
          />
        </div>
      </div>

      {/* ----------------------------------------------------- The result */}
      <div>
        <div data-testid="resultado" className="grid grid-cols-3 gap-3">
          <Cifra etiqueta="Net income per month" valor={pesos(r.total.ingresoNeto)} testid="neto-mensual" />
          <Cifra etiqueta="Over 12 months" valor={pesos(r.anual.ingresoNeto)} testid="neto-anual" />
          <Cifra etiqueta="Margin" valor={porcentaje(r.total.margen)} testid="margen" />
        </div>

        <p className="mt-3 text-sm text-text-muted">
          Of the {pesos(r.total.ingresoBruto)} customers would pay per month, Stripe keeps{" "}
          {pesos(r.total.comisiones)} and running the product costs {pesos(r.total.costoVariable)}.
        </p>

        {/* Scenario comparison, as CSS bars */}
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs tracking-[0.14em] text-text-muted uppercase">
            The three scenarios, with these same sign-ups
          </p>
          <ul className="mt-5 flex h-36 items-end gap-4">
            {comparacion.map((c) => (
              <li key={c.id} className="flex h-full flex-1 flex-col justify-end text-center">
                <p className="mb-1 text-sm font-medium">{pesos(c.neto)}</p>
                <div
                  data-barra={c.id}
                  className={`rounded-t-lg border border-b-0 ${
                    c.id === s.escenario ? "border-text" : "border-border"
                  }`}
                  style={{
                    height: `${Math.max(4, (Math.abs(c.neto) / mayor) * 100)}%`,
                    background: c.neto < 0 ? "var(--barro)" : c.id === s.escenario ? "var(--barro)" : "var(--surface-2, #efe9df)",
                    opacity: c.neto < 0 ? 0.45 : 1,
                  }}
                />
                <p className="mt-2 border-t border-border pt-2 text-xs text-text-muted">{c.nombre}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-text-muted">
            Each bar adds up both segments. A pale bar is a month that loses money.
          </p>
        </div>

        {/* By segment */}
        <table className="mt-6 w-full border-collapse text-sm">
          <caption className="sr-only">Result by segment</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-[0.1em] text-text-muted uppercase">
              <th scope="col" className="py-2">Segment</th>
              <th scope="col" className="py-2 text-right">Buyers</th>
              <th scope="col" className="py-2 text-right">Net per month</th>
              <th scope="col" className="py-2 text-right">Margin</th>
            </tr>
          </thead>
          <tbody>
            {r.porSegmento.map((seg, i) => (
              <tr key={seg.segmento} data-segmento={seg.segmento} className="border-b border-border">
                <td className="py-2.5">{SEGMENTOS[i].nombre}</td>
                <td className="py-2.5 text-right tabular-nums">{Math.round(seg.compradores)}</td>
                <td className="py-2.5 text-right tabular-nums">{pesos(seg.ingresoNeto)}</td>
                <td className="py-2.5 text-right tabular-nums">{porcentaje(seg.margen)}</td>
              </tr>
            ))}
            <tr className="font-medium">
              <td className="py-2.5">Total</td>
              <td className="py-2.5 text-right tabular-nums">{Math.round(r.total.compradores)}</td>
              <td className="py-2.5 text-right tabular-nums">{pesos(r.total.ingresoNeto)}</td>
              <td className="py-2.5 text-right tabular-nums">{porcentaje(r.total.margen)}</td>
            </tr>
          </tbody>
        </table>

        {/* Save */}
        <form
          action={(fd) => {
            fd.set("supuestos", JSON.stringify(s));
            accion(fd);
            // The list below is rendered by the server: it has to be asked to re-render.
            setTimeout(() => router.refresh(), 400);
          }}
          className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-5"
        >
          <div className="min-w-56 flex-1">
            <label htmlFor="nombre" className="block text-sm font-medium">
              Save this scenario
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              maxLength={60}
              placeholder="For example: 400 sign-ups, 3% pay"
              className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-full border border-text px-5 py-2 text-sm transition hover:bg-text hover:text-bg disabled:opacity-50"
          >
            {guardando ? "Saving…" : "Save"}
          </button>
          <p className="w-full text-xs text-text-muted">
            It is saved publicly, without an account: don’t put personal details in the name. What gets
            saved is the result the server calculates with these assumptions.
          </p>
          {estado.estado === "error" ? (
            <p role="alert" className="w-full text-sm" style={{ color: "var(--barro)" }}>
              {estado.mensaje}
            </p>
          ) : null}
          {estado.estado === "guardado" ? (
            <p role="status" className="w-full text-sm text-text-muted">
              Saved: “{estado.nombre}”, with {pesos(estado.ingresoNeto)} net income per month.
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}

function Campo({
  id,
  etiqueta,
  valor,
  min,
  max,
  paso,
  sufijo,
  onChange,
}: {
  id: string;
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  sufijo?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm">
          {etiqueta}
        </label>
        <span className="text-sm font-medium tabular-nums">
          {valor}
          {sufijo ?? ""}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <input
          id={`${id}-rango`}
          type="range"
          aria-label={`${etiqueta} (slider)`}
          value={valor}
          min={min}
          max={max}
          step={paso}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 flex-1 accent-current"
        />
        <input
          id={id}
          type="number"
          value={valor}
          min={min}
          max={max}
          step={paso}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-right text-sm tabular-nums"
        />
      </div>
    </div>
  );
}

function Cifra({ etiqueta, valor, testid }: { etiqueta: string; valor: string; testid: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs tracking-[0.14em] text-text-muted uppercase">{etiqueta}</p>
      <p data-testid={testid} className="mt-1.5 font-display text-2xl font-semibold tabular-nums">
        {valor}
      </p>
    </div>
  );
}
