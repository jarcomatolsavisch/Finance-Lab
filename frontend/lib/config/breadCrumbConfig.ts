const breadCrumbConfig = {
  'module-a': {
    name: 'ModuleA',
    children: {
      demo1: {
        name: 'Demo1',
        path: '/module-a/demo1',
      },
      demo2: {
        name: 'Demo2',
        path: '/module-a/demo2',
      },
    },
  },
  'module-b': {
    name: 'ModuleB',
    children: {
      demo1: {
        name: 'Demo1',
        path: '/module-b/demo1',
      },
      demo2: {
        name: 'Demo2',
        path: '/module-b/demo2',
      },
    },
  },
};

export default breadCrumbConfig;
