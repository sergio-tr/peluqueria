# AI provider

## Abstracción

```ts
interface HairTryOnProvider {
  createPrediction(input: HairTryOnInput): Promise<{ externalId: string }>;
  // webhook path handled by application layer
}
```

Implementaciones:

| Provider | Uso |
|----------|-----|
| `ReplicateQwenHairProvider` | Producción (`AI_PROVIDER=replicate-qwen`) |
| `MockHairProvider` | Local, unit, E2E, CI, contingencia explícita |
| `ModalHairFastProvider` | No implementado; ADR futuro |

## Producción

- `AI_PROVIDER=replicate-qwen`
- `REPLICATE_MODEL=qwen/qwen-image-edit-plus`
- Sin exigir `REPLICATE_MODEL_VERSION`
- Si falta token/config → error “servicio no disponible” (no mock silencioso)
- Todo resultado mock: marca UI inequívoca “Demostración”

## Prompt (versionado `prompt_version`)

Conservar identidad facial, expresión, piel, ropa, fondo; modificar solo cabello; copiar forma/longitud/textura/silueta de la referencia; realista; sin accesorios; sin cambiar edad ni rasgos. + `prompt_modifier` por hairstyle.

## Persistencia por prediction

`provider`, `model`, `external_prediction_id`, `reported_model_version`, `prompt_version`, `input_parameters_json` (sin signed URLs caducadas ni PII), `estimated_cost_usd`.

## Límites (env)

```bash
AI_MAX_GENERATIONS_PER_SESSION=3
AI_MAX_GENERATIONS_PER_IP_DAY=10
AI_MAX_GENERATIONS_PER_MONTH=500
AI_MAX_CONCURRENT_PER_SESSION=1
AI_ESTIMATED_COST_PER_OUTPUT_USD=0.03
AI_GENERATION_ENABLED=true
```

- Contadores en DB; IP → hash con secreto (`IP_HASH_SECRET`); sin IP en claro.
- Resistentes a carrera (upsert atómico / unique + check).
- Kill switch `AI_GENERATION_ENABLED=false`.
- Panel admin: gens mes, éxitos, fallos, coste estimado.
- Presupuesto conceptual ~30 €/mes (500 × 0.03 USD ≈ orden de magnitud).

## Flujo async

Ver `architecture.md` y ADR webhook. Fallback poll Replicate solo admin recovery.

## Benchmark

Ver `ai-benchmark.md`: smoke 16 → matriz 48; ≥80 % enseñables antes de demo pública. Sin fotos personales en Git.

## Fallback futuro

Si calidad insuficiente: HairFastGAN / Stable-Hair en Modal — documentar, no implementar en MVP.
