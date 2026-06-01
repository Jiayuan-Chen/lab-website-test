<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { directusPublicAssetUrl, fetchNews, type NewsRecord } from '@/api/directus'
import { useLocale } from '@/composables/useLocale'
import { getTranslatedField } from '@/utils/translation'

const route = useRoute()
const { t, locale } = useLocale()
const newsList = ref<NewsRecord[]>([])
const currentImageIndex = ref(0)

const article = computed(() =>
  newsList.value.find((item) => String(item.id) === String(route.params.id)),
)

const articleImageUrls = computed(() => {
  const item = article.value
  if (!item) return []
  if (item.image) return [directusPublicAssetUrl(String(item.image))]
  return (item.imgList ?? []).map((img) => directusPublicAssetUrl(String(img))).filter(Boolean)
})

function getArticleField(field: 'title' | 'description' | 'newsContent' | 'date') {
  return getTranslatedField(article.value, field, locale.value)
}

const paragraphs = computed(() => {
  if (!article.value) return []
  const text = getArticleField('newsContent')
  return text.split(/\n\n+/).filter(Boolean)
})

function showPrevImage() {
  if (!articleImageUrls.value.length) return
  currentImageIndex.value =
    (currentImageIndex.value - 1 + articleImageUrls.value.length) % articleImageUrls.value.length
}

function showNextImage() {
  if (!articleImageUrls.value.length) return
  currentImageIndex.value = (currentImageIndex.value + 1) % articleImageUrls.value.length
}

async function loadNews() {
  try {
    const res = await fetchNews()
    newsList.value = res?.data ?? []
  } catch (e) {
    console.error('[NewsDetailView] fetchNews failed:', e)
  }
}

watch(
  () => route.params.id,
  () => {
    currentImageIndex.value = 0
  },
)

onMounted(loadNews)
</script>

<template>
  <div v-if="article" class="space-y-10 text-base sm:space-y-12 sm:text-lg">
    <RouterLink
      to="/news"
      class="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-4 py-2.5 text-base font-medium text-slate-700 shadow-sm transition-all hover:border-cyan-200 hover:bg-cyan-50/50 hover:text-cyan-800"
    >
      <svg
        class="h-5 w-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {{ t({ zh: '返回新闻列表', en: 'Back to news' }) }}
    </RouterLink>

    <article>
      <header>
        <time class="font-mono text-sm text-cyan-700 sm:text-base">
          {{ getArticleField('date') }}
        </time>
        <h1
          class="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl"
        >
          {{ getArticleField('title') }}
        </h1>
        <p class="mt-4 max-w-3xl text-lg leading-relaxed text-slate-500 sm:text-xl">
          {{ getArticleField('description') }}
        </p>
      </header>

      <div class="relative mt-10 overflow-hidden rounded-2xl shadow-xl shadow-slate-200/60">
        <img
          :src="articleImageUrls[currentImageIndex]"
          :alt="getArticleField('title')"
          class="aspect-[21/9] w-full object-cover sm:aspect-[2/1]"
        />
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent"
          aria-hidden="true"
        />
        <button
          v-if="articleImageUrls.length > 1"
          type="button"
          class="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-700 shadow-md transition hover:bg-white"
          :aria-label="t({ zh: '上一张', en: 'Previous image' })"
          @click.prevent="showPrevImage"
        >
          ‹
        </button>
        <button
          v-if="articleImageUrls.length > 1"
          type="button"
          class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-700 shadow-md transition hover:bg-white"
          :aria-label="t({ zh: '下一张', en: 'Next image' })"
          @click.prevent="showNextImage"
        >
          ›
        </button>
      </div>
      <div
        v-if="articleImageUrls.length > 1"
        class="mt-4 flex gap-3 overflow-x-auto pb-1"
      >
        <button
          v-for="(img, idx) in articleImageUrls"
          :key="`${article?.id}-${idx}`"
          type="button"
          class="shrink-0 overflow-hidden rounded-lg border-2 transition"
          :class="idx === currentImageIndex ? 'border-cyan-500' : 'border-transparent'"
          @click="currentImageIndex = idx"
        >
          <img :src="img" :alt="`${getArticleField('title')}-${idx + 1}`" class="h-16 w-28 object-cover" />
        </button>
      </div>

      <div
        class="prose prose-slate mt-10 max-w-none rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white p-6 sm:p-10 lg:p-12"
      >
        <p
          v-for="(para, i) in paragraphs"
          :key="i"
          class="mb-6 text-lg leading-relaxed text-slate-600 last:mb-0 sm:text-xl sm:leading-relaxed"
        >
          {{ para }}
        </p>
      </div>
    </article>

    <div class="border-t border-slate-200/80 pt-8">
      <RouterLink
        to="/news"
        class="inline-flex items-center gap-2 text-base font-medium text-cyan-700 transition-colors hover:text-cyan-900"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {{ t({ zh: '查看更多新闻', en: 'More news' }) }}
      </RouterLink>
    </div>
  </div>

  <div
    v-else
    class="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/50 px-6 py-20 text-center"
  >
    <p class="text-xl font-semibold text-slate-900 sm:text-2xl">
      {{ t({ zh: '未找到该新闻', en: 'Article not found' }) }}
    </p>
    <p class="mt-3 text-base text-slate-500 sm:text-lg">
      {{ t({ zh: '该链接可能已失效或文章 ID 不正确。', en: 'The link may be invalid or the article ID is incorrect.' }) }}
    </p>
    <RouterLink
      to="/news"
      class="mt-8 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
    >
      {{ t({ zh: '返回新闻列表', en: 'Back to news' }) }}
    </RouterLink>
  </div>
</template>
