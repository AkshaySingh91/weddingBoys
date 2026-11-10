/**
 * The /team page's data: the crew from /api/team (R2 uploads, managed in admin
 * › Website settings › Teams), grouped the way a film call sheet is.
 *
 * Falls back to the bundled portraits in lib/team.js when the API is down or
 * returns nobody, so the page never renders empty.
 */
import { FOUNDERS, MANAGING_DIRECTOR, CREW } from '@/lib/team.js';
import crewGroup from '@/Asset/Team/crew-group.jpg';

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Departments, in call-sheet order. First match on the role wins. */
export const DEPARTMENTS = [
    { key: 'camera', label: 'Camera', note: 'The films', match: /cinematograph|camera|video/i },
    { key: 'stills', label: 'Stills', note: 'The photographs', match: /photograph/i },
    { key: 'post', label: 'Post-production', note: 'The edit', match: /edit|colou?r|grad/i },
    { key: 'aerial', label: 'Aerial', note: 'From above', match: /drone|aerial/i },
];
const deptOf = (role = '') => DEPARTMENTS.find((d) => d.match.test(role))?.key || 'crew';

const tierOf = (m) => m.about?.tier
    || (/^founder$/i.test(m.about?.designation?.trim() || '') ? 'founder'
        : /managing director/i.test(m.about?.designation || '') ? 'md' : 'crew');

function fromApi(team) {
    const people = (team?.teamImages || [])
        .filter((m) => m.about?.name?.trim() && m.url)
        .sort((a, b) => (a.about?.order ?? 999) - (b.about?.order ?? 999))
        .map((m) => ({
            id: slug(m.about.name),
            name: m.about.name.trim(),
            role: m.about.designation?.trim() || 'Crew',
            tierKey: tierOf(m),
            line: m.about.line || null,
            placeholder: Boolean(m.about.placeholder),
            src: m.url,
            variants: m.variants || [],
            blurDataURL: m.blurDataURL || null,
        }));
    const group = (team?.bannerImage || [])[0];
    return {
        people,
        group: group ? { src: group.url, variants: group.variants || [], width: group.width || 1536, height: group.height || 1024, blurDataURL: group.blurDataURL || null } : null,
    };
}

function fromBundle() {
    const people = [
        ...FOUNDERS.map((p) => ({ ...p, tierKey: 'founder' })),
        { ...MANAGING_DIRECTOR, tierKey: 'md' },
        ...CREW.map((p) => ({ ...p, tierKey: 'crew' })),
    ].map((p) => ({ id: slug(p.name), name: p.name, role: p.role, tierKey: p.tierKey, line: p.line || null, placeholder: Boolean(p.placeholder), image: p.image }));
    return { people, group: { image: crewGroup, width: crewGroup.width, height: crewGroup.height } };
}

const TIER_LABEL = { founder: 'Founder', md: 'Managing Director' };

export function buildTeam(team) {
    const api = fromApi(team);
    const bundle = fromBundle();
    const people = api.people.length ? api.people : bundle.people;
    const group = api.group || bundle.group;
    const withTier = people.map((p) => ({
        ...p,
        dept: p.tierKey === 'crew' ? deptOf(p.role) : null,
        tier: TIER_LABEL[p.tierKey] || DEPARTMENTS.find((d) => d.key === deptOf(p.role))?.label || 'Crew',
    }));
    const founders = withTier.filter((p) => p.tierKey === 'founder');
    const md = withTier.find((p) => p.tierKey === 'md') || null;
    const crew = withTier.filter((p) => p.tierKey === 'crew');
    const departments = [...DEPARTMENTS, { key: 'crew', label: 'Crew', note: 'On set', match: null }]
        .map((d) => ({ key: d.key, label: d.label, note: d.note, people: crew.filter((p) => p.dept === d.key) }))
        .filter((d) => d.people.length);
    // Spotlight order: hierarchy, then the call sheet.
    const everyone = [...founders, ...(md ? [md] : []), ...departments.flatMap((d) => d.people)];
    return { founders, md, departments, everyone, group, count: everyone.length };
}
