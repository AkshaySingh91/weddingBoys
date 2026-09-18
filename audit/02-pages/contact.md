# Page audit — Contact (`/contact`)

The primary conversion path. Source:
`app/(site)/contact/_components/ContactClient.jsx`.

| | mobile | tablet | laptop | desktop |
|---|---:|---:|---:|---:|
| LCP | 368ms | 160ms | 236ms | 188ms |
| CLS | 0 | 0 | 0 | 0 |
| Total blocking | 0ms | 102ms | **129ms** | 123ms |
| Low-contrast text | 4 | 4 | 4 | 4 |
| Touch targets < 24px | 16 | 16 | 16 | 16 |

## D-CONT-01 — An invalid submission fails silently — **Critical**

`ContactClient.jsx:189` wraps the entire submit in a single guard:

```js
if (bride.trim() && groom.trim() && contact.trim() && reach.trim()
    && eventDate.start.trim() && eventDate.end.trim()
    && (validateEmail(contact) || validatePhone(contact))) {
   … submit …
}
```

There is **no `else`**. If any field is empty or the contact value fails
validation, clicking **Submit** does *nothing at all*: no message, no field
highlight, no scroll-to-error, no console output. The button appears inert.

For a studio whose entire digital funnel terminates at this form, an enquiry that
silently evaporates is the most expensive defect on the site. A visitor who mis-types
an email — or simply leaves "Where did you find us?" blank — concludes the
business is broken and leaves.

## D-CONT-02 — Required-ness is inverted between the labels and the logic — **Critical**

| Field | Label says | Validation requires | `required` attribute |
|---|---|---|---|
| Bride's Name | `*` | ✅ yes | ❌ none |
| Groom's Name | `*` | ✅ yes | ❌ none |
| Phone or Email | `*` | ✅ yes | ❌ none |
| Date (From) | *no asterisk* | ✅ **yes** | ❌ none |
| Date (To) | *no asterisk* | ✅ **yes** | ❌ none |
| Where did you find us? | *no asterisk* | ✅ **yes** | ❌ none |

Three fields are mandatory without being marked so, and no field carries the HTML
`required` attribute — so the browser's own validation, error messaging and
focus management never engage. Combined with D-CONT-01, a visitor who skips the
unmarked "Where did you find us?" field gets a dead button and no explanation.

## D-CONT-03 — The form cannot be submitted by keyboard — **Critical** (accessibility)

`ContactClient.jsx:327` — the button is `type="button"`, and the `<form>` has no
`onSubmit` handler. Pressing **Enter** in any field therefore does nothing. The
`<form>` element is decorative; submission happens only via `onClick`.

This breaks the single most common form interaction and fails WCAG 2.2 §2.1.1
(Keyboard) for the conversion path.

## D-CONT-04 — The primary CTA is the weakest button on the site — **High**

`bg-tertiary` resolves to **`#5E6572`** (`tailwind.config.js:54`) — a slate grey
that appears in no other CTA. Every decorative "View All" and the footer's
"Subscribe" outrank the studio's booking button visually.

| | Contact Submit | Footer CTA |
|---|---|---|
| Background | `#5E6572` slate | `#FF5353` coral |

## D-CONT-05 — Phone/email share one untyped field; international numbers are rejected — **High**

One `type="text"` input accepts either. Consequences:

1. **Mobile keyboards do not adapt** — no `type="email"` or `type="tel"`, so a
   phone-first audience gets a full QWERTY keyboard for a numeric entry.
2. `validatePhone = /^[0-9]{10}$/` accepts **exactly ten digits and nothing
   else**. No country code, no `+`, no spaces. Every international number fails —
   on a site whose footer advertises "worldwide destinations".

A destination-wedding enquiry from abroad cannot be submitted, and (per
D-CONT-01) is not told why.

## D-CONT-06 — "Where did you find us?" is free text — **Medium**

`type="text"` with placeholder "Google, Instagram, Referral, etc". It is
mandatory (D-CONT-02) yet unconstrained, so the studio's attribution data will be
unusable and the visitor is made to type an answer that should be one tap.

## D-CONT-07 — Feedback is SweetAlert2 modals, outside the design system — **Medium**

Success, error and loading states are `Swal.fire()` modals — a third-party visual
language with no relationship to the brand. Two further problems:

- the **error** modal is dismissed automatically after **1,000ms**
  (`timer: 1000`), so the only explanation a user ever receives disappears in one
  second;
- the success copy reads *"Your message has been **revived**"* — should be
  *received*. The typo is on the confirmation screen of the booking form.

## D-CONT-08 — Native date inputs, unstyled — **Medium**

Two `type="date"` controls render the platform's `dd/mm/yyyy` widget with the OS
calendar. Against a form using 6px radii and custom borders, they are visibly
foreign, and their placeholder format is the browser's, not the studio's.

## D-CONT-09 — The WhatsApp button does not pin below 640px — **High**

`ContactClient.jsx:34`:

```jsx
className="fixed lg:bottom-4 lg:right-4 sm:bottom-10 sm:right-4 z-50"
```

There is **no base (mobile-first) `bottom`/`right`**. Below `sm` (640px) the
element is `position: fixed` with `bottom: auto; right: auto`, so it renders at
its static flow position — at the bottom of the contact section — rather than
floating. On the viewport where a floating WhatsApp affordance matters most, it
is not floating.

It also runs **12 particles on `repeat: Infinity`** (`fireworkVariants`), in
`#ff8800` — a ninth off-palette accent — and animates perpetually regardless of
`prefers-reduced-motion` (see `05-ACCESSIBILITY.md`).

## D-CONT-10 — Sub-heading at 2.54:1 — **High**

"We would love to hear from you. Please fill out this form…" renders `#9CA3AF`
(Tailwind `gray-400`) on `#FFFFFF` = **2.54:1** at 16px, against a 4.5
requirement. The page's only explanatory copy is its least legible text.

## Interaction-state coverage

| State | Present |
|---|---|
| Hover | ✅ `hover:bg-tertiary_on` |
| Focus | ⚠️ `focus:ring-2 focus:ring-tertiary` — `:focus`, not `:focus-visible` |
| Validation error | ❌ **none** |
| Field-level error | ❌ **none** |
| Loading | ✅ Swal spinner |
| Success | ⚠️ Swal modal, typo, 2s timer |
