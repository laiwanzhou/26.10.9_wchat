<script setup lang="ts">
defineProps<{ name: string; size?: number }>();
const paths: Record<string, string> = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  book: "M4 4h6c2 0 2 1 2 2v15c0-2-2-3-4-3H4z M20 4h-6c-2 0-2 1-2 2v15c0-2 2-3 4-3h4z",
  learning: "m3 8 9-5 9 5-9 5-9-5z M6 10v7c4 3 8 3 12 0v-7 M21 8v9",
  vote: "M8 3h8v9H8z M6 9H4l-2 7v5h20v-5l-2-7h-2 M2 16h20 M9 7l2 2 3-3",
  image: "M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M16 7h.01",
  settings: "M4 7h16 M4 17h16 M8 4v6 M16 14v6",
  search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  arrow: "M5 12h14 M14 7l5 5-5 5",
  plus: "M12 5v14 M5 12h14",
  chevron: "m9 5 7 7-7 7",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  logout: "M9 4H4v16h5 M10 12h11 M17 8l4 4-4 4",
  check: "m5 12 4 4L19 6",
  upload: "M12 16V3 M7 8l5-5 5 5 M4 14v7h16v-7",
  clock: "M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  play: "m9 5 11 7-11 7z",
  menu: "M3 6h18 M3 12h18 M3 18h18",
};
</script>
<template>
  <svg
    :width="size || 20"
    :height="size || 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.65"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.grid" />
  </svg>
</template>
