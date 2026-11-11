'use client';

/**
 * Play films in place, with a queue.
 *
 *   const { play, player } = useFilmPlayer(allFilms);
 *   <FilmCard onPlay={(f) => play(f, railFilms)} />   …   {player}
 *
 * - opens FilmLightbox over the page (no navigation) and shows ?watch=<id> in
 *   the address, so the film can be shared; Back closes it
 * - "Up next" is the film after it in the list it was opened from (the rail, or
 *   the current filter results), wrapping round; it starts by itself when the
 *   film ends (FilmLightbox handles the countdown)
 * - arriving on a ?watch=<id> link opens that film
 */
import { useCallback, useEffect, useState } from 'react';
import FilmLightbox from '@/Component/FilmLightbox.jsx';
import { coupleOf, blurbOf, filmHref, filmId, playSrc } from '@/lib/films.js';

const watchUrl = (f) => {
    const u = new URL(window.location.href);
    u.searchParams.set('watch', filmId(f));
    return `${u.pathname}${u.search}${u.hash}`;
};

/**
 * Chips for the player's story panel: the film's event and labels, each a way
 * into the library — the category when one has that title, else a search.
 */
function chipsFor(film, rows) {
    const byTitle = new Map(rows.map((r) => [r.title.toLowerCase(), r.key]));
    const labels = [...new Set([film.event === 'Wedding / Pheras' ? 'Wedding' : film.event, ...(film.labels || [])].filter(Boolean))].slice(0, 6);
    return labels.map((label) => {
        const key = byTitle.get(label.toLowerCase());
        return { label, href: key ? `/allfilms?category=${encodeURIComponent(key)}` : `/allfilms?q=${encodeURIComponent(label)}` };
    });
}

export default function useFilmPlayer(allFilms = [], rows = []) {
    const [state, setState] = useState(null);   // { film, queue }

    const play = useCallback((film, queue) => {
        if (!playSrc(film)) { window.location.assign(filmHref(film)); return; }
        setState({ film, queue: (queue?.length ? queue : allFilms).filter((f) => playSrc(f)) });
    }, [allFilms]);

    // A shared ?watch=<id> link opens that film once the page is up.
    useEffect(() => {
        const id = new URLSearchParams(window.location.search).get('watch');
        if (!id) return;
        const f = allFilms.find((x) => filmId(x) === id);
        if (!f) return;
        // Drop the param first so closing the player lands on the clean page.
        const u = new URL(window.location.href); u.searchParams.delete('watch');
        window.history.replaceState(null, '', `${u.pathname}${u.search}${u.hash}`);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to the arrival URL once
        play(f);
    }, [allFilms, play]);

    const film = state?.film;
    // The queue after this film: the first is Up next, then up to three more.
    const queue = [];
    if (film && state.queue.length > 1) {
        const i = state.queue.findIndex((f) => filmId(f) === filmId(film));
        for (let k = 1; k < Math.min(state.queue.length, 5); k += 1) {
            const next = state.queue[(i + k) % state.queue.length];
            if (filmId(next) !== filmId(film)) queue.push(next);
        }
    }
    const toItem = (f) => ({
        id: filmId(f), title: coupleOf(f), poster: f.thumbnailUrl, blurb: blurbOf(f),
        onPlay: () => setState((s) => ({ ...s, film: f })),
    });
    const [upNext, ...more] = queue.map(toItem);

    // "Also from this wedding": plays in place when the film is in the catalogue.
    const playId = (id) => {
        const f = allFilms.find((x) => filmId(x) === id && playSrc(x));
        if (!f) return false;
        setState((s) => ({ ...s, film: f }));
        return true;
    };

    const player = film ? (
        <FilmLightbox src={playSrc(film)} title={coupleOf(film)} poster={film.thumbnailUrl} href={filmHref(film)}
            url={watchUrl(film)} upNext={upNext || null} more={more.slice(0, 3)} onClose={() => setState(null)}
            meta={blurbOf(film)} chips={chipsFor(film, rows)} detailId={filmId(film)} playId={playId} />
    ) : null;

    return { play, player, playing: film || null };
}
