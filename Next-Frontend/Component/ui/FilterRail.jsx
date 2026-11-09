'use client';

/**
 * FilterRail — one row of filter chips.
 *
 * On a phone the chips stay on ONE line and scroll sideways, with the edges
 * faded so it is obvious there is more; wrapping five chips into three rows
 * pushed the gallery a screen down. From `sm` up they sit centred (or start-
 * aligned) and wrap only if they truly have to.
 *
 *   <FilterRail label="Filter by ceremony" options={['All', 'Haldi']}
 *               value={active} onChange={setActive} />
 */
export default function FilterRail({ label, options, value, onChange, align = 'center', className = '' }) {
    return (
        <div
            role="group"
            aria-label={label}
            className={`-mx-5 overflow-x-auto scrollbar-none sm:mx-0 sm:overflow-visible
                        [mask-image:linear-gradient(to_right,transparent,#000_20px,#000_calc(100%-28px),transparent)]
                        sm:[mask-image:none] ${className}`}
        >
            <div className={`flex w-max gap-2 px-5 py-1 sm:w-auto sm:flex-wrap sm:px-0
                             ${align === 'center' ? 'sm:justify-center' : 'sm:justify-start'}`}>
                {options.map((option) => {
                    const key = typeof option === 'string' ? option : option.value;
                    const text = typeof option === 'string' ? option : option.label;
                    const on = value === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => onChange(key)}
                            className={`inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full border px-4
                                        text-[13px] font-medium transition-colors duration-micro ease-standard focus-ring
                                        ${on
                                            ? 'border-ink bg-ink text-ground shadow-sm'
                                            : 'border-ink/10 bg-ground-raised text-ink-secondary hover:border-ink/25 hover:text-ink'}`}
                        >
                            {text}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
