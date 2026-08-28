import navConfig from './navConfig';

type BreadCrumbNode = {
  name: string;
  path?: string;
  children?: Record<string, BreadCrumbNode>;
};

// Derived from navConfig so nav items and breadcrumbs stay in sync from one source.
const breadCrumbConfig: Record<string, BreadCrumbNode> = Object.fromEntries(
  navConfig.map(section => [
    section.key,
    {
      name: section.label,
      children: Object.fromEntries(
        section.children.map(child => [child.key, { name: child.label, path: child.path }])
      ),
    },
  ])
);

export default breadCrumbConfig;
