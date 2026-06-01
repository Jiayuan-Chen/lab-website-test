<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  fetchProject,
  getDirectusAssetFallbackPair,
  onDirectusAssetErrorWithToken,
  type ProjectRecord,
} from '@/api/directus'
import { useLocale } from '@/composables/useLocale'
import { getTranslatedField } from '@/utils/translation'

const { t, locale } = useLocale()
const projects = ref<ProjectRecord[]>([])

onMounted(async () => {
  try {
    const res = await fetchProject()
    projects.value = res.data ?? []
  } catch (e) {
    console.error('[ProjectsView] fetchProject failed:', e)
  }
})

const featuredProject = computed(() => projects.value.find((p) => p.type === 'main'))

const otherProjects = computed(() => projects.value.filter((p) => p.type === 'other'))

const pageDescription = computed(() => {
  const main = featuredProject.value
  if (!main) return ''
  return getTranslatedField(main, 'projectDescForMain', locale.value)
})

function getProjectTitle(project: ProjectRecord) {
  return getTranslatedField(project, 'title', locale.value)
}

function getProjectDescription(project: ProjectRecord) {
  return getTranslatedField(project, 'content', locale.value)
}

function getProjectVideoUrl(project: ProjectRecord) {
  return project.video ? getDirectusAssetFallbackPair(project.video).publicUrl : ''
}

function onVideoError(event: Event, project: ProjectRecord) {
  if (project.video) onDirectusAssetErrorWithToken(event, project.video)
}
</script>

<template>
  <div class="space-y-16 text-base sm:space-y-20 sm:text-lg">
    <header class="border-b border-slate-200/80 pb-8 sm:pb-10">
      <span class="font-mono text-sm font-medium tracking-widest text-cyan-600 uppercase">
        {{ t({ zh: '成果展示', en: 'Showcase' }) }}
      </span>
      <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        {{ t({ zh: '研究项目', en: 'Research Projects' }) }}
      </h1>
      <p
        v-if="pageDescription"
        class="mt-4 max-w-2xl text-lg leading-relaxed text-slate-500 sm:text-xl"
      >
        {{ pageDescription }}
      </p>
    </header>

    <!-- Featured: main project video -->
    <section v-if="featuredProject" aria-labelledby="featured-heading">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            class="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-800"
          >
            {{ t({ zh: '主项目', en: 'Featured Project' }) }}
          </span>
          <h2
            id="featured-heading"
            class="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            {{ getProjectTitle(featuredProject) }}
          </h2>
        </div>
      </div>

      <article
        class="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/60"
      >
        <div class="relative aspect-video w-full overflow-hidden bg-slate-900">
          <video
            v-if="getProjectVideoUrl(featuredProject)"
            :src="getProjectVideoUrl(featuredProject)"
            class="absolute inset-0 h-full w-full object-contain"
            controls
            preload="metadata"
            playsinline
            :aria-label="getProjectTitle(featuredProject)"
            @error="onVideoError($event, featuredProject)"
          />
        </div>

        <div class="border-t border-slate-100 p-6 sm:p-8 lg:p-10">
          <p class="text-lg leading-relaxed text-slate-600 sm:text-xl sm:leading-relaxed">
            {{ getProjectDescription(featuredProject) }}
          </p>
        </div>
      </article>
    </section>

    <!-- Other projects: alternating text / video layout -->
    <section aria-labelledby="projects-list-heading">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span class="font-mono text-sm font-medium tracking-widest text-cyan-600 uppercase">
            {{ t({ zh: '更多项目', en: 'More Projects' }) }}
          </span>
          <h2
            id="projects-list-heading"
            class="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            {{ t({ zh: '其他项目', en: 'Other Projects' }) }}
          </h2>
        </div>
        <p class="text-base text-slate-500 sm:text-lg">
          {{ otherProjects.length }}
          {{ t({ zh: ' 个项目', en: ' projects' }) }}
        </p>
      </div>

      <div class="mt-10 space-y-8 sm:space-y-10">
        <article
          v-for="(project, index) in otherProjects"
          :key="project.id"
          class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:border-cyan-200/60 hover:shadow-lg sm:flex-row"
        >
          <!-- 偶数：描述左 / 媒体右；奇数：媒体左 / 描述右 -->
          <div
            class="flex flex-1 flex-col justify-center p-6 sm:p-8 lg:p-10"
            :class="index % 2 === 0 ? 'order-1 sm:order-1' : 'order-2 sm:order-2'"
          >
            <h3
              class="text-xl font-semibold leading-snug text-slate-900 transition-colors group-hover:text-cyan-800 sm:text-2xl"
            >
              {{ getProjectTitle(project) }}
            </h3>
            <p class="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-relaxed">
              {{ getProjectDescription(project) }}
            </p>
          </div>

          <div
            class="relative aspect-video w-full shrink-0 self-center overflow-hidden bg-slate-900 sm:w-2/5 lg:w-[42%]"
            :class="index % 2 === 0 ? 'order-2 sm:order-2' : 'order-1 sm:order-1'"
          >
            <video
              v-if="getProjectVideoUrl(project)"
              :src="getProjectVideoUrl(project)"
              class="absolute inset-0 h-full w-full object-contain"
              controls
              preload="metadata"
              playsinline
              :aria-label="getProjectTitle(project)"
              @error="onVideoError($event, project)"
            />
            <span
              class="absolute top-3 left-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 backdrop-blur-sm sm:text-sm"
            >
              {{ t({ zh: '视频', en: 'Video' }) }}
            </span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
