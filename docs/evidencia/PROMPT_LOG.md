# Registro de prompts al agente de código

Evidencia de rúbrica: *Coding/build evidence* (≥5 prompts por semana).
Una entrada por sesión de trabajo con el agente. Se llena **durante** el trabajo, no al final.

Formato:

```
## [YYYY-MM-DD] — Sesión N
**Prompt:** lo que se le pidió al agente (textual o resumido fielmente)
**Resultado:** qué produjo
**Juicio humano:** qué se aceptó, qué se rechazó y por qué
**Commit:** hash
```

---

## [2026-08-19] — Sesión 1
**Prompt:** Se entregó al agente `VESTIA-DOCUMENTO-MAESTRO.md` sin más instrucción, con la
indicación implícita de ejecutarlo desde §0.
**Resultado:** auditoría de la máquina (toolchain vacío), scaffold del repo, transcripción de la
migración 001 desde el Apéndice B y redacción de la migración 002 con las piezas faltantes
(trigger de `profiles`, débito atómico de créditos, buckets de Storage).
**Juicio humano:** pendiente de revisión por Tamara. El agente se detuvo antes de instalar
software de sistema y antes de crear cuentas — ambos pasos requieren a una persona.
**Commit:** (ver commit inicial)
