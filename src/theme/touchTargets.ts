/** Minimum interactive size (pt) for any tappable control. */
export const MIN_TOUCH = 44;

// Expands undersized IconButton hit areas (e.g. size=18-24) up to the ~44pt
// minimum touch target without changing the button's visual size.
export const HIT_SLOP_MIN = { top: 8, bottom: 8, left: 8, right: 8 };
