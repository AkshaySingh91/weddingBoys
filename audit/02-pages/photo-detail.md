# Page audit — Photo detail (`/photos/[photoId]`)

Captured: `/photos/6804a822f012e5e291abebe2`.

| | mobile | tablet |
|---|---:|---:|
| LCP | 376ms | 196ms |
| CLS | 0 | **0.195** |
| Total blocking | 0ms | 82ms |
| Oversized images | 8 | **20** |
| `<h1>` count | **0** | **0** |

## D-PDET-01 — No `<h1>`; the page's first heading is "More like this" — **High**

A photograph's own detail page gives no heading describing the photograph, the
wedding, the couple or the location. The heading outline is:

```
h2  More like this
h3  Cinematic Love Stories, Delivered to Your Inbox   (footer)
```

The primary content of the page is structurally unlabelled.

## D-PDET-02 — 18.9× oversized images — **High**

`6048×4032` served into a `320×320` thumbnail (**18.9×**) and into a `752×352`
hero (**8×**). 20 oversized images at tablet width.

## D-PDET-03 — CLS 0.195 at tablet — **Medium**

Approaching the 0.25 "poor" threshold. Sources recorded as
`div.absolute.bottom-6` (the caption overlay) with a 0.1909 shift at 257ms —
the same overlay pattern that drives `/photos`.
