/**
 * Nav icons.
 *
 * The masthead this replaces had an icon against every item and the redesign
 * dropped them, which flattened the bar into a row of plain links. They carry
 * real weight here: a wedding studio's navigation is browsed, not operated, and
 * a small mark gives each destination a face.
 */
import { FiVideo, FiCamera, FiMapPin, FiUsers, FiBookOpen, FiMessageSquare } from 'react-icons/fi';

const ICONS = {
    film: FiVideo,
    camera: FiCamera,
    pin: FiMapPin,
    users: FiUsers,
    journal: FiBookOpen,
    chat: FiMessageSquare,
};

export default function NavIcon({ name, className = '' }) {
    const Icon = ICONS[name];
    if (!Icon) return null;
    return <Icon aria-hidden="true" className={className} />;
}
