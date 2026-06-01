<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  fetchJobOpening,
  fetchJoinUs,
  type JobOpeningRecord,
  type JobOpeningRequirementRecord,
  type JoinUsRecord,
  type JoinUsStepRecord,
  type JoinUsTipRecord,
} from '@/api/directus'
import { useLocale } from '@/composables/useLocale'
import { getTranslatedField } from '@/utils/translation'

const { t, locale } = useLocale()
const joinUs = ref<JoinUsRecord | null>(null)
const jobOpenings = ref<JobOpeningRecord[]>([])

onMounted(async () => {
  try {
    const res = await fetchJoinUs()
    joinUs.value = res.data ?? null
  } catch (e) {
    console.error('[JoinUsView] fetchJoinUs failed:', e)
  }

  try {
    const jobRes = await fetchJobOpening()
    jobOpenings.value = jobRes.data ?? []
  } catch (e) {
    console.error('[JoinUsView] fetchJobOpening failed:', e)
  }
})

function isJobOpeningActive(status: JobOpeningRecord['status']) {
  const value = String(status ?? '').toLowerCase()
  return status === true || value === 'true' || value === '1'
}

function getJobRequirements(record: JobOpeningRecord) {
  const baseRequirements = (
    Array.isArray(record.requirements) ? record.requirements : []
  ) as JobOpeningRequirementRecord[]
  const baseValues = baseRequirements
    .map((item) => String(item.value ?? ''))
    .filter(Boolean)

  if (locale.value === 'zh') return baseValues

  const translations = Array.isArray(record.translations) ? record.translations : []
  const langPrefix = locale.value === 'en' ? 'en' : 'zh'
  const langMatched = translations.find((item) =>
    String(item?.languages_code || '').toLowerCase().startsWith(langPrefix),
  )
  const fallbackTranslation = translations.find((item) => Array.isArray(item?.requirements))
  const translatedRequirements = (
    Array.isArray(langMatched?.requirements)
      ? langMatched.requirements
      : Array.isArray(fallbackTranslation?.requirements)
        ? fallbackTranslation.requirements
        : []
  ) as JobOpeningRequirementRecord[]

  return baseValues
    .map((value, index) => String(translatedRequirements[index]?.value ?? value))
    .filter(Boolean)
}

const contactEmail = computed(() => getTranslatedField(joinUs.value, 'email', locale.value))

const pageIntro = computed(() => getTranslatedField(joinUs.value, 'guideIntro', locale.value))

const visionTitle = computed(() => getTranslatedField(joinUs.value, 'guideTitle', locale.value))

const visionText = computed(() => getTranslatedField(joinUs.value, 'vision', locale.value))

const joinDescription = computed(() =>
  getTranslatedField(joinUs.value, 'joinDescription', locale.value),
)

function getJoinTranslationArray(field: 'steps' | 'tips') {
  const data = joinUs.value
  if (!data || locale.value === 'zh') return []

  const translations = Array.isArray(data.translations) ? data.translations : []
  const langPrefix = locale.value === 'en' ? 'en' : 'zh'
  const langMatched = translations.find((item) =>
    String(item?.languages_code || '').toLowerCase().startsWith(langPrefix),
  )
  const fallbackTranslation = translations.find((item) => Array.isArray(item?.[field]))
  const source = langMatched?.[field] ?? fallbackTranslation?.[field]

  return Array.isArray(source) ? source : []
}

const joinSteps = computed(() => {
  const data = joinUs.value
  if (!data) return [] as Array<{ title: string; description: string }>

  const baseSteps = (Array.isArray(data.steps) ? data.steps : []) as JoinUsStepRecord[]
  if (locale.value === 'zh') {
    return baseSteps.map((step) => ({
      title: String(step.stepTitle ?? step.stepsTitle ?? ''),
      description: String(step.stepDescription ?? ''),
    }))
  }

  const translatedSteps = getJoinTranslationArray('steps') as JoinUsStepRecord[]

  return baseSteps.map((step, index) => {
    const tr = translatedSteps[index]
    return {
      title: String(tr?.stepsTitle ?? tr?.stepTitle ?? step.stepTitle ?? step.stepsTitle ?? ''),
      description: String(tr?.stepDescription ?? step.stepDescription ?? ''),
    }
  })
})

const joinTips = computed(() => {
  const data = joinUs.value
  if (!data) return [] as string[]

  const baseTips = (Array.isArray(data.tips) ? data.tips : []) as JoinUsTipRecord[]
  if (locale.value === 'zh') {
    return baseTips.map((tip) => String(tip.tipValue ?? '')).filter(Boolean)
  }

  const translatedTips = getJoinTranslationArray('tips') as JoinUsTipRecord[]

  return baseTips
    .map((tip, index) => String(translatedTips[index]?.tipValue ?? tip.tipValue ?? ''))
    .filter(Boolean)
})

const openPositions = computed(() =>
  jobOpenings.value
    .filter((item) => isJobOpeningActive(item.status))
    .map((item) => ({
      id: item.id,
      title: getTranslatedField(item, 'title', locale.value),
      type: getTranslatedField(item, 'type', locale.value),
      research: getTranslatedField(item, 'research', locale.value),
      requirements: getJobRequirements(item),
    })),
)
</script>

