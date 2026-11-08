import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const title = searchParams.get('title') || 'Stories of Love, Light & Cinema';
        const category = searchParams.get('category') || 'Real Wedding';
        const city = searchParams.get('city') || '';
        const venue = searchParams.get('venue') || '';
        const readingTime = searchParams.get('readingTime') || '';

        const badgeText = [category, city].filter(Boolean).join(' • ').toUpperCase();
        const venueText = venue ? `Filmed at ${venue}${city ? `, ${city}` : ''}` : (city ? `Filmed in ${city}` : '');

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: '#12100E',
                        backgroundImage:
                            'radial-gradient(circle at 85% 15%, rgba(194, 149, 85, 0.25) 0%, transparent 50%), radial-gradient(circle at 15% 85%, rgba(140, 83, 43, 0.2) 0%, transparent 45%)',
                        padding: '60px 72px',
                        fontFamily: 'serif',
                        position: 'relative',
                        border: '1px solid rgba(194, 149, 85, 0.25)',
                    }}
                >
                    {/* Top luxury accent rule */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '5px',
                            background: 'linear-gradient(90deg, #8C532B 0%, #C29555 50%, #8C532B 100%)',
                        }}
                    />

                    {/* Studio Header Bar */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span
                                style={{
                                    fontFamily: 'sans-serif',
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    letterSpacing: '0.24em',
                                    color: '#F7F4EF',
                                    textTransform: 'uppercase',
                                }}
                            >
                                THE WEDDING VACHAN
                            </span>
                            <span
                                style={{
                                    fontFamily: 'sans-serif',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    letterSpacing: '0.18em',
                                    color: '#C29555',
                                    textTransform: 'uppercase',
                                    marginTop: '4px',
                                }}
                            >
                                Fine Art Cinematography & Photography
                            </span>
                        </div>

                        {badgeText && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px 20px',
                                    borderRadius: '999px',
                                    backgroundColor: 'rgba(194, 149, 85, 0.12)',
                                    border: '1px solid rgba(194, 149, 85, 0.35)',
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: 'sans-serif',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        letterSpacing: '0.14em',
                                        color: '#E5DCD3',
                                    }}
                                >
                                    {badgeText}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Story Title & Venue Container */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            maxWidth: '1020px',
                            margin: 'auto 0',
                        }}
                    >
                        <h1
                            style={{
                                fontSize: title.length > 70 ? '46px' : title.length > 40 ? '54px' : '62px',
                                lineHeight: 1.15,
                                fontWeight: 700,
                                color: '#FDFBF7',
                                margin: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textShadow: '0 4px 16px rgba(0,0,0,0.6)',
                            }}
                        >
                            {title}
                        </h1>

                        {venueText && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: '#C29555',
                                    }}
                                />
                                <span
                                    style={{
                                        fontFamily: 'sans-serif',
                                        fontSize: '18px',
                                        fontWeight: 500,
                                        color: '#C29555',
                                        letterSpacing: '0.04em',
                                    }}
                                >
                                    {venueText}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bottom Metadata Bar */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            paddingTop: '24px',
                            borderTop: '1px solid rgba(229, 220, 211, 0.15)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            {readingTime && (
                                <span
                                    style={{
                                        fontFamily: 'sans-serif',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        letterSpacing: '0.12em',
                                        color: '#A8A29E',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {readingTime} MIN READ
                                </span>
                            )}
                            <span
                                style={{
                                    fontFamily: 'sans-serif',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    letterSpacing: '0.08em',
                                    color: '#78716C',
                                }}
                            >
                                Editorial Journal
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                                style={{
                                    fontFamily: 'sans-serif',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    letterSpacing: '0.16em',
                                    color: '#C29555',
                                    textTransform: 'uppercase',
                                }}
                            >
                                THEWEDDINGVACHAN.COM
                            </span>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (err) {
        console.error('OG Image generation error:', err);
        return new Response('Failed to generate image', { status: 500 });
    }
}
