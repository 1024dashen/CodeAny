<template>
  <NDropdown
    v-if="iconOnly"
    trigger="click"
    :options="dropdownOptions"
    @select="handleDropdownSelect"
  >
    <button type="button" class="icon-btn" :title="t('lang.label')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path
          d="M3 12h18M12 3c2.5 2.8 4 6 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6-4 9s1.5 6.2 4 9"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </NDropdown>
  <NSelect
    v-else
    class="language-switcher"
    :class="{ compact, block }"
    :value="settingsStore.settings.locale"
    :options="localeOptions"
    :size="compact ? 'small' : 'medium'"
    :round="compact"
    :consistent-menu-width="false"
    :placeholder="t('lang.label')"
    @update:value="handleChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NDropdown, NSelect, type DropdownOption, type SelectOption } from 'naive-ui';
import { useSettingsStore } from '@/stores/settings';
import { SUPPORTED_LOCALES } from '@/i18n';
import type { AppLocale } from '@/types';

withDefaults(defineProps<{
  compact?: boolean;
  block?: boolean;
  iconOnly?: boolean;
}>(), {
  compact: false,
  block: false,
  iconOnly: false,
});

const { t } = useI18n();
const settingsStore = useSettingsStore();

const localeOptions = computed<SelectOption[]>(() =>
  SUPPORTED_LOCALES.map(loc => ({
    label: t(`lang.${loc}`),
    value: loc,
  })),
);

const dropdownOptions = computed<DropdownOption[]>(() =>
  SUPPORTED_LOCALES.map(loc => ({
    label: t(`lang.${loc}`),
    key: loc,
  })),
);

function handleChange(value: string) {
  settingsStore.setLocale(value as AppLocale);
}

function handleDropdownSelect(key: string) {
  handleChange(key);
}
</script>

<style scoped>
.language-switcher {
  width: auto;
}

.language-switcher.compact {
  width: 148px;
}

.language-switcher.block {
  width: 100%;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.icon-btn:hover {
  color: var(--text-primary);
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}
</style>
