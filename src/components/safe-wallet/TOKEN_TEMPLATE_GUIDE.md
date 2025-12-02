# Safe Wallet Token Template Guide

This document explains, end to end, how to add a new **token template** to the
Safe Wallet experience. A template is composed of four pieces:

> metadata → form & validation → job handler (and optional dynamic script) →
> token visibility

```
CreateJobModal ──► ExpandableTemplateSection
                      └─► RenderTemplate.tsx ─ UI component
TemplateParams (state) ─► handlers/index.ts ──► create<Job> handler ──► sdk-triggerx
```

The existing **ETH Balance Maintainer** template is a complete example of the
flow described below.

---

## 0. Choose a template id

Pick a unique identifier (e.g. `"balance-maintainer"`). The same id is used in
every file touched in the following steps.

---

## 1. Describe the template (`src/data/templates.json`)

Add an entry with:

- `id` – the template id chosen above
- `tokenTemplateTitle` – the label shown in the UI
- Optional description / image / ordering metadata already used by the file

`CreateJobModal` reads this file to drive the list of available templates.

---

## 2. Define parameter schema & validation

Update `src/components/safe-wallet/token-templates/validations/templateFields.ts`
and add an entry under your template id. Each key represents a section inside
the icon strip (e.g. `"targetFunction"`, `"timeFrame"`, `"timeInterval"`).

Each field in the section:

```ts
{
  name: "contractAddress",
  label: "Contract Address",
  type: "text" | "number" | "boolean",
  placeholder: "...",
  rules: { required: true, type: "address" }
}
```

The validation helpers in `parameterValidation.ts` consume this structure to
return per-field errors and the modal uses those errors to toggle the “Create”
button.

**Tip:** Template params are always string-based. Convert to numbers/booleans
inside your handler.

---

## 3. Build the UI form

Create a component in
`src/components/safe-wallet/token-templates/ui-templates/`.

Example `BalanceMaintainerTemplate.tsx` illustrates the pattern:

- Keep internal state so the template works standalone _and_ when controlled by
  the modal
- Use `TokenJobParamsForm` to render each field section defined in
  `templateFields`
- Supply `customContent` to `JobParamIconsStrip` so clicking an icon shows the
  right form section
- Export the props and param types so the renderer (next step) can pass them
  through

Register the component in
`src/components/safe-wallet/safe-tokens/RenderTemplate.tsx`:

```tsx
case "your-template-id":
  return (
    <YourTemplateComponent
      params={context?.params as YourTemplateParams}
      onParamsChange={...}
      errors={context?.errors}
    />
  );
```

`ExpandableTemplateSection` uses this renderer to show the form when the user
expands a template card.

---

## 4. Create the job handler

Add a handler in
`src/components/safe-wallet/token-templates/handlers/<yourTemplate>.ts`.

The handler receives `TemplateHandlerContext` containing:

- `createJob` – the function returned from `useCreateJob`
- Safe wallet metadata (`safeAddress`, `autotopupETH`, `userBalance`, etc.)
- `chainId`
- `templateParams` – dictionary of string values gathered from the UI component

Responsibilities of the handler:

1. Validate mandatory fields (e.g. contract address, minimum balance)
2. Convert strings to appropriate types and fall back to defaults
3. Optional: generate a dynamic script and upload it to IPFS  
   (`dynamic-scripts/balanceMaintainer.ts` + `uploadToPinata` is the reference)
4. Build a `CreateJobInput` object (make sure `walletMode: "safe"` and
   `safeAddress` are present)
5. Call `createJob(jobInput)` and return its result

Register the handler in
`src/components/safe-wallet/token-templates/handlers/index.ts`:

```ts
import { createYourTemplateJob } from "./createYourTemplateJob";

const handlerMap = {
  "your-template-id": createYourTemplateJob,
  // ...existing mappings
};
```

`CreateJobModal` uses `hasTemplateHandler` and `runTemplateHandler` so no further
modal changes are required.

---

## 5. Optional: dynamic Go script helpers

If the handler needs to generate a Go script that is uploaded to IPFS (like the
balance maintainer), place a helper in
`src/components/safe-wallet/token-templates/dynamic-scripts/`. These helpers
should take a plain options object and return the Go source code string.

The handler can then call `uploadTextToPinata(script, "filename.go")` to obtain
an `ipfs://...` URL and pass it via `dynamicArgumentsScriptUrl`.

---

## 6. Map tokens to templates

Update `src/utils/tokenTemplateMap.ts` so the new template appears for the
desired tokens in Safe Wallet. `filterTemplatesForToken` reads this map and the
modal only shows templates returned by that helper.

- Add token symbols as keys (e.g. `"WETH"`, `"USDC"`)
- Use the wildcard `"*"` to make a template visible for every token
- Each map entry is an array of template ids

---

## 7. Verify the integration

1. Select a token in Safe Wallet and open “Create Job”
2. Ensure the new template card appears (metadata + mapping)
3. Expand the template and confirm the form renders with validation
4. Submit the job and verify the handler runs (the handler determines the final
   payload submitted to `sdk-triggerx`)

`CreateJobModal` now treats every template the same way—the “Create Job” button
is enabled whenever `isValidTemplateParams(id, params)` returns `true`, so no
handler-specific branching remains in the modal.

---

## 8. Shared logic & helpful references

- `TokenJobParamsForm.tsx` – base input component used by every section
- `JobParamIconsStrip.tsx` / `buildIconItems.tsx` – icon strip rendering and
  custom content injection
- `parameterValidation.ts` – engine that turns `templateFields` into error maps
- `useCreateJob.ts` – single hook that signs and submits jobs (safe and regular
  wallets)
- `types/sdk-job.ts` – API payload definitions; extend if your handler needs
  additional fields

Following the steps above keeps template logic modular: UI lives inside
`token-templates/ui-templates`, validation is centralized in
`templateFields.ts`, every handler lives under `token-templates/handlers`, all
job creation funnels through `useCreateJob`, and visibility is managed in
`tokenTemplateMap.ts`.