<template>
  <div class="space-y-16 text-base sm:space-y-20 sm:text-lg">
    <header class="border-b border-slate-200/80 pb-8 sm:pb-10">
      <span class="font-mono text-sm font-medium tracking-widest text-cyan-600 uppercase">
        {{ t({ zh: '招募', en: 'Careers' }) }}
      </span>
      <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        {{ t({ zh: '加入我们', en: 'Join Us' }) }}
      </h1>
      <p
        v-if="pageIntro"
        class="mt-4 max-w-2xl text-lg leading-relaxed text-slate-500 sm:text-xl"
      >
        {{ pageIntro }}
      </p>
    </header>

    <!-- Vision -->
    <section
      class="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-7 text-white shadow-xl sm:p-10 lg:p-12"
      aria-labelledby="vision-heading"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.06)_1px,transparent_1px)] bg-[size:32px_32px]"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div class="relative">
        <span class="font-mono text-sm font-medium tracking-widest text-cyan-400 uppercase">
          {{ t({ zh: '愿景', en: 'Vision' }) }}
        </span>
        <h2 v-if="visionTitle" id="vision-heading" class="mt-3 text-2xl font-bold sm:text-3xl">
          {{ visionTitle }}
        </h2>
        <p
          v-if="visionText"
          class="mt-5 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-slate-300 sm:text-xl sm:leading-relaxed"
        >
          {{ visionText }}
        </p>
        <a
          v-if="contactEmail"
          :href="`mailto:${contactEmail}`"
          class="mt-8 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          {{ contactEmail }}
        </a>
      </div>
    </section>

    <!-- Application guide -->
    <section aria-labelledby="guide-heading">
      <div>
        <span class="font-mono text-sm font-medium tracking-widest text-cyan-600 uppercase">
          {{ t({ zh: '申请流程', en: 'How to Apply' }) }}
        </span>
        <h2 id="guide-heading" class="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {{ t({ zh: '投递指南', en: 'Application Guide' }) }}
        </h2>
        <p v-if="joinDescription" class="mt-4 max-w-2xl text-lg text-slate-600 sm:text-xl">
          {{ joinDescription }}
        </p>
      </div>

      <div v-if="joinSteps.length" class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <div
          v-for="(step, index) in joinSteps"
          :key="`${step.title}-${index}`"
          class="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-7"
        >
          <span
            class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-cyan-950 font-mono text-lg font-bold text-cyan-300"
          >
            {{ index + 1 }}
          </span>
          <h3 class="mt-4 text-lg font-semibold text-slate-900 sm:text-xl">
            {{ step.title }}
          </h3>
          <p class="mt-3 text-base leading-relaxed text-slate-600">
            {{ step.description }}
          </p>
        </div>
      </div>

      <div
        class="mt-8 rounded-2xl border border-cyan-200/60 bg-gradient-to-br from-cyan-50 to-white p-6 sm:p-8"
      >
        <h3 class="text-lg font-semibold text-slate-900 sm:text-xl">
          {{ t({ zh: '温馨提示', en: 'Tips' }) }}
        </h3>
        <ul v-if="joinTips.length" class="mt-4 space-y-3">
          <li
            v-for="(tip, idx) in joinTips"
            :key="idx"
            class="flex gap-3 text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" aria-hidden="true" />
            {{ tip }}
          </li>
        </ul>
        <div
          v-if="contactEmail"
          class="mt-6 flex flex-wrap items-center gap-3 border-t border-cyan-200/50 pt-6"
        >
          <span class="text-base font-medium text-slate-700">
            {{ t({ zh: '统一投递邮箱：', en: 'Submit to: ' }) }}
          </span>
          <a
            :href="`mailto:${contactEmail}`"
            class="font-mono text-base font-semibold text-cyan-800 underline-offset-2 hover:underline sm:text-lg"
          >
            {{ contactEmail }}
          </a>
        </div>
      </div>
    </section>

    <!-- Positions -->
    <section aria-labelledby="positions-heading">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span class="font-mono text-sm font-medium tracking-widest text-cyan-600 uppercase">
            {{ t({ zh: '岗位', en: 'Positions' }) }}
          </span>
          <h2
            id="positions-heading"
            class="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            {{ t({ zh: '招聘岗位', en: 'Open Positions' }) }}
          </h2>
        </div>
        <p class="text-base text-slate-500 sm:text-lg">
          {{ openPositions.length }}
          {{ t({ zh: ' 个岗位开放中', en: ' open roles' }) }}
        </p>
      </div>

      <div class="mt-10 space-y-6 sm:space-y-8">
        <article
          v-for="position in openPositions"
          :key="position.id"
          class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:border-cyan-200/60 hover:shadow-md"
        >
          <div
            class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-cyan-50/30 px-6 py-5 sm:px-8"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h3 class="text-xl font-bold text-slate-900 sm:text-2xl">
                {{ position.title }}
              </h3>
              <span
                class="w-fit shrink-0 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-sm font-medium text-cyan-800 sm:text-base"
              >
                {{ position.type }}
              </span>
            </div>
            <p class="mt-3 text-base text-cyan-800 sm:text-lg">
              <span class="font-medium text-slate-700">
                {{ t({ zh: '研究方向：', en: 'Research focus: ' }) }}
              </span>
              {{ position.research }}
            </p>
          </div>

          <div class="px-6 py-6 sm:px-8 sm:py-8">
            <h4
              class="font-mono text-sm font-semibold tracking-widest text-slate-500 uppercase"
            >
              {{ t({ zh: '岗位要求', en: 'Requirements' }) }}
            </h4>
            <ul class="mt-4 space-y-3">
              <li
                v-for="(req, idx) in position.requirements"
                :key="idx"
                class="flex gap-3 text-base leading-relaxed text-slate-600 sm:text-lg"
              >
                <span
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-600"
                >
                  {{ idx + 1 }}
                </span>
                {{ req }}
              </li>
            </ul>
            <a
              v-if="contactEmail"
              :href="`mailto:${contactEmail}?subject=${encodeURIComponent(position.title)}`"
              class="mt-8 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-base font-medium text-cyan-800 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {{ t({ zh: '申请该岗位', en: 'Apply for this role' }) }}
            </a>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
