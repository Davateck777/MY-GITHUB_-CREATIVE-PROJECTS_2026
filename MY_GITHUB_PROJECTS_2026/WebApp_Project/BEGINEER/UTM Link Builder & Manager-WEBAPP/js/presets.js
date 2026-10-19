/* --------------------------------------------------------------------------
   CHANNEL PRESETS: Reusable naming patterns for recurring personal-brand
   channels. Users can change any filled value after applying a preset.
   -------------------------------------------------------------------------- */
export const PRESETS = [
  { id: 'instagram-bio', name: 'Instagram Bio', values: { utm_source: 'instagram', utm_medium: 'social', utm_campaign: 'evergreen-bio', utm_content: 'bio-link' } },
  { id: 'linkedin-post', name: 'LinkedIn Post', values: { utm_source: 'linkedin', utm_medium: 'social', utm_campaign: 'thought-leadership', utm_content: 'post' } },
  { id: 'newsletter', name: 'Weekly Newsletter', values: { utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'weekly-newsletter', utm_content: 'primary-cta' } },
  { id: 'youtube', name: 'YouTube Description', values: { utm_source: 'youtube', utm_medium: 'video', utm_campaign: 'evergreen-video', utm_content: 'description-link' } },
  { id: 'podcast', name: 'Podcast Show Notes', values: { utm_source: 'podcast', utm_medium: 'audio', utm_campaign: 'podcast-episode', utm_content: 'show-notes' } },
  { id: 'guest-feature', name: 'Guest Feature', values: { utm_source: 'guest-feature', utm_medium: 'referral', utm_campaign: 'guest-appearance', utm_content: 'author-bio' } }
];

/* PRESET LOOKUP: Provides a small pure helper for the form controller. */
export function getPreset(id) { return PRESETS.find((preset) => preset.id === id); }
