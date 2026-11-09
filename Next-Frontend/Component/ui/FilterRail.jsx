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
            <div className={`flex w-max gap-2 px-5 py-1.5 sm:w-auto sm:flex-wrap sm:px-0
                             ${align === 'center' ? 'sm:justify-center' : 'sm:justify-start'}`}>
                {options.map((option) => {
                    const key = typeof option === 'string' ? option : option.value;
                    const text = typeof option === 'string' ? option : option.label;
                    const count = typeof option === 'string' ? null : option.count;
                    const on = value === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => onChange(key)}
                            className={`inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border text-[13.5px]
                                        font-semibold transition-colors duration-micro ease-standard focus-ring
                                        ${count != null ? 'pl-1.5 pr-4' : 'px-4'}
                                        ${on
                                            ? 'border-ink bg-ink text-ground shadow-[0_8px_18px_-10px_rgba(51,22,26,0.7)]'
                                            : 'border-ink/[0.08] bg-ground-raised text-ink-secondary hover:border-ink/20 hover:text-ink'}`}
                        >
                            {count != null && (
                                <span className={`grid h-8 min-w-8 place-items-center rounded-full px-2 text-[12px] tabular-nums
                                                  ${on ? 'bg-ground text-ink' : 'bg-ink/[0.05] text-ink'}`}>
                                    {count}
                                </span>
                            )}
                            {text}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
