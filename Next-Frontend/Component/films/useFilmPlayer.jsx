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

export default function useFilmPlayer(allFilms = []) {
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
    let upNext = null;
    if (film && state.queue.length > 1) {
        const i = state.queue.findIndex((f) => filmId(f) === filmId(film));
        const next = state.queue[(i + 1) % state.queue.length];
        if (next && filmId(next) !== filmId(film)) {
            upNext = {
                title: coupleOf(next), poster: next.thumbnailUrl, blurb: blurbOf(next),
                onPlay: () => setState((s) => ({ ...s, film: next })),
            };
        }
    }

    const player = film ? (
        <FilmLightbox src={playSrc(film)} title={coupleOf(film)} poster={film.thumbnailUrl} href={filmHref(film)}
            url={watchUrl(film)} upNext={upNext} onClose={() => setState(null)} />
    ) : null;

    return { play, player, playing: film || null };
}
