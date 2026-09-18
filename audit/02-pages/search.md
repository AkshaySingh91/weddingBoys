# Page audit — Search results (`/search-result`)

| | mobile | tablet | laptop | desktop |
|---|---:|---:|---:|---:|
| LCP | **2,804ms** | 180ms | 124ms | 176ms |
| CLS | 0 | 0 | 0 | 0 |
| `<h1>` count | **0** | **0** | **0** | **0** |
| Low-contrast text | 3 | 3 | 3 | 3 |

## D-SRCH-01 — The page has no headings of its own at all — **High**

Complete heading outline:

```
h3  Cinematic Love Stories, Delivered to Your Inbox   (footer newsletter)
h4  Explore / Editorial Journal / Royal Destinations / Studio Inquiries  (footer)
```

Every heading on the search-results page belongs to the **footer**. There is no
`<h1>`, no result-count heading, and no statement of what was searched for.

A visitor who lands here after searching has no textual confirmation of their
query, and assistive technology announces the page as though it were the footer.

## D-SRCH-02 — Mobile LCP 2,804ms against 124ms at laptop — **High**

A **22×** gap. The largest desktop/mobile divergence measured on the site. The
LCP element is `div.flex.flex-col.gap-1` — a text block, meaning the page's
largest paint is blocked behind client-side data fetching rather than an image.

## D-SRCH-03 — Empty and error states not verifiable — **Medium** (finding recorded, per brief)

The captured state renders no results and no message. Whether this is the empty
state, a loading state or a failure could not be determined from the rendered
output — there is no text distinguishing them. That absence is itself the
finding: **a search page that returns nothing tells the visitor nothing.**
