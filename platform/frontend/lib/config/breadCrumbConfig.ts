import navConfig from './navConfig';

type BreadCrumbEntry = {
  sectionLabel: string;
  label: string;
  path: string;
};

// Derived from navConfig so nav items and breadcrumbs stay in sync from one source.
// Keyed by each child's URL path (not by section/child key) since a nav module's
// key is a logical grouping and doesn't necessarily match the URL's path segments.
const breadCrumbConfig: Record<string, BreadCrumbEntry> = Object.fromEntries(
  navConfig.flatMap(section =>
    section.children.map(child => [
      child.path,
      { sectionLabel: section.label, label: child.label, path: child.path },
    ])
  )
);

export default breadCrumbConfig;
