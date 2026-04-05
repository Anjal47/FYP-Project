export function createThemedStyles(baseStyles, theme, isDark) {
  if (!isDark) return baseStyles;

  const colorMap = {
    "#ffffff": theme.surface,
    "#fff": theme.surface,
    "#f4f4f4": theme.background,
    "#f5f5f5": theme.background,
    "#f5f7fb": theme.background,
    "#f7f7f7": theme.background,
    "#f8fafc": theme.surfaceSoft,
    "#f8f8f8": theme.surfaceSoft,
    "#f2f2f2": theme.surfaceSoft,
    "#f2f4f7": theme.surfaceSoft,
    "#fff4e8": theme.surfaceSoft,
    "#fff3e8": theme.surfaceSoft,
    "#fff1e4": theme.surfaceSoft,
    "#fff4e5": theme.surfaceSoft,
    "#f6f6f6": theme.surfaceSoft,
    "#fdecec": "rgba(229, 57, 53, 0.16)",
    "#eaf7ee": "rgba(67, 160, 71, 0.16)",
    "#e5e7eb": theme.border,
    "#bfc7d5": theme.border,
    "#111": theme.text,
    "#111111": theme.text,
    "#111827": theme.text,
    "#222": theme.text,
    "#222222": theme.text,
    "#333": theme.text,
    "#374151": theme.text,
    "#444": theme.text,
    "#555": theme.muted,
    "#666": theme.muted,
    "#6b7280": theme.muted,
    "#777": theme.muted,
    "#888": theme.muted,
    "#999": theme.muted,
    "#9a9a9a": theme.muted,
    "#b0b0b0": theme.muted,
    "#ddd": theme.border,
    "#e3e3e3": theme.border,
    "#ececec": theme.border,
    "#efefef": theme.border,
    "#ededed": theme.border,
  };

  const visit = (value, key) => {
    if (Array.isArray(value)) {
      return value.map((item) => visit(item, key));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([childKey, childValue]) => [
          childKey,
          visit(childValue, childKey),
        ])
      );
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (key === "shadowColor" && normalized === "#000") {
        return "#000";
      }

      if (colorMap[normalized]) {
        return colorMap[normalized];
      }
    }

    return value;
  };

  return visit(baseStyles);
}
