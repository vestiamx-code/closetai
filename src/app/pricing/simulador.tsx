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
 * El simulador. Calcula en el navegador para que el número se mueva mientras se
 * mueve el control; al guardar, el servidor hace la misma cuenta y guarda la
 * suya. Las dos llaman a la misma función: `src/lib/precios.ts`.
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
      {/* ----------------------------------------------------- Los controles */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs tracking-[0.14em] text-text-muted uppercase">Supuestos</p>

        <div role="group" aria-label="Escenario" className="mt-4 flex flex-wrap gap-2">
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
          {ESCENARIOS.find((e) => e.id === s.escenario)?.nota} El escenario mueve la conversión, nunca
          el precio.
        </p>

        <div className="mt-6 space-y-5">
          {SEGMENTOS.map((seg) => (
            <fieldset key={seg.id} className="rounded-xl border border-border p-4">
              <legend className="px-1.5 text-sm font-medium">{seg.nombre}</legend>
              <p className="text-sm text-text-muted">{seg.detalle}</p>

              <Campo
                id={`registros-${seg.id}`}
                etiqueta="Registros nuevos al mes"
                valor={s.registros[seg.id]}
                min={0}
                max={5000}
                paso={10}
                onChange={(v) => cambiarRegistros(seg.id, v)}
              />
              <Campo
                id={`completo-${seg.id}`}
                etiqueta="De cada 100, cuántos compran el plan Completo"
                sufijo="%"
                valor={Number((s.compranCompleto[seg.id] * 100).toFixed(1))}
                min={0}
                max={100}
                paso={0.5}
                onChange={(v) => cambiarTasa("compranCompleto", seg.id, v)}
              />
              <Campo
                id={`recarga-${seg.id}`}
                etiqueta="De cada 100 que pagaron, cuántos compran recarga al mes"
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
            etiqueta="Créditos de try-on que usa al mes una persona de pago"
            valor={s.creditosAlMes}
            min={0}
            max={60}
            paso={1}
            onChange={(v) => setS((p) => ({ ...p, creditosAlMes: Math.max(0, v) }))}
          />
        </div>
      </div>

      {/* ----------------------------------------------------- El resultado */}
      <div>
        <div data-testid="resultado" className="grid grid-cols-3 gap-3">
          <Cifra etiqueta="Ingreso neto al mes" valor={pesos(r.total.ingresoNeto)} testid="neto-mensual" />
          <Cifra etiqueta="A 12 meses" valor={pesos(r.anual.ingresoNeto)} testid="neto-anual" />
          <Cifra etiqueta="Margen" valor={porcentaje(r.total.margen)} testid="margen" />
        </div>

        <p className="mt-3 text-sm text-text-muted">
          De {pesos(r.total.ingresoBruto)} que pagarían las clientas al mes, Stripe se queda{" "}
          {pesos(r.total.comisiones)} y servir el producto cuesta {pesos(r.total.costoVariable)}.
        </p>

        {/* Comparación de escenarios, en barras de CSS */}
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs tracking-[0.14em] text-text-muted uppercase">
            Los tres escenarios, con estos mismos registros
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
            Cada barra suma los dos segmentos. Una barra pálida es un mes que pierde dinero.
          </p>
        </div>

        {/* Por segmento */}
        <table className="mt-6 w-full border-collapse text-sm">
          <caption className="sr-only">Resultado por segmento</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-[0.1em] text-text-muted uppercase">
              <th scope="col" className="py-2">Segmento</th>
              <th scope="col" className="py-2 text-right">Compran</th>
              <th scope="col" className="py-2 text-right">Neto al mes</th>
              <th scope="col" className="py-2 text-right">Margen</th>
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

        {/* Guardar */}
        <form
          action={(fd) => {
            fd.set("supuestos", JSON.stringify(s));
            accion(fd);
            // La lista de abajo la pinta el servidor: hay que pedirle que se repinte.
            setTimeout(() => router.refresh(), 400);
          }}
          className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-5"
        >
          <div className="min-w-56 flex-1">
            <label htmlFor="nombre" className="block text-sm font-medium">
              Guardar este escenario
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              maxLength={60}
              placeholder="Por ejemplo: 400 registros, 3% paga"
              className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-full border border-text px-5 py-2 text-sm transition hover:bg-text hover:text-bg disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          <p className="w-full text-xs text-text-muted">
            Se guarda en público, sin cuenta: no escribas datos personales en el nombre. Lo que se
            guarda es el resultado que calcula el servidor con estos supuestos.
          </p>
          {estado.estado === "error" ? (
            <p role="alert" className="w-full text-sm" style={{ color: "var(--barro)" }}>
              {estado.mensaje}
            </p>
          ) : null}
          {estado.estado === "guardado" ? (
            <p role="status" className="w-full text-sm text-text-muted">
              Guardado: «{estado.nombre}» con {pesos(estado.ingresoNeto)} de ingreso neto al mes.
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
          aria-label={`${etiqueta} (deslizador)`}
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
