import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import {
  MAIN_SECTIONS,
  getSectionForPath,
  isNavGroup,
  flattenSectionEntries,
  type MainSectionId,
  type SectionEntry,
} from '../navigation/enterpriseNav';
import type { NavItem } from '../navigation/menuConfig';

function filterSectionEntries(
  entries: SectionEntry[],
  filterItem: (item: NavItem) => boolean,
): SectionEntry[] {
  return entries
    .map((entry) => {
      if (isNavGroup(entry)) {
        const items = entry.items.filter(filterItem);
        return items.length > 0 ? { ...entry, items } : null;
      }
      return filterItem(entry) ? entry : null;
    })
    .filter((entry): entry is SectionEntry => entry !== null);
}

export function useEnterpriseNav() {
  const location = useLocation();
  const role = useAuthStore((s) => s.user?.role ?? 'USER');
  const canAccess = useUiStore((s) => s.canAccess);

  const filterItem = (item: NavItem) => canAccess(item.minRole, item.advancedOnly, role);

  const visibleSections = useMemo(
    () =>
      MAIN_SECTIONS
        .filter((s) => canAccess(s.minRole, s.advancedOnly, role))
        .map((section) => ({
          ...section,
          items: filterSectionEntries(section.items, filterItem),
        }))
        .filter((s) => s.items.length > 0),
    [role, canAccess],
  );

  const activeSectionId: MainSectionId = getSectionForPath(location.pathname);

  const activeSection =
    visibleSections.find((s) => s.id === activeSectionId) ?? visibleSections[0];

  const submenuItems = activeSection ? flattenSectionEntries(activeSection.items) : [];

  const defaultPathForSection = (sectionId: MainSectionId): string => {
    const section = visibleSections.find((s) => s.id === sectionId);
    if (!section) return '/';
    const flat = flattenSectionEntries(section.items);
    return flat[0]?.path ?? '/';
  };

  return {
    visibleSections,
    activeSectionId,
    activeSection,
    submenuItems,
    defaultPathForSection,
    currentPath: location.pathname,
  };
}
